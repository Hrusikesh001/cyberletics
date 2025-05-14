#!/bin/bash

# Sentrifense MongoDB Backup Monitor
# This script monitors backup status, detects failures, and sends alerts

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="$HOME/sentrifense"
BACKUP_DIR="$DEPLOY_DIR/backups"
LOG_DIR="$DEPLOY_DIR/logs"
ALERT_LOG="$LOG_DIR/backup-alerts.log"
STATUS_FILE="$BACKUP_DIR/backup-status.json"
MAX_AGE_HOURS=26  # Alert if no backup in the last 26 hours (daily backup + 2h buffer)
MIN_SIZE_BYTES=1024  # Minimum expected backup size (1KB)
EMAIL_TO=""  # Set this to receive email alerts

# Ensure directories exist
mkdir -p "$LOG_DIR"

# Log function
log() {
  local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$message"
  echo "$message" >> "$ALERT_LOG"
}

# Alert function
send_alert() {
  local subject="$1"
  local message="$2"
  local severity="$3"  # info, warning, error
  
  log "${severity^^}: $subject - $message"
  
  # Update status file
  echo "{
  \"last_check\": \"$(date +%s)\",
  \"status\": \"$severity\",
  \"message\": \"$subject - $message\"
}" > "$STATUS_FILE"
  
  # Email alert if configured
  if [ -n "$EMAIL_TO" ]; then
    echo -e "$message" | mail -s "[Sentrifense Backup $severity] $subject" "$EMAIL_TO"
  fi
}

# Check for recent backups
check_backup_recency() {
  log "Checking for recent backups..."
  
  # Find most recent backup file
  LATEST_BACKUP=$(find "$BACKUP_DIR" -type f \( -name "mongodb-backup-*.archive.gz" -o -name "mongodb-backup-*.archive.gz.enc" \) -printf "%T@ %p\n" | sort -nr | head -n1)
  
  if [ -z "$LATEST_BACKUP" ]; then
    send_alert "No backups found" "No MongoDB backups found in $BACKUP_DIR" "error"
    return 1
  fi
  
  # Extract timestamp and filename
  TIMESTAMP=$(echo "$LATEST_BACKUP" | cut -d' ' -f1)
  BACKUP_FILE=$(echo "$LATEST_BACKUP" | cut -d' ' -f2)
  
  # Convert to integer
  TIMESTAMP_INT=${TIMESTAMP%.*}
  NOW=$(date +%s)
  
  # Calculate age in hours
  BACKUP_AGE_SECONDS=$((NOW - TIMESTAMP_INT))
  BACKUP_AGE_HOURS=$((BACKUP_AGE_SECONDS / 3600))
  
  if [ "$BACKUP_AGE_HOURS" -gt "$MAX_AGE_HOURS" ]; then
    send_alert "Backup too old" "Latest backup is $BACKUP_AGE_HOURS hours old: $BACKUP_FILE" "error"
    return 1
  else
    log "Latest backup is $BACKUP_AGE_HOURS hours old: $BACKUP_FILE"
  fi
  
  return 0
}

# Check backup size
check_backup_size() {
  log "Checking backup size..."
  
  # Find most recent backup file
  LATEST_BACKUP=$(find "$BACKUP_DIR" -type f \( -name "mongodb-backup-*.archive.gz" -o -name "mongodb-backup-*.archive.gz.enc" \) -printf "%T@ %p\n" | sort -nr | head -n1 | cut -d' ' -f2)
  
  if [ -z "$LATEST_BACKUP" ]; then
    # Already reported in previous check
    return 1
  fi
  
  # Get file size in bytes
  SIZE_BYTES=$(stat -c%s "$LATEST_BACKUP")
  
  if [ "$SIZE_BYTES" -lt "$MIN_SIZE_BYTES" ]; then
    send_alert "Backup too small" "Latest backup is only $SIZE_BYTES bytes: $LATEST_BACKUP" "error"
    return 1
  else
    # Convert to human-readable size
    if [ "$SIZE_BYTES" -ge 1073741824 ]; then
      SIZE_HUMAN=$(echo "scale=2; $SIZE_BYTES/1073741824" | bc)
      SIZE_UNIT="GB"
    elif [ "$SIZE_BYTES" -ge 1048576 ]; then
      SIZE_HUMAN=$(echo "scale=2; $SIZE_BYTES/1048576" | bc)
      SIZE_UNIT="MB"
    elif [ "$SIZE_BYTES" -ge 1024 ]; then
      SIZE_HUMAN=$(echo "scale=2; $SIZE_BYTES/1024" | bc)
      SIZE_UNIT="KB"
    else
      SIZE_HUMAN="$SIZE_BYTES"
      SIZE_UNIT="bytes"
    fi
    
    log "Latest backup size: $SIZE_HUMAN $SIZE_UNIT"
  fi
  
  return 0
}

# Check backup integrity
check_backup_integrity() {
  log "Checking backup integrity..."
  
  # Find most recent backup file
  LATEST_BACKUP=$(find "$BACKUP_DIR" -type f \( -name "mongodb-backup-*.archive.gz" -o -name "mongodb-backup-*.archive.gz.enc" \) -printf "%T@ %p\n" | sort -nr | head -n1 | cut -d' ' -f2)
  
  if [ -z "$LATEST_BACKUP" ]; then
    # Already reported in previous check
    return 1
  fi
  
  # For encrypted backups, we just check if the file exists and has proper size
  if [[ "$LATEST_BACKUP" == *.enc ]]; then
    log "Skipping integrity check for encrypted backup: $LATEST_BACKUP"
    return 0
  fi
  
  # For gzipped backups, check integrity using gzip
  if [[ "$LATEST_BACKUP" == *.gz ]]; then
    log "Checking gzip integrity for: $LATEST_BACKUP"
    
    if ! gzip -t "$LATEST_BACKUP" 2>/dev/null; then
      send_alert "Backup integrity check failed" "Latest backup failed integrity check: $LATEST_BACKUP" "error"
      return 1
    else
      log "Integrity check passed"
    fi
  fi
  
  return 0
}

# Check backup log for errors
check_backup_logs() {
  log "Checking backup logs for errors..."
  
  # Find the most recent backup log file
  LATEST_LOG=$(find "$LOG_DIR" -name "backup-*.log" -printf "%T@ %p\n" | sort -nr | head -n1 | cut -d' ' -f2)
  
  if [ -z "$LATEST_LOG" ]; then
    send_alert "No backup logs found" "No backup log files found in $LOG_DIR" "warning"
    return 1
  fi
  
  # Check for error messages in the log
  if grep -i -E "error|failed|failure" "$LATEST_LOG" >/dev/null; then
    ERROR_COUNT=$(grep -i -E "error|failed|failure" "$LATEST_LOG" | wc -l)
    SAMPLE_ERROR=$(grep -i -E "error|failed|failure" "$LATEST_LOG" | head -n1)
    
    send_alert "Errors in backup log" "Found $ERROR_COUNT errors in backup log. Sample: $SAMPLE_ERROR" "error"
    return 1
  else
    log "No errors found in backup log: $LATEST_LOG"
  fi
  
  return 0
}

# Check disk space
check_disk_space() {
  log "Checking available disk space..."
  
  # Get available disk space in bytes
  AVAILABLE_BYTES=$(df -P "$BACKUP_DIR" | awk 'NR==2 {print $4 * 1024}')
  THRESHOLD_BYTES=$((1024 * 1024 * 1024))  # 1GB
  
  if [ "$AVAILABLE_BYTES" -lt "$THRESHOLD_BYTES" ]; then
    # Convert to human-readable size
    if [ "$AVAILABLE_BYTES" -ge 1073741824 ]; then
      SIZE_HUMAN=$(echo "scale=2; $AVAILABLE_BYTES/1073741824" | bc)
      SIZE_UNIT="GB"
    elif [ "$AVAILABLE_BYTES" -ge 1048576 ]; then
      SIZE_HUMAN=$(echo "scale=2; $AVAILABLE_BYTES/1048576" | bc)
      SIZE_UNIT="MB"
    elif [ "$AVAILABLE_BYTES" -ge 1024 ]; then
      SIZE_HUMAN=$(echo "scale=2; $AVAILABLE_BYTES/1024" | bc)
      SIZE_UNIT="KB"
    else
      SIZE_HUMAN="$AVAILABLE_BYTES"
      SIZE_UNIT="bytes"
    fi
    
    send_alert "Low disk space" "Only $SIZE_HUMAN $SIZE_UNIT available in backup directory" "warning"
    return 1
  else
    # Convert to human-readable size
    if [ "$AVAILABLE_BYTES" -ge 1073741824 ]; then
      SIZE_HUMAN=$(echo "scale=2; $AVAILABLE_BYTES/1073741824" | bc)
      SIZE_UNIT="GB"
    elif [ "$AVAILABLE_BYTES" -ge 1048576 ]; then
      SIZE_HUMAN=$(echo "scale=2; $AVAILABLE_BYTES/1048576" | bc)
      SIZE_UNIT="MB"
    elif [ "$AVAILABLE_BYTES" -ge 1024 ]; then
      SIZE_HUMAN=$(echo "scale=2; $AVAILABLE_BYTES/1024" | bc)
      SIZE_UNIT="KB"
    else
      SIZE_HUMAN="$AVAILABLE_BYTES"
      SIZE_UNIT="bytes"
    fi
    
    log "Available disk space: $SIZE_HUMAN $SIZE_UNIT"
  fi
  
  return 0
}

# Count backups
count_backups() {
  log "Counting backups..."
  
  # Count all backup files
  BACKUP_COUNT=$(find "$BACKUP_DIR" -type f \( -name "mongodb-backup-*.archive.gz" -o -name "mongodb-backup-*.archive.gz.enc" \) | wc -l)
  
  if [ "$BACKUP_COUNT" -eq 0 ]; then
    send_alert "No backups found" "No MongoDB backups found in $BACKUP_DIR" "error"
    return 1
  else
    log "Found $BACKUP_COUNT backups"
    
    # Group by day
    echo "Recent backups:"
    find "$BACKUP_DIR" -type f \( -name "mongodb-backup-*.archive.gz" -o -name "mongodb-backup-*.archive.gz.enc" \) | sort -r | head -n 10 | while read -r file; do
      echo "  $(stat -c %y "$file" | cut -d' ' -f1): $(basename "$file")"
    done
  fi
  
  return 0
}

# Generate backup report
generate_report() {
  log "Generating backup report..."
  
  REPORT_FILE="$BACKUP_DIR/backup-report.html"
  REPORT_DATE=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Count backups by day for the last 7 days
  declare -A DAILY_COUNTS
  
  for i in {0..6}; do
    DATE=$(date -d "-$i days" +%Y-%m-%d)
    COUNT=$(find "$BACKUP_DIR" -type f \( -name "mongodb-backup-$DATE*.archive.gz" -o -name "mongodb-backup-$DATE*.archive.gz.enc" \) | wc -l)
    DAILY_COUNTS["$DATE"]=$COUNT
  done
  
  # Find most recent backup
  LATEST_BACKUP=$(find "$BACKUP_DIR" -type f \( -name "mongodb-backup-*.archive.gz" -o -name "mongodb-backup-*.archive.gz.enc" \) -printf "%T@ %p\n" | sort -nr | head -n1)
  
  if [ -n "$LATEST_BACKUP" ]; then
    TIMESTAMP=$(echo "$LATEST_BACKUP" | cut -d' ' -f1)
    BACKUP_FILE=$(echo "$LATEST_BACKUP" | cut -d' ' -f2)
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    TIMESTAMP_INT=${TIMESTAMP%.*}
    FORMATTED_DATE=$(date -d @"$TIMESTAMP_INT" +"%Y-%m-%d %H:%M:%S")
  else
    BACKUP_FILE="N/A"
    BACKUP_SIZE="N/A"
    FORMATTED_DATE="N/A"
  fi
  
  # Calculate total backup size
  TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
  
  # Check disk space
  DISK_SPACE=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')
  
  # Create HTML report
  cat > "$REPORT_FILE" << EOL
<!DOCTYPE html>
<html>
<head>
  <title>Sentrifense Database Backup Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    h1 { color: #333; }
    h2 { color: #444; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .success { color: green; }
    .warning { color: orange; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>Sentrifense Database Backup Report</h1>
  <p>Generated on: $REPORT_DATE</p>
  
  <h2>Backup Summary</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Latest Backup</td><td>$FORMATTED_DATE</td></tr>
    <tr><td>Latest Backup File</td><td>$(basename "$BACKUP_FILE")</td></tr>
    <tr><td>Latest Backup Size</td><td>$BACKUP_SIZE</td></tr>
    <tr><td>Total Backups</td><td>$BACKUP_COUNT</td></tr>
    <tr><td>Total Backup Size</td><td>$TOTAL_SIZE</td></tr>
    <tr><td>Available Disk Space</td><td>$DISK_SPACE</td></tr>
  </table>
  
  <h2>Daily Backup Counts (Last 7 Days)</h2>
  <table>
    <tr><th>Date</th><th>Count</th></tr>
EOL
  
  # Add daily counts to the report
  for i in {0..6}; do
    DATE=$(date -d "-$i days" +%Y-%m-%d)
    COUNT=${DAILY_COUNTS["$DATE"]}
    
    # Determine status class
    if [ "$COUNT" -eq 0 ]; then
      CLASS="error"
    elif [ "$COUNT" -lt 1 ]; then
      CLASS="warning"
    else
      CLASS="success"
    fi
    
    echo "<tr><td>$DATE</td><td class=\"$CLASS\">$COUNT</td></tr>" >> "$REPORT_FILE"
  done
  
  # Complete the HTML report
  cat >> "$REPORT_FILE" << EOL
  </table>
  
  <h2>Recent Backups</h2>
  <table>
    <tr><th>Date</th><th>File</th><th>Size</th></tr>
EOL
  
  # Add recent backups to the report
  find "$BACKUP_DIR" -type f \( -name "mongodb-backup-*.archive.gz" -o -name "mongodb-backup-*.archive.gz.enc" \) -printf "%T@ %p\n" | sort -nr | head -n 10 | while read -r line; do
    TIMESTAMP=$(echo "$line" | cut -d' ' -f1)
    FILE=$(echo "$line" | cut -d' ' -f2)
    SIZE=$(du -h "$FILE" | cut -f1)
    FORMATTED_DATE=$(date -d @"${TIMESTAMP%.*}" +"%Y-%m-%d %H:%M:%S")
    
    echo "<tr><td>$FORMATTED_DATE</td><td>$(basename "$FILE")</td><td>$SIZE</td></tr>" >> "$REPORT_FILE"
  done
  
  # Complete the HTML report
  cat >> "$REPORT_FILE" << EOL
  </table>
</body>
</html>
EOL
  
  log "Backup report generated: $REPORT_FILE"
}

# Main execution
log "${GREEN}=== Sentrifense Backup Monitor Started ====${NC}"

# Run all checks
echo "========== MongoDB Backup Status Check =========="
echo "Date: $(date)"
echo "================================================="

# Overall status
STATUS="ok"

# Run all checks
check_backup_recency || STATUS="error"
check_backup_size || STATUS="error"
check_backup_integrity || STATUS="error"
check_backup_logs || STATUS="error"
check_disk_space || STATUS="error"
count_backups || STATUS="error"

# Generate report
generate_report

# Update status file with overall status
if [ "$STATUS" = "ok" ]; then
  echo "{
  \"last_check\": \"$(date +%s)\",
  \"status\": \"ok\",
  \"message\": \"All backup checks passed successfully\"
}" > "$STATUS_FILE"
  
  log "${GREEN}All backup checks passed successfully${NC}"
else
  log "${RED}One or more backup checks failed${NC}"
fi

log "${GREEN}=== Sentrifense Backup Monitor Completed ====${NC}"

exit 0 