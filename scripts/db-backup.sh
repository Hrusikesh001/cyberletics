#!/bin/bash

# Sentrifense MongoDB Backup Script
# This script performs MongoDB database backups, compression, encryption and rotation

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="$HOME/sentrifense"
BACKUP_DIR="$DEPLOY_DIR/backups"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="mongodb-backup-$DATE"
ARCHIVE_PATH="$BACKUP_DIR/$BACKUP_NAME.archive"
COMPRESSED_PATH="$BACKUP_DIR/$BACKUP_NAME.archive.gz"
ENCRYPTED_PATH="$BACKUP_DIR/$BACKUP_NAME.archive.gz.enc"
LOGFILE="$DEPLOY_DIR/logs/backup-$(date +%Y-%m-%d).log"
RETENTION_DAYS=7
MONGODB_CONTAINER="sentrifense_mongodb_1"

# Encryption settings
SECRET_KEY_FILE="$DEPLOY_DIR/.master.key"

# Make sure backup directory exists
mkdir -p "$BACKUP_DIR"
mkdir -p "$DEPLOY_DIR/logs"

# Log function
log() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$message"
  echo "$message" >> "$LOGFILE"
}

# Check if we're running in a container environment
check_container_environment() {
  if ! docker ps &>/dev/null; then
    log "${GREEN}Running in direct MongoDB connection mode${NC}"
    CONTAINER_ENV=false
  else
    # Check if MongoDB container is running
    if docker ps --format '{{.Names}}' | grep -q "$MONGODB_CONTAINER"; then
      log "${GREEN}Running in Docker container environment${NC}"
      CONTAINER_ENV=true
    else
      # Try to find any MongoDB container
      MONGODB_CONTAINER=$(docker ps --filter "name=mongo" --format '{{.Names}}' | head -n 1)
      if [ -n "$MONGODB_CONTAINER" ]; then
        log "${YELLOW}Using detected MongoDB container: $MONGODB_CONTAINER${NC}"
        CONTAINER_ENV=true
      else
        log "${YELLOW}No MongoDB container found, falling back to direct connection${NC}"
        CONTAINER_ENV=false
      fi
    fi
  fi
}

# Load MongoDB connection settings from the environment loader
load_mongo_settings() {
  log "${GREEN}Loading MongoDB connection settings...${NC}"
  
  if [ -f "$DEPLOY_DIR/load-env.sh" ]; then
    # Extract MongoDB URI from environment loader
    MONGODB_URI=$("$DEPLOY_DIR/load-env.sh" bash -c 'echo $MONGODB_URI')
    
    if [ -z "$MONGODB_URI" ]; then
      log "${RED}Could not get MongoDB URI from environment loader${NC}"
      exit 1
    fi
    
    # Parse MongoDB connection details
    if [[ "$MONGODB_URI" =~ mongodb://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
      MONGO_USER="${BASH_REMATCH[1]}"
      MONGO_PASS="${BASH_REMATCH[2]}"
      MONGO_HOST="${BASH_REMATCH[3]}"
      MONGO_PORT="${BASH_REMATCH[4]}"
      MONGO_DB="${BASH_REMATCH[5]}"
    elif [[ "$MONGODB_URI" =~ mongodb://([^:]+):([0-9]+)/([^?]+) ]]; then
      MONGO_HOST="${BASH_REMATCH[1]}"
      MONGO_PORT="${BASH_REMATCH[2]}"
      MONGO_DB="${BASH_REMATCH[3]}"
    else
      log "${YELLOW}Could not parse MongoDB URI, using defaults${NC}"
      MONGO_HOST="localhost"
      MONGO_PORT="27017"
      MONGO_DB="sentrifense"
    fi
  else
    log "${YELLOW}Environment loader not found, using default MongoDB settings${NC}"
    MONGO_HOST="localhost"
    MONGO_PORT="27017" 
    MONGO_DB="sentrifense"
  fi
  
  log "Using database: $MONGO_DB on $MONGO_HOST:$MONGO_PORT"
}

# Perform the backup
perform_backup() {
  log "${GREEN}Starting MongoDB backup...${NC}"
  
  # Record start time for duration calculation
  START_TIME=$(date +%s)
  
  if [ "$CONTAINER_ENV" = true ]; then
    log "Backing up using Docker container: $MONGODB_CONTAINER"
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      docker exec "$MONGODB_CONTAINER" mongodump \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --username="$MONGO_USER" \
        --password="$MONGO_PASS" \
        --db="$MONGO_DB" \
        --archive > "$ARCHIVE_PATH"
    else
      docker exec "$MONGODB_CONTAINER" mongodump \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --db="$MONGO_DB" \
        --archive > "$ARCHIVE_PATH"
    fi
  else
    log "Backing up using local mongodump"
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      mongodump \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --username="$MONGO_USER" \
        --password="$MONGO_PASS" \
        --db="$MONGO_DB" \
        --archive="$ARCHIVE_PATH"
    else
      mongodump \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --db="$MONGO_DB" \
        --archive="$ARCHIVE_PATH"
    fi
  fi
  
  # Check if backup was successful
  if [ $? -ne 0 ]; then
    log "${RED}Backup failed!${NC}"
    exit 1
  fi
  
  # Get size of the backup
  BACKUP_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)
  log "Backup created: $ARCHIVE_PATH ($BACKUP_SIZE)"
  
  # Compress the backup
  log "${GREEN}Compressing backup...${NC}"
  gzip -f "$ARCHIVE_PATH"
  
  COMPRESSED_SIZE=$(du -h "$COMPRESSED_PATH" | cut -f1)
  log "Compressed backup: $COMPRESSED_PATH ($COMPRESSED_SIZE)"
  
  # Encrypt the backup if master key is available
  if [ -f "$SECRET_KEY_FILE" ]; then
    log "${GREEN}Encrypting backup...${NC}"
    ENCRYPTION_KEY=$(cat "$SECRET_KEY_FILE")
    openssl enc -aes-256-cbc -salt -pbkdf2 -in "$COMPRESSED_PATH" -out "$ENCRYPTED_PATH" -k "$ENCRYPTION_KEY"
    
    if [ $? -eq 0 ]; then
      # Remove unencrypted backup
      rm "$COMPRESSED_PATH"
      ENCRYPTED_SIZE=$(du -h "$ENCRYPTED_PATH" | cut -f1)
      log "Encrypted backup: $ENCRYPTED_PATH ($ENCRYPTED_SIZE)"
      FINAL_BACKUP="$ENCRYPTED_PATH"
    else
      log "${YELLOW}Encryption failed, keeping compressed backup${NC}"
      FINAL_BACKUP="$COMPRESSED_PATH"
    fi
  else
    log "${YELLOW}Master key not found, skipping encryption${NC}"
    FINAL_BACKUP="$COMPRESSED_PATH"
  fi
  
  # Calculate duration
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  
  log "${GREEN}Backup completed in $DURATION seconds${NC}"
  log "Final backup location: $FINAL_BACKUP"
  
  # Create a verification file with backup metadata
  cat > "$BACKUP_DIR/$BACKUP_NAME.info" << EOL
Backup Date: $(date)
Database: $MONGO_DB
Source: $MONGO_HOST:$MONGO_PORT
Backup Size: $BACKUP_SIZE
Compressed Size: $COMPRESSED_SIZE
${ENCRYPTED_SIZE:+Encrypted Size: $ENCRYPTED_SIZE}
Duration: $DURATION seconds
Encrypted: ${ENCRYPTED_SIZE:+yes}${ENCRYPTED_SIZE:-no}
EOL
}

# Rotate old backups
rotate_backups() {
  log "${GREEN}Rotating old backups (keeping last $RETENTION_DAYS days)...${NC}"
  
  # Find files older than RETENTION_DAYS and delete them
  find "$BACKUP_DIR" -name "mongodb-backup-*" -type f -mtime +$RETENTION_DAYS -delete
  
  # Count remaining backups
  BACKUP_COUNT=$(find "$BACKUP_DIR" -name "mongodb-backup-*.info" | wc -l)
  log "Backup rotation complete. $BACKUP_COUNT backups remaining."
}

# Create symbolic link to latest backup
create_latest_link() {
  log "${GREEN}Creating symbolic link to latest backup...${NC}"
  
  # Remove old latest link if it exists
  rm -f "$BACKUP_DIR/latest-backup"
  
  # Create new link
  ln -s "$FINAL_BACKUP" "$BACKUP_DIR/latest-backup"
  log "Latest backup symlink created: $BACKUP_DIR/latest-backup"
}

# Verify the backup
verify_backup() {
  log "${GREEN}Verifying backup integrity...${NC}"
  
  # For unencrypted backups, we can use gzip test
  if [[ "$FINAL_BACKUP" == *.gz ]]; then
    gzip -t "$FINAL_BACKUP"
    if [ $? -eq 0 ]; then
      log "${GREEN}Backup verified successfully${NC}"
    else
      log "${RED}Backup verification failed!${NC}"
      # Don't exit, as we still have a backup, even if potentially corrupted
    fi
  else
    log "${YELLOW}Skipping verification for encrypted backup${NC}"
  fi
}

# Main execution
log "${GREEN}=== Sentrifense MongoDB Backup Started ====${NC}"

check_container_environment
load_mongo_settings
perform_backup
verify_backup
create_latest_link
rotate_backups

log "${GREEN}=== Sentrifense MongoDB Backup Completed ====${NC}"

# Print summary
cat "$BACKUP_DIR/$BACKUP_NAME.info"

exit 0 