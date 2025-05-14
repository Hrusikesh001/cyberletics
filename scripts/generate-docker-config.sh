#!/bin/bash

# Sentrifense Docker Compose Configuration Generator
# This script creates secure Docker Compose configurations for production

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DEPLOY_DIR="$HOME/sentrifense"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yml"
NGINX_CONF_DIR="$DEPLOY_DIR/nginx"
NGINX_CONF_FILE="$NGINX_CONF_DIR/nginx.conf"
CERTBOT_DIR="$DEPLOY_DIR/certbot"
COMPOSE_OVERRIDE_FILE="$DEPLOY_DIR/docker-compose.override.yml"

# Create deployment directory if it doesn't exist
mkdir -p $DEPLOY_DIR
mkdir -p $NGINX_CONF_DIR
mkdir -p $CERTBOT_DIR/www
mkdir -p $CERTBOT_DIR/conf

# Check for required tools
echo -e "${GREEN}Checking for required tools...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Docker not found. Please install Docker before continuing.${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Docker Compose not found. Please install Docker Compose before continuing.${NC}"
  exit 1
fi

# Function to prompt for a value with default
prompt_value() {
  local prompt=$1
  local default=$2
  local var_name=$3
  
  echo -e "${YELLOW}$prompt${NC}"
  echo -n "[default: $default] "
  read value
  
  if [ -z "$value" ]; then
    value=$default
  fi
  
  # Use eval to assign to the variable name provided
  eval "$var_name='$value'"
}

# Ask for domain and other configuration
echo -e "${GREEN}Gathering configuration for production environment...${NC}"

# Domain settings
prompt_value "Enter your domain name (without protocol)" "example.com" "DOMAIN_NAME"
prompt_value "HTTP port" "80" "HTTP_PORT"
prompt_value "HTTPS port" "443" "HTTPS_PORT"
prompt_value "Enable HTTPS? (yes/no)" "yes" "ENABLE_HTTPS"

# MongoDB settings
prompt_value "MongoDB data directory (absolute path)" "$DEPLOY_DIR/data/mongodb" "MONGO_DATA_DIR"
prompt_value "MongoDB database name" "sentrifense" "MONGO_DB_NAME"
prompt_value "MongoDB port" "27017" "MONGO_PORT"

# Gophish settings
prompt_value "Gophish admin port" "3333" "GOPHISH_ADMIN_PORT"
prompt_value "Gophish phishing port" "8080" "GOPHISH_PHISH_PORT"
prompt_value "Gophish data directory (absolute path)" "$DEPLOY_DIR/data/gophish" "GOPHISH_DATA_DIR"

# Create Docker Compose file
echo -e "${GREEN}Creating Docker Compose configuration...${NC}"

cat > $COMPOSE_FILE << EOL
version: '3.8'

services:
  # Frontend React application
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    networks:
      - sentrifense-network
    depends_on:
      - middleware
    # Ports configured in override file

  # Middleware Express application
  middleware:
    build:
      context: ./middleware
      dockerfile: Dockerfile
    restart: unless-stopped
    volumes:
      - middleware-logs:/app/logs
    networks:
      - sentrifense-network
    depends_on:
      - mongodb
      - gophish
    # Ports configured in override file
    # Environment variables will be provided by environment loader script

  # MongoDB database
  mongodb:
    image: mongo:6
    restart: unless-stopped
    volumes:
      - ${MONGO_DATA_DIR}:/data/db
    networks:
      - sentrifense-network
    # Ports configured in override file
    command: mongod --logpath=/dev/null # Disable MongoDB logging to console

  # Gophish phishing framework
  gophish:
    image: gophish/gophish:latest
    restart: unless-stopped
    volumes:
      - ${GOPHISH_DATA_DIR}:/opt/gophish/data
    networks:
      - sentrifense-network
    # Ports configured in override file

  # Nginx for SSL termination and web server (only used with HTTPS)
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ${NGINX_CONF_DIR}:/etc/nginx/conf.d
      - ${CERTBOT_DIR}/conf:/etc/letsencrypt
      - ${CERTBOT_DIR}/www:/var/www/certbot
    networks:
      - sentrifense-network
    # Ports configured in override file
    depends_on:
      - frontend

  # Certbot for SSL certificates (only used with HTTPS)
  certbot:
    image: certbot/certbot
    restart: unless-stopped
    volumes:
      - ${CERTBOT_DIR}/conf:/etc/letsencrypt
      - ${CERTBOT_DIR}/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"

networks:
  sentrifense-network:
    driver: bridge

volumes:
  middleware-logs:
    driver: local
EOL

# Create Docker Compose override file based on HTTPS setting
if [[ "$ENABLE_HTTPS" == "yes" ]] || [[ "$ENABLE_HTTPS" == "y" ]]; then
  cat > $COMPOSE_OVERRIDE_FILE << EOL
version: '3.8'

services:
  frontend:
    expose:
      - 80

  middleware:
    expose:
      - 5000
    environment:
      - PORT=5000
      - NODE_ENV=production
      - CLIENT_URL=https://${DOMAIN_NAME}

  mongodb:
    expose:
      - 27017

  gophish:
    ports:
      - "127.0.0.1:${GOPHISH_ADMIN_PORT}:3333"
      - "127.0.0.1:${GOPHISH_PHISH_PORT}:80"

  nginx:
    ports:
      - "${HTTP_PORT}:80"
      - "${HTTPS_PORT}:443"
    command: "/bin/sh -c 'while :; do sleep 6h & wait \$\${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"
EOL

  # Create NGINX configuration for HTTPS
  cat > $NGINX_CONF_FILE << EOL
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN_NAME};
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend static files
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header    Host                \$http_host;
        proxy_set_header    X-Real-IP           \$remote_addr;
        proxy_set_header    X-Forwarded-For     \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto   \$scheme;
    }

    # API requests
    location /api {
        proxy_pass http://middleware:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket connections
    location /socket.io {
        proxy_pass http://middleware:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

  # Create a script to initialize SSL certificates
  INIT_SSL_SCRIPT="$DEPLOY_DIR/init-ssl.sh"
  cat > $INIT_SSL_SCRIPT << EOL
#!/bin/bash
# Script to initialize SSL certificates for the first time

# Create dummy certificate for initial setup
mkdir -p ${CERTBOT_DIR}/conf/live/${DOMAIN_NAME}
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \\
  -keyout ${CERTBOT_DIR}/conf/live/${DOMAIN_NAME}/privkey.pem \\
  -out ${CERTBOT_DIR}/conf/live/${DOMAIN_NAME}/fullchain.pem \\
  -subj "/CN=${DOMAIN_NAME}"

# Create options-ssl-nginx.conf if it doesn't exist
if [ ! -f "${CERTBOT_DIR}/conf/options-ssl-nginx.conf" ]; then
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > ${CERTBOT_DIR}/conf/options-ssl-nginx.conf
fi

# Create strong DH parameters
if [ ! -f "${CERTBOT_DIR}/conf/ssl-dhparams.pem" ]; then
  openssl dhparam -out ${CERTBOT_DIR}/conf/ssl-dhparams.pem 2048
fi

# Start the services
cd ${DEPLOY_DIR}
${DEPLOY_DIR}/load-env.sh docker-compose up -d

echo "Waiting 10 seconds for services to start..."
sleep 10

# Request the real certificate
${DEPLOY_DIR}/load-env.sh docker-compose run --rm certbot \\
  certonly --webroot \\
  --webroot-path=/var/www/certbot \\
  --email admin@${DOMAIN_NAME} --agree-tos --no-eff-email \\
  -d ${DOMAIN_NAME}

# Reload nginx to apply the new certificate
${DEPLOY_DIR}/load-env.sh docker-compose exec nginx nginx -s reload
EOL
  chmod +x $INIT_SSL_SCRIPT

  echo -e "${GREEN}Created HTTPS configuration with Nginx SSL termination.${NC}"
  echo -e "${YELLOW}You'll need to run the init-ssl.sh script to initialize SSL certificates after setup.${NC}"
else
  # For non-HTTPS setup, expose services directly
  cat > $COMPOSE_OVERRIDE_FILE << EOL
version: '3.8'

services:
  frontend:
    ports:
      - "${HTTP_PORT}:80"

  middleware:
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
      - CLIENT_URL=http://${DOMAIN_NAME}

  mongodb:
    expose:
      - 27017

  gophish:
    ports:
      - "127.0.0.1:${GOPHISH_ADMIN_PORT}:3333"
      - "127.0.0.1:${GOPHISH_PHISH_PORT}:80"

  nginx:
    profiles: ["disabled"]  # Disable nginx service when not using HTTPS

  certbot:
    profiles: ["disabled"]  # Disable certbot service when not using HTTPS
EOL

  echo -e "${GREEN}Created HTTP configuration.${NC}"
  echo -e "${YELLOW}Warning: Running without HTTPS is not recommended for production.${NC}"
fi

# Create a .gitignore file to prevent secrets from being committed
GITIGNORE_FILE="$DEPLOY_DIR/.gitignore"
cat > $GITIGNORE_FILE << EOL
# Ignore sensitive files
.env
.env.*
.master.key
.secrets.vault

# Ignore data directories
data/
logs/

# Ignore certificates
certbot/

# Ignore node modules
node_modules/

# Ignore logs
*.log
EOL

# Create a script to restart all services
RESTART_SCRIPT="$DEPLOY_DIR/restart-services.sh"
cat > $RESTART_SCRIPT << EOL
#!/bin/bash
# Script to restart all services with the correct environment

cd ${DEPLOY_DIR}
${DEPLOY_DIR}/load-env.sh docker-compose down
${DEPLOY_DIR}/load-env.sh docker-compose up -d

echo "Services restarted"
EOL
chmod +x $RESTART_SCRIPT

# Create a logs view script
LOGS_SCRIPT="$DEPLOY_DIR/view-logs.sh"
cat > $LOGS_SCRIPT << EOL
#!/bin/bash
# Script to view logs from all services

cd ${DEPLOY_DIR}
docker-compose logs --tail=100 -f \$@
EOL
chmod +x $LOGS_SCRIPT

# Print instructions
echo -e "${GREEN}=== Docker Compose Configuration Created ===${NC}"
echo 
echo -e "The following files have been created:"
echo -e "- ${YELLOW}$COMPOSE_FILE${NC}: Main Docker Compose configuration"
echo -e "- ${YELLOW}$COMPOSE_OVERRIDE_FILE${NC}: Environment-specific configuration"
if [[ "$ENABLE_HTTPS" == "yes" ]] || [[ "$ENABLE_HTTPS" == "y" ]]; then
  echo -e "- ${YELLOW}$NGINX_CONF_FILE${NC}: Nginx configuration for SSL termination"
  echo -e "- ${YELLOW}$INIT_SSL_SCRIPT${NC}: Script to initialize SSL certificates"
fi
echo -e "- ${YELLOW}$RESTART_SCRIPT${NC}: Script to restart all services"
echo -e "- ${YELLOW}$LOGS_SCRIPT${NC}: Script to view service logs"
echo 
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Make sure you have run the ${YELLOW}scripts/setup-secrets.sh${NC} script first"
echo -e "2. Deploy your application code to ${YELLOW}$DEPLOY_DIR${NC}"
if [[ "$ENABLE_HTTPS" == "yes" ]] || [[ "$ENABLE_HTTPS" == "y" ]]; then
  echo -e "3. Initialize SSL certificates: ${YELLOW}$INIT_SSL_SCRIPT${NC}"
else
  echo -e "3. Start the services: ${YELLOW}${DEPLOY_DIR}/load-env.sh docker-compose up -d${NC}"
fi
echo -e "4. View logs: ${YELLOW}$LOGS_SCRIPT${NC}"
echo 
echo -e "${RED}IMPORTANT:${NC} Make sure your firewall allows traffic on ports ${HTTP_PORT}"
if [[ "$ENABLE_HTTPS" == "yes" ]] || [[ "$ENABLE_HTTPS" == "y" ]]; then
  echo -e " and ${HTTPS_PORT}"
fi 