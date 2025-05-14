#!/bin/bash

# Sentrifense Environment Setup Script
# This script prepares the environment for deploying Sentrifense

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Sentrifense Environment Setup ===${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some operations may require sudo privileges${NC}"
fi

# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p ~/sentrifense/data/mongodb
mkdir -p ~/sentrifense/data/gophish
mkdir -p ~/sentrifense/logs
mkdir -p ~/sentrifense/backups

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Docker not found. Please install Docker and Docker Compose before continuing.${NC}"
  echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Docker Compose not found. Please install Docker Compose before continuing.${NC}"
  echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
  exit 1
fi

# Create .env file template
echo -e "${GREEN}Creating environment configuration files...${NC}"

cat > ~/sentrifense/.env.example << EOL
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost

# Database Configuration
MONGODB_URI=mongodb://mongodb:27017/sentrifense

# Gophish API Configuration
GOPHISH_API_KEY=your_gophish_api_key_here
GOPHISH_BASE_URL=https://gophish:3333/api

# Authentication
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRY=7d
EOL

# Create backup script
echo -e "${GREEN}Creating database backup script...${NC}"

cat > ~/sentrifense/backup-mongodb.sh << EOL
#!/bin/bash

# Database backup script for Sentrifense

BACKUP_DIR="\$HOME/sentrifense/backups"
DATE=\$(date +%Y-%m-%d)
CONTAINER_NAME=\$(docker ps --filter name=mongodb --format "{{.Names}}")

# Create backup directory if it doesn't exist
mkdir -p \$BACKUP_DIR

# Backup the database
echo "Backing up MongoDB to \$BACKUP_DIR/sentrifense-\$DATE"
docker exec \$CONTAINER_NAME sh -c 'mongodump --archive' > \$BACKUP_DIR/sentrifense-\$DATE.archive

# Compress the backup
gzip -f \$BACKUP_DIR/sentrifense-\$DATE.archive

# Keep only the last 7 backups
ls -t \$BACKUP_DIR/sentrifense-*.archive.gz | tail -n +8 | xargs rm -f 2>/dev/null || true

echo "Backup completed successfully!"
EOL

chmod +x ~/sentrifense/backup-mongodb.sh

# Setup cron job for backup
echo -e "${GREEN}Setting up daily database backup...${NC}"
(crontab -l 2>/dev/null || true; echo "0 2 * * * \$HOME/sentrifense/backup-mongodb.sh >> \$HOME/sentrifense/logs/backup.log 2>&1") | crontab -

# Create a basic monitoring script
echo -e "${GREEN}Creating monitoring script...${NC}"

cat > ~/sentrifense/monitor.sh << EOL
#!/bin/bash

# Simple monitoring script for Sentrifense services

# Check Docker containers
echo "=== Docker Containers Status ==="
docker ps --filter name=sentrifense --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check disk space
echo -e "\n=== Disk Space Usage ==="
df -h | grep -E '(Filesystem|/$)'

# Check memory usage
echo -e "\n=== Memory Usage ==="
free -h

# Check logs for errors (last 10 errors)
echo -e "\n=== Recent Errors in Logs ==="
for container in \$(docker ps --filter name=sentrifense --format "{{.Names}}"); do
  echo -e "\nErrors in \$container:"
  docker logs --tail 100 \$container 2>&1 | grep -i "error" | tail -10
done
EOL

chmod +x ~/sentrifense/monitor.sh

echo -e "${GREEN}Environment setup complete!${NC}"
echo 
echo -e "Next steps:"
echo -e "1. Copy your project files to ~/sentrifense"
echo -e "2. Customize the environment variables in .env file"
echo -e "3. Run 'docker-compose up -d' to start the services"
echo 
echo -e "The following scripts are available:"
echo -e "- ~/sentrifense/backup-mongodb.sh: Manual database backup"
echo -e "- ~/sentrifense/monitor.sh: Basic system monitoring"
echo 
echo -e "Database backups will run daily at 2 AM and stored in ~/sentrifense/backups" 