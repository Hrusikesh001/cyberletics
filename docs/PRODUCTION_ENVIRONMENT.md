# Sentrifense Production Environment Setup Guide

This document provides detailed instructions for setting up a secure production environment for the Sentrifense application with proper secrets management.

## Overview

The production environment uses the following components:

- **Docker and Docker Compose**: For containerization and service orchestration
- **Nginx**: As a reverse proxy and for SSL termination
- **Certbot**: For automated SSL certificate management
- **MongoDB**: For data storage
- **Secrets Management**: Custom solution for secure handling of sensitive information

## Prerequisites

- A Linux server running Ubuntu 20.04+ or similar distribution
- Root or sudo access to the server
- Domain name pointing to your server
- Docker and Docker Compose installed
- Git installed
- Basic understanding of Linux and Docker

## Initial Server Setup

1. Update your system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Install required packages:
   ```bash
   sudo apt install -y curl git openssl jq
   ```

3. Install Docker and Docker Compose if not already installed:
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. Add your user to the docker group (optional, for running Docker without sudo):
   ```bash
   sudo usermod -aG docker $USER
   ```
   Log out and log back in to apply the changes.

5. Configure firewall to allow HTTP and HTTPS:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## Deployment Process

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sentrifense.git ~/sentrifense-repo
```

### 2. Setup Scripts

Copy the setup scripts to your home directory:

```bash
mkdir -p ~/scripts
cp ~/sentrifense-repo/scripts/setup-secrets.sh ~/scripts/
cp ~/sentrifense-repo/scripts/generate-docker-config.sh ~/scripts/
chmod +x ~/scripts/*.sh
```

### 3. Configure Secrets Management

Run the secrets management setup script:

```bash
bash ~/scripts/setup-secrets.sh
```

This script will:
- Create a secure vault for storing encrypted secrets
- Generate a master encryption key
- Prompt you for sensitive configuration values
- Create an environment loader script

The following files will be created:
- `~/sentrifense/.secrets.vault`: Encrypted secrets vault
- `~/sentrifense/.master.key`: Master encryption key
- `~/sentrifense/.env`: Environment file with references to encrypted secrets
- `~/sentrifense/load-env.sh`: Script for loading decrypted environment variables

### 4. Generate Docker Compose Configuration

Run the Docker configuration generator script:

```bash
bash ~/scripts/generate-docker-config.sh
```

This script will:
- Prompt for your domain name and other configuration details
- Generate Docker Compose files with secure defaults
- Create Nginx configuration for SSL termination (if HTTPS is enabled)
- Create helper scripts for managing the services

### 5. Deploy Application Code

Copy the application code to the deployment directory:

```bash
rsync -av --exclude 'node_modules' --exclude '.git' ~/sentrifense-repo/ ~/sentrifense/
```

### 6. Initialize SSL Certificates (HTTPS only)

If you enabled HTTPS during setup, initialize SSL certificates with:

```bash
bash ~/sentrifense/init-ssl.sh
```

This script will:
- Create temporary self-signed certificates
- Start all services
- Obtain official certificates from Let's Encrypt
- Configure automatic certificate renewal

### 7. Start Services

Start all services with:

```bash
# For HTTPS setup, this is already done by init-ssl.sh
~/sentrifense/load-env.sh docker-compose up -d
```

### 8. Verify the Deployment

Check that all services are running correctly:

```bash
cd ~/sentrifense && docker-compose ps
```

View logs for all services:

```bash
~/sentrifense/view-logs.sh
```

Access your application at your domain name.

## Secrets Management Details

### How It Works

The secrets management system uses the following approach:

1. **Encrypted Vault**: Sensitive information is stored in an encrypted JSON file (`.secrets.vault`)
2. **Master Key**: A master encryption key (`.master.key`) is used for encryption/decryption
3. **Reference Mechanism**: The `.env` file contains references to secrets in the vault
4. **Runtime Loader**: The `load-env.sh` script decrypts and injects secrets at runtime

### Security Considerations

- **Master Key Protection**: The master key file should be restricted to the user running the application
- **Backup**: Back up the master key and vault securely - if lost, you'll lose access to all secrets
- **No Version Control**: Never commit the `.master.key` or `.secrets.vault` files to version control
- **File Permissions**: Ensure these files are only readable by the appropriate user

### Updating Secrets

To update secrets, run the setup script again:

```bash
bash ~/scripts/setup-secrets.sh
```

## Maintenance Tasks

### Updating the Application

To update the application:

1. Pull the latest code:
   ```bash
   cd ~/sentrifense-repo
   git pull origin main
   ```

2. Copy the updated code:
   ```bash
   rsync -av --exclude 'node_modules' --exclude '.git' ~/sentrifense-repo/ ~/sentrifense/
   ```

3. Restart the services:
   ```bash
   ~/sentrifense/restart-services.sh
   ```

### Database Backups

The system is configured to automatically back up MongoDB data daily. Manual backups can be triggered with:

```bash
~/sentrifense/backup-mongodb.sh
```

Backups are stored in `~/sentrifense/backups/` and rotated to keep the last 7 days.

### Monitoring Logs

View real-time logs with:

```bash
~/sentrifense/view-logs.sh
```

For specific services:

```bash
~/sentrifense/view-logs.sh middleware frontend
```

### SSL Certificate Renewal

Certificates are automatically renewed by the Certbot service. To manually trigger renewal:

```bash
cd ~/sentrifense
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
```

## Troubleshooting

### Service Startup Issues

If services fail to start:

1. Check logs for errors:
   ```bash
   ~/sentrifense/view-logs.sh
   ```

2. Verify environment variables:
   ```bash
   ~/sentrifense/load-env.sh env | grep -v PASSWORD | grep -v SECRET
   ```

3. Check Docker Compose configuration:
   ```bash
   ~/sentrifense/load-env.sh docker-compose config
   ```

### SSL Certificate Issues

If SSL certificate acquisition fails:

1. Ensure your domain is correctly pointing to your server
2. Check Certbot logs:
   ```bash
   cd ~/sentrifense
   docker-compose logs certbot
   ```
3. Verify Nginx configuration:
   ```bash
   docker-compose exec nginx nginx -t
   ```

### Secret Decryption Issues

If secret decryption fails:

1. Verify the master key file exists and has the correct permissions:
   ```bash
   ls -la ~/sentrifense/.master.key
   ```
2. Ensure the vault file is not corrupted:
   ```bash
   cat ~/sentrifense/.secrets.vault | jq
   ```

## Advanced Configuration

### Using External MongoDB

To use an external MongoDB instance:

1. Update the MongoDB URI in the secrets vault:
   ```bash
   ~/scripts/setup-secrets.sh
   ```
   
2. Modify the Docker Compose files to remove the MongoDB service:
   ```bash
   cd ~/sentrifense
   # Edit docker-compose.yml and docker-compose.override.yml
   ```

### Custom SSL Certificates

To use custom SSL certificates instead of Let's Encrypt:

1. Place your certificates in the appropriate location:
   ```bash
   mkdir -p ~/sentrifense/certbot/conf/live/yourdomain.com/
   cp your-cert.pem ~/sentrifense/certbot/conf/live/yourdomain.com/fullchain.pem
   cp your-key.pem ~/sentrifense/certbot/conf/live/yourdomain.com/privkey.pem
   ```

2. Modify the Nginx configuration if necessary:
   ```bash
   nano ~/sentrifense/nginx/nginx.conf
   ```

## Security Best Practices

- **Regular Updates**: Keep all components updated with security patches
- **Firewall Configuration**: Only expose necessary ports
- **Monitoring**: Set up monitoring for the server and application
- **Backups**: Regularly backup data and verify restore procedures
- **Access Control**: Use strong passwords and limit SSH access
- **SSL/TLS**: Use strong ciphers and protocols
- **Secrets Rotation**: Periodically update secrets and API keys 