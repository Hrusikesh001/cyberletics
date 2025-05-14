#!/bin/bash

# Sentrifense MongoDB Restore Script
# This script restores MongoDB database from backup files (including encrypted ones)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="$HOME/sentrifense"
BACKUP_DIR="$DEPLOY_DIR/backups"
TEMP_DIR="$BACKUP_DIR/temp_restore"
LOGFILE="$DEPLOY_DIR/logs/restore-$(date +%Y-%m-%d).log"
MONGODB_CONTAINER="sentrifense_mongodb_1"

# Encryption settings
SECRET_KEY_FILE="$DEPLOY_DIR/.master.key"

# Make sure temp and log directories exist
mkdir -p "$TEMP_DIR"
mkdir -p "$DEPLOY_DIR/logs"

# Log function
log() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$message"
  echo "$message" >> "$LOGFILE"
}

# Show usage
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo
  echo "Options:"
  echo "  -f, --file BACKUP_FILE    Specify backup file to restore"
  echo "  -l, --latest              Restore from latest backup (default)"
  echo "  -d, --date YYYY-MM-DD     Restore from backup on specified date"
  echo "  -t, --target-db DB_NAME   Restore to specified database (default: original DB name)"
  echo "  -n, --new-db              Restore to a new database with timestamp"
  echo "  -y, --yes                 Skip confirmation prompts"
  echo "  --drop                    Drop existing collections before restore"
  echo "  -h, --help                Show this help message"
  echo
  echo "Example:"
  echo "  $0 --latest --drop        Restore latest backup, dropping existing collections"
  echo "  $0 -f backups/mongodb-backup-2023-01-01.archive.gz.enc  Restore specific backup file"
  exit 1
}

# Clean up temp files
cleanup() {
  log "Cleaning up temporary files..."
  rm -rf "$TEMP_DIR"
  mkdir -p "$TEMP_DIR"  # Recreate empty temp dir
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
  
  # If target database is not specified, use the original database name
  if [ -z "$TARGET_DB" ]; then
    TARGET_DB="$MONGO_DB"
  fi
  
  # If new-db option is used, create a timestamped database name
  if [ "$NEW_DB" = true ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    TARGET_DB="${MONGO_DB}_${TIMESTAMP}"
    log "Will restore to new database: $TARGET_DB"
  fi
  
  log "Using source database: $MONGO_DB"
  log "Using target database: $TARGET_DB"
  log "MongoDB server: $MONGO_HOST:$MONGO_PORT"
}

# Find backup file
find_backup_file() {
  if [ -n "$BACKUP_FILE" ]; then
    # User has specified a backup file directly
    log "Using specified backup file: $BACKUP_FILE"
    
    # Check if file exists
    if [ ! -f "$BACKUP_FILE" ]; then
      log "${RED}Specified backup file not found: $BACKUP_FILE${NC}"
      exit 1
    fi
  elif [ "$LATEST_BACKUP" = true ]; then
    # Find the latest backup file
    log "Finding latest backup file..."
    LATEST_LINK="$BACKUP_DIR/latest-backup"
    
    if [ -L "$LATEST_LINK" ]; then
      BACKUP_FILE=$(readlink -f "$LATEST_LINK")
      log "Using latest backup: $BACKUP_FILE"
    else
      # No symlink, try to find newest file
      BACKUP_FILE=$(find "$BACKUP_DIR" -type f \( -name "*.archive.gz" -o -name "*.archive.gz.enc" \) | sort -r | head -n 1)
      
      if [ -z "$BACKUP_FILE" ]; then
        log "${RED}No backup files found!${NC}"
        exit 1
      fi
      
      log "Using most recent backup: $BACKUP_FILE"
    fi
  elif [ -n "$BACKUP_DATE" ]; then
    # Find backup file by date
    log "Finding backup for date: $BACKUP_DATE"
    BACKUP_FILE=$(find "$BACKUP_DIR" -type f -name "mongodb-backup-${BACKUP_DATE}*" | sort -r | head -n 1)
    
    if [ -z "$BACKUP_FILE" ]; then
      log "${RED}No backup files found for date: $BACKUP_DATE${NC}"
      exit 1
    fi
    
    log "Using backup from $BACKUP_DATE: $BACKUP_FILE"
  else
    # No backup file specified, use latest
    log "No backup file specified, using latest backup..."
    LATEST_LINK="$BACKUP_DIR/latest-backup"
    
    if [ -L "$LATEST_LINK" ]; then
      BACKUP_FILE=$(readlink -f "$LATEST_LINK")
      log "Using latest backup: $BACKUP_FILE"
    else
      # No symlink, try to find newest file
      BACKUP_FILE=$(find "$BACKUP_DIR" -type f \( -name "*.archive.gz" -o -name "*.archive.gz.enc" \) | sort -r | head -n 1)
      
      if [ -z "$BACKUP_FILE" ]; then
        log "${RED}No backup files found!${NC}"
        exit 1
      fi
      
      log "Using most recent backup: $BACKUP_FILE"
    fi
  fi
}

# Prepare backup file
prepare_backup() {
  log "${GREEN}Preparing backup file for restoration...${NC}"
  
  # Determine if this is an encrypted backup
  if [[ "$BACKUP_FILE" == *.enc ]]; then
    log "Detected encrypted backup file"
    
    # Check if encryption key is available
    if [ ! -f "$SECRET_KEY_FILE" ]; then
      log "${RED}Master encryption key not found: $SECRET_KEY_FILE${NC}"
      log "Cannot decrypt backup without the encryption key"
      exit 1
    fi
    
    # Decrypt the backup
    log "Decrypting backup..."
    ENCRYPTION_KEY=$(cat "$SECRET_KEY_FILE")
    DECRYPTED_FILE="$TEMP_DIR/$(basename "$BACKUP_FILE" .enc)"
    
    openssl enc -aes-256-cbc -d -salt -pbkdf2 -in "$BACKUP_FILE" -out "$DECRYPTED_FILE" -k "$ENCRYPTION_KEY"
    
    if [ $? -ne 0 ]; then
      log "${RED}Decryption failed!${NC}"
      exit 1
    fi
    
    log "Backup decrypted successfully: $DECRYPTED_FILE"
    PREPARED_FILE="$DECRYPTED_FILE"
  else
    # Just use the original file
    PREPARED_FILE="$BACKUP_FILE"
  fi
  
  # If file is compressed, decompress it
  if [[ "$PREPARED_FILE" == *.gz ]]; then
    log "Decompressing backup file..."
    UNCOMPRESSED_FILE="$TEMP_DIR/$(basename "$PREPARED_FILE" .gz)"
    
    gunzip -c "$PREPARED_FILE" > "$UNCOMPRESSED_FILE"
    
    if [ $? -ne 0 ]; then
      log "${RED}Decompression failed!${NC}"
      exit 1
    fi
    
    log "Backup decompressed successfully: $UNCOMPRESSED_FILE"
    PREPARED_FILE="$UNCOMPRESSED_FILE"
  fi
  
  log "Backup file prepared for restoration: $PREPARED_FILE"
}

# Verify database connection
verify_connection() {
  log "${GREEN}Verifying MongoDB connection...${NC}"
  
  if [ "$CONTAINER_ENV" = true ]; then
    # Using Docker container
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      docker exec "$MONGODB_CONTAINER" mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --username "$MONGO_USER" \
        --password "$MONGO_PASS" \
        --eval "db.adminCommand('ping')" > /dev/null
    else
      docker exec "$MONGODB_CONTAINER" mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --eval "db.adminCommand('ping')" > /dev/null
    fi
  else
    # Direct connection
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --username "$MONGO_USER" \
        --password "$MONGO_PASS" \
        --eval "db.adminCommand('ping')" > /dev/null
    else
      mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --eval "db.adminCommand('ping')" > /dev/null
    fi
  fi
  
  if [ $? -ne 0 ]; then
    log "${RED}Failed to connect to MongoDB!${NC}"
    exit 1
  fi
  
  log "MongoDB connection verified successfully"
}

# Perform the restore
perform_restore() {
  log "${GREEN}Starting MongoDB restore process...${NC}"
  
  # Record start time for duration calculation
  START_TIME=$(date +%s)
  
  # Construct restore command
  RESTORE_CMD="mongorestore"
  
  if [ "$DROP_COLLECTIONS" = true ]; then
    RESTORE_CMD="$RESTORE_CMD --drop"
    log "Will drop existing collections before restore"
  fi
  
  RESTORE_CMD="$RESTORE_CMD --nsFrom='$MONGO_DB.*' --nsTo='$TARGET_DB.*'"
  
  if [ "$CONTAINER_ENV" = true ]; then
    log "Restoring using Docker container: $MONGODB_CONTAINER"
    
    # Copy the prepared file to the container
    CONTAINER_FILE="/tmp/$(basename "$PREPARED_FILE")"
    docker cp "$PREPARED_FILE" "$MONGODB_CONTAINER:$CONTAINER_FILE"
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      docker exec "$MONGODB_CONTAINER" $RESTORE_CMD \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --username="$MONGO_USER" \
        --password="$MONGO_PASS" \
        --nsFrom="$MONGO_DB.*" \
        --nsTo="$TARGET_DB.*" \
        ${DROP_COLLECTIONS:+--drop} \
        --archive="$CONTAINER_FILE"
    else
      docker exec "$MONGODB_CONTAINER" $RESTORE_CMD \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --nsFrom="$MONGO_DB.*" \
        --nsTo="$TARGET_DB.*" \
        ${DROP_COLLECTIONS:+--drop} \
        --archive="$CONTAINER_FILE"
    fi
    
    # Remove the temporary file from the container
    docker exec "$MONGODB_CONTAINER" rm "$CONTAINER_FILE"
  else
    log "Restoring using local mongorestore"
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      mongorestore \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --username="$MONGO_USER" \
        --password="$MONGO_PASS" \
        --nsFrom="$MONGO_DB.*" \
        --nsTo="$TARGET_DB.*" \
        ${DROP_COLLECTIONS:+--drop} \
        --archive="$PREPARED_FILE"
    else
      mongorestore \
        --host="$MONGO_HOST" \
        --port="$MONGO_PORT" \
        --nsFrom="$MONGO_DB.*" \
        --nsTo="$TARGET_DB.*" \
        ${DROP_COLLECTIONS:+--drop} \
        --archive="$PREPARED_FILE"
    fi
  fi
  
  # Check if restore was successful
  if [ $? -ne 0 ]; then
    log "${RED}Restore failed!${NC}"
    cleanup
    exit 1
  fi
  
  # Calculate duration
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  
  log "${GREEN}Restore completed successfully in $DURATION seconds${NC}"
}

# Verify the restored database
verify_restore() {
  log "${GREEN}Verifying restored database...${NC}"
  
  # Get collection count for the restored database
  if [ "$CONTAINER_ENV" = true ]; then
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      COLLECTION_COUNT=$(docker exec "$MONGODB_CONTAINER" mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --username "$MONGO_USER" \
        --password "$MONGO_PASS" \
        --quiet \
        "$TARGET_DB" \
        --eval "db.getCollectionNames().length")
    else
      COLLECTION_COUNT=$(docker exec "$MONGODB_CONTAINER" mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --quiet \
        "$TARGET_DB" \
        --eval "db.getCollectionNames().length")
    fi
  else
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
      COLLECTION_COUNT=$(mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --username "$MONGO_USER" \
        --password "$MONGO_PASS" \
        --quiet \
        "$TARGET_DB" \
        --eval "db.getCollectionNames().length")
    else
      COLLECTION_COUNT=$(mongosh \
        --host "$MONGO_HOST" \
        --port "$MONGO_PORT" \
        --quiet \
        "$TARGET_DB" \
        --eval "db.getCollectionNames().length")
    fi
  fi
  
  log "Restored database has $COLLECTION_COUNT collections"
  
  if [ "$COLLECTION_COUNT" -gt 0 ]; then
    log "${GREEN}Restore verification successful${NC}"
  else
    log "${YELLOW}Warning: Restored database has no collections${NC}"
  fi
}

# Parse command line arguments
parse_args() {
  # Default values
  LATEST_BACKUP=true
  DROP_COLLECTIONS=false
  SKIP_CONFIRM=false
  NEW_DB=false
  
  while [[ "$#" -gt 0 ]]; do
    case $1 in
      -f|--file)
        BACKUP_FILE="$2"
        LATEST_BACKUP=false
        shift 2
        ;;
      -l|--latest)
        LATEST_BACKUP=true
        shift
        ;;
      -d|--date)
        BACKUP_DATE="$2"
        LATEST_BACKUP=false
        shift 2
        ;;
      -t|--target-db)
        TARGET_DB="$2"
        shift 2
        ;;
      -n|--new-db)
        NEW_DB=true
        shift
        ;;
      -y|--yes)
        SKIP_CONFIRM=true
        shift
        ;;
      --drop)
        DROP_COLLECTIONS=true
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
}

# Confirm restoration
confirm_restore() {
  if [ "$SKIP_CONFIRM" = true ]; then
    return 0  # Skip confirmation if --yes flag is used
  fi
  
  echo
  echo -e "${YELLOW}======= RESTORE CONFIRMATION =======${NC}"
  echo -e "Backup file: ${GREEN}$BACKUP_FILE${NC}"
  echo -e "Target database: ${GREEN}$TARGET_DB${NC}"
  echo -e "Drop existing collections: ${GREEN}$DROP_COLLECTIONS${NC}"
  echo
  
  if [ "$TARGET_DB" = "$MONGO_DB" ] && [ "$DROP_COLLECTIONS" = true ]; then
    echo -e "${RED}WARNING: This will overwrite the current database!${NC}"
  fi
  
  echo -e "Are you sure you want to proceed with the restore? (y/N)"
  read -r CONFIRM
  
  if [[ ! "$CONFIRM" =~ ^[Yy](es)?$ ]]; then
    log "Restore cancelled by user"
    exit 0
  fi
}

# Main execution flow
log "${GREEN}=== Sentrifense MongoDB Restore Started ====${NC}"

# Parse command line arguments
parse_args "$@"

# Check environment and load settings
check_container_environment
load_mongo_settings

# Find and prepare backup file
find_backup_file
confirm_restore
prepare_backup

# Verify connection and perform restore
verify_connection
perform_restore
verify_restore

# Clean up
cleanup

log "${GREEN}=== Sentrifense MongoDB Restore Completed Successfully ====${NC}"

# Print summary
echo
echo -e "${GREEN}Restore Summary:${NC}"
echo -e "Backup file: ${BACKUP_FILE}"
echo -e "Restored to database: ${TARGET_DB}"
echo -e "Collections in restored database: ${COLLECTION_COUNT}"
echo
echo -e "${GREEN}Restore completed successfully!${NC}"

exit 0 