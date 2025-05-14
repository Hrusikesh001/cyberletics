#!/bin/bash

# Sentrifense Deployment Script
# This script handles rolling updates with backup and rollback options

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DEPLOY_DIR="$HOME/sentrifense"
BACKUP_DIR="$DEPLOY_DIR/backups"
BACKUP_FILENAME="pre-deploy-$(date +%Y%m%d_%H%M%S).tar.gz"

# Print usage information
usage() {
  echo "Usage: $0 [--no-backup] [--rollback]"
  echo "  --no-backup   Skip backup creation before deployment"
  echo "  --rollback    Rollback to the previous deployment"
  exit 1
}

# Parse command line arguments
NO_BACKUP=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-backup)
      NO_BACKUP=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Ensure we're in the deployment directory
cd $DEPLOY_DIR

# Function to create a backup
create_backup() {
  echo -e "${GREEN}Creating backup before deployment...${NC}"
  mkdir -p $BACKUP_DIR
  
  # Create a tar of the current configuration
  tar -czf "$BACKUP_DIR/$BACKUP_FILENAME" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="data" \
    --exclude="logs" \
    --exclude="backups" \
    .
    
  echo -e "${GREEN}Backup created at $BACKUP_DIR/$BACKUP_FILENAME${NC}"
  
  # Create DB backup as well
  echo -e "${GREEN}Backing up database...${NC}"
  $DEPLOY_DIR/backup-mongodb.sh
}

# Function to restore from the most recent backup
restore_from_backup() {
  echo -e "${YELLOW}Restoring from backup...${NC}"
  
  # Find the most recent backup
  LATEST_BACKUP=$(ls -t $BACKUP_DIR/pre-deploy-*.tar.gz | head -1)
  
  if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}No backup found to restore from!${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Restoring from $LATEST_BACKUP${NC}"
  
  # Stop running containers
  docker-compose down
  
  # Clean up existing files (preserving data and backups)
  find . -mindepth 1 -maxdepth 1 \
    ! -name 'data' \
    ! -name 'logs' \
    ! -name 'backups' \
    ! -name '.env' \
    -exec rm -rf {} \;
  
  # Extract backup
  tar -xzf "$LATEST_BACKUP" -C .
  
  # Start containers
  docker-compose up -d
  
  echo -e "${GREEN}Restoration complete!${NC}"
}

# Handle rollback if requested
if $ROLLBACK; then
  echo -e "${YELLOW}Initiating rollback to previous deployment...${NC}"
  restore_from_backup
  exit 0
fi

# Create backup unless skipped
if ! $NO_BACKUP; then
  create_backup
fi

# Pull latest code
echo -e "${GREEN}Updating code from repository...${NC}"
git pull

# Build and deploy
echo -e "${GREEN}Building and deploying application...${NC}"
docker-compose pull
docker-compose build

# Start the updated containers
echo -e "${GREEN}Starting updated services...${NC}"
docker-compose up -d

# Check if all containers are running
echo -e "${GREEN}Verifying deployment...${NC}"
sleep 5  # Give containers a moment to start

# Count expected vs actual running containers
EXPECTED_COUNT=$(grep -c "image:" docker-compose.yml)
RUNNING_COUNT=$(docker-compose ps --services | wc -l)

if [ "$RUNNING_COUNT" -ne "$EXPECTED_COUNT" ]; then
  echo -e "${RED}Deployment verification failed! Expected $EXPECTED_COUNT services but found $RUNNING_COUNT running.${NC}"
  echo -e "${YELLOW}Containers status:${NC}"
  docker-compose ps
  
  echo -e "${YELLOW}Would you like to rollback to the previous deployment? [y/N]${NC}"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    restore_from_backup
  else
    echo -e "${YELLOW}Continuing with partial deployment. Please check logs for issues.${NC}"
  fi
else
  echo -e "${GREEN}Deployment completed successfully!${NC}"
  
  # Clean up old images and volumes
  echo -e "${GREEN}Cleaning up unused resources...${NC}"
  docker system prune -af --volumes
fi

# Display logs to check for any startup errors
echo -e "${GREEN}Recent logs from services:${NC}"
docker-compose logs --tail=20

echo -e "${GREEN}Deployment process completed.${NC}" 