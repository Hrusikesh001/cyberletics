#!/bin/bash

# Sentrifense Production Secrets Management Script
# This script sets up secure environment variables for production deployment

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DEPLOY_DIR="$HOME/sentrifense"
ENV_FILE="$DEPLOY_DIR/.env"
ENV_EXAMPLE_FILE="$DEPLOY_DIR/.env.example"
VAULT_FILE="$DEPLOY_DIR/.secrets.vault"

# Check for required tools
echo -e "${GREEN}Checking for required tools...${NC}"
if ! command -v openssl &> /dev/null; then
  echo -e "${RED}OpenSSL not found. Please install OpenSSL before continuing.${NC}"
  exit 1
fi

# Create deployment directory if it doesn't exist
mkdir -p $DEPLOY_DIR

# Generate a secure random string for encryption key
generate_encryption_key() {
  openssl rand -hex 32
}

# Generate a secure random string for JWT secrets, etc.
generate_secure_string() {
  openssl rand -base64 32 | tr -d '\n'
}

# Function to encrypt a value
encrypt_value() {
  local value=$1
  local key=$2
  echo $value | openssl enc -aes-256-cbc -salt -a -pbkdf2 -k $key
}

# Function to decrypt a value
decrypt_value() {
  local encrypted=$1
  local key=$2
  echo $encrypted | openssl enc -aes-256-cbc -salt -a -d -pbkdf2 -k $key
}

# Check if we need to create or update the vault
if [ ! -f $VAULT_FILE ]; then
  echo -e "${GREEN}Creating new secrets vault...${NC}"
  
  # Generate master encryption key
  ENCRYPTION_KEY=$(generate_encryption_key)
  
  # Store master key securely
  SECRET_KEY_FILE="$DEPLOY_DIR/.master.key"
  echo $ENCRYPTION_KEY > $SECRET_KEY_FILE
  chmod 600 $SECRET_KEY_FILE
  
  echo -e "${YELLOW}Master encryption key saved to $SECRET_KEY_FILE${NC}"
  echo -e "${RED}IMPORTANT: Keep this file secure and backed up. If lost, encrypted secrets cannot be recovered.${NC}"
  
  # Create empty vault file
  echo "{}" > $VAULT_FILE
  chmod 600 $VAULT_FILE
else
  echo -e "${GREEN}Using existing secrets vault...${NC}"
  # Read encryption key from file
  SECRET_KEY_FILE="$DEPLOY_DIR/.master.key"
  if [ ! -f $SECRET_KEY_FILE ]; then
    echo -e "${RED}Master key file not found. Cannot decrypt secrets.${NC}"
    exit 1
  fi
  ENCRYPTION_KEY=$(cat $SECRET_KEY_FILE)
fi

# Create sample .env file if it doesn't exist
if [ ! -f $ENV_EXAMPLE_FILE ]; then
  echo -e "${GREEN}Creating sample environment file...${NC}"
  
  cat > $ENV_EXAMPLE_FILE << EOL
# Sentrifense Environment Configuration
# Copy this file to .env and customize for your environment

# Frontend Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Sentrifense
VITE_APP_DESCRIPTION=Phishing Control Center

# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sentrifense

# Gophish API Configuration
GOPHISH_API_KEY=your_gophish_api_key_here
GOPHISH_BASE_URL=https://your-gophish-server:3333/api

# Authentication
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRY=7d

# Email Configuration (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@example.com

# Security Settings
SESSION_SECRET=change_this_to_another_secure_random_string
COOKIE_SECRET=change_this_to_yet_another_secure_random_string
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
ENABLE_ACCESS_LOGS=true

# Deployment
DOMAIN_NAME=example.com
ENABLE_HTTPS=true
EOL

  echo -e "${GREEN}Sample environment file created at $ENV_EXAMPLE_FILE${NC}"
fi

# Interactive setup for production environment
setup_production_environment() {
  echo -e "${GREEN}Setting up production environment...${NC}"
  
  # Create or use existing .env file
  if [ ! -f $ENV_FILE ]; then
    cp $ENV_EXAMPLE_FILE $ENV_FILE
    echo -e "${GREEN}Created new .env file from template${NC}"
  else
    echo -e "${YELLOW}Using existing .env file${NC}"
  fi
  
  # Start with empty secrets object
  SECRETS="{}"
  
  # Helper function to prompt for sensitive values
  prompt_secret() {
    local key=$1
    local prompt=$2
    local default=$3
    
    echo -e "${YELLOW}$prompt${NC}"
    if [ -n "$default" ]; then
      echo -n "[default: keep existing] "
      read -s value
      echo
      if [ -z "$value" ]; then
        value=$default
      fi
    else
      read -s value
      echo
    fi
    
    # Encrypt and store in secrets object
    local encrypted=$(encrypt_value "$value" "$ENCRYPTION_KEY")
    SECRETS=$(echo $SECRETS | jq --arg key "$key" --arg val "$encrypted" '. + {($key): $val}')
  }
  
  # Get existing secrets if available
  if [ -f $VAULT_FILE ] && [ -s $VAULT_FILE ]; then
    SECRETS=$(cat $VAULT_FILE)
  fi
  
  # Prompt for sensitive configuration values
  echo -e "${GREEN}Enter sensitive configuration values:${NC}"
  
  # MongoDB URI
  current_mongodb_uri=$(echo $SECRETS | jq -r '.MONGODB_URI // empty')
  prompt_secret "MONGODB_URI" "MongoDB URI (e.g., mongodb://user:pass@host:port/db):" "$current_mongodb_uri"
  
  # Gophish API Key
  current_gophish_key=$(echo $SECRETS | jq -r '.GOPHISH_API_KEY // empty')
  prompt_secret "GOPHISH_API_KEY" "Gophish API Key:" "$current_gophish_key"
  
  # JWT Secret
  current_jwt=$(echo $SECRETS | jq -r '.JWT_SECRET // empty')
  if [ -z "$current_jwt" ]; then
    default_jwt=$(generate_secure_string)
  else
    default_jwt=$current_jwt
  fi
  prompt_secret "JWT_SECRET" "JWT Secret (for authentication):" "$default_jwt"
  
  # SMTP Password
  current_smtp_pass=$(echo $SECRETS | jq -r '.SMTP_PASS // empty')
  prompt_secret "SMTP_PASS" "SMTP Password (for sending notifications):" "$current_smtp_pass"
  
  # Session Secret
  current_session=$(echo $SECRETS | jq -r '.SESSION_SECRET // empty')
  if [ -z "$current_session" ]; then
    default_session=$(generate_secure_string)
  else
    default_session=$current_session
  fi
  prompt_secret "SESSION_SECRET" "Session Secret:" "$default_session"
  
  # Cookie Secret
  current_cookie=$(echo $SECRETS | jq -r '.COOKIE_SECRET // empty')
  if [ -z "$current_cookie" ]; then
    default_cookie=$(generate_secure_string)
  else
    default_cookie=$current_cookie
  fi
  prompt_secret "COOKIE_SECRET" "Cookie Secret:" "$default_cookie"
  
  # Write encrypted secrets to vault file
  echo $SECRETS > $VAULT_FILE
  chmod 600 $VAULT_FILE
  
  echo -e "${GREEN}Secrets stored securely in the vault.${NC}"
  
  # Create an env file with references to the vault
  echo -e "${GREEN}Updating environment file with references to secrets...${NC}"
  
  # Update the .env file, replacing sensitive values with vault references
  sed -i.bak 's/^MONGODB_URI=.*/MONGODB_URI=${VAULT:MONGODB_URI}/' $ENV_FILE
  sed -i.bak 's/^GOPHISH_API_KEY=.*/GOPHISH_API_KEY=${VAULT:GOPHISH_API_KEY}/' $ENV_FILE
  sed -i.bak 's/^JWT_SECRET=.*/JWT_SECRET=${VAULT:JWT_SECRET}/' $ENV_FILE
  sed -i.bak 's/^SMTP_PASS=.*/SMTP_PASS=${VAULT:SMTP_PASS}/' $ENV_FILE
  sed -i.bak 's/^SESSION_SECRET=.*/SESSION_SECRET=${VAULT:SESSION_SECRET}/' $ENV_FILE
  sed -i.bak 's/^COOKIE_SECRET=.*/COOKIE_SECRET=${VAULT:COOKIE_SECRET}/' $ENV_FILE
  
  # Remove backup file
  rm -f "$ENV_FILE.bak"
  
  echo -e "${GREEN}Environment configured successfully.${NC}"
}

# Function to create environment loader script
create_env_loader() {
  echo -e "${GREEN}Creating environment loader script...${NC}"
  
  LOADER_SCRIPT="$DEPLOY_DIR/load-env.sh"
  
  cat > $LOADER_SCRIPT << 'EOL'
#!/bin/bash
# Environment loader script for Sentrifense
# This script loads environment variables including secrets from the vault

# Load encryption key
ENCRYPTION_KEY=$(cat $HOME/sentrifense/.master.key)

# Function to decrypt a value
decrypt_value() {
  local encrypted=$1
  local key=$2
  echo $encrypted | openssl enc -aes-256-cbc -salt -a -d -pbkdf2 -k $key
}

# Load vault file
VAULT_FILE="$HOME/sentrifense/.secrets.vault"
if [ -f $VAULT_FILE ]; then
  SECRETS=$(cat $VAULT_FILE)
else
  echo "Error: Secrets vault not found" >&2
  exit 1
fi

# Load .env file and replace vault references
ENV_FILE="$HOME/sentrifense/.env"
if [ -f $ENV_FILE ]; then
  while IFS= read -r line; do
    # Skip comments and empty lines
    [[ $line =~ ^# ]] && continue
    [[ -z $line ]] && continue
    
    # Check if line contains a vault reference
    if [[ $line == *'${VAULT:'* ]]; then
      # Extract variable name and value
      var_name=$(echo $line | cut -d= -f1)
      vault_key=$(echo $line | sed -E 's/.*\$\{VAULT:([^}]+)\}.*/\1/')
      
      # Get encrypted value from vault
      encrypted_val=$(echo $SECRETS | jq -r --arg key "$vault_key" '.[$key] // empty')
      
      if [ -n "$encrypted_val" ]; then
        # Decrypt the value
        decrypted_val=$(decrypt_value "$encrypted_val" "$ENCRYPTION_KEY")
        # Export the variable
        export "$var_name=$decrypted_val"
      else
        echo "Warning: Vault key $vault_key not found" >&2
      fi
    else
      # For regular variables, just export them
      export "$line"
    fi
  done < $ENV_FILE
else
  echo "Error: Environment file not found" >&2
  exit 1
fi

# Execute the provided command with the loaded environment
exec "$@"
EOL

  chmod +x $LOADER_SCRIPT
  
  echo -e "${GREEN}Environment loader script created at $LOADER_SCRIPT${NC}"
  echo -e "${YELLOW}Usage: $LOADER_SCRIPT <command>${NC}"
  echo -e "${YELLOW}Example: $LOADER_SCRIPT docker-compose up -d${NC}"
}

# Function to print instructions
print_instructions() {
  echo
  echo -e "${GREEN}=== Secrets Management Setup Complete ===${NC}"
  echo
  echo -e "The following files have been created:"
  echo -e "- ${YELLOW}$VAULT_FILE${NC}: Encrypted secrets vault"
  echo -e "- ${YELLOW}$SECRET_KEY_FILE${NC}: Master encryption key"
  echo -e "- ${YELLOW}$DEPLOY_DIR/load-env.sh${NC}: Script to load environment with decrypted secrets"
  echo
  echo -e "${RED}IMPORTANT SECURITY NOTES:${NC}"
  echo -e "1. Keep the master key ($SECRET_KEY_FILE) secure and backed up."
  echo -e "2. Do not commit the .env file, .secrets.vault, or .master.key to version control."
  echo -e "3. Restrict file permissions to these files (already set to 600)."
  echo -e "4. Consider using a dedicated secrets management service in production."
  echo
  echo -e "${GREEN}To use in Docker:${NC}"
  echo -e "Use the loader script to start Docker with the correct environment:"
  echo -e "${YELLOW}$DEPLOY_DIR/load-env.sh docker-compose up -d${NC}"
  echo
  echo -e "${GREEN}To update secrets:${NC}"
  echo -e "Run this script again: ${YELLOW}$0${NC}"
}

# Main execution
echo -e "${GREEN}=== Sentrifense Production Secrets Management ===${NC}"

# Ensure jq is installed (needed for JSON manipulation)
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}The 'jq' tool is required but not installed. Installing...${NC}"
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y jq
  elif command -v yum &> /dev/null; then
    sudo yum install -y jq
  elif command -v brew &> /dev/null; then
    brew install jq
  else
    echo -e "${RED}Could not install jq automatically. Please install it manually and try again.${NC}"
    exit 1
  fi
fi

# Run setup steps
setup_production_environment
create_env_loader
print_instructions 