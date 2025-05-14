# Whitelabeling Setup Guide

This guide explains how to set up tenant-specific domains (whitelabeling) for your Sentrifense deployment.

## Overview

Sentrifense supports multi-tenant deployments with custom domains for each tenant. For example:
- tenant1.example.com
- tenant2.example.com
- client.yourdomain.com

This is achieved using Nginx as a reverse proxy that routes requests to the appropriate backend based on the subdomain.

## Prerequisites

- A domain name you control
- Server with Nginx installed
- SSL certificates for your domain
- DNS access to create subdomains

## Step 1: DNS Configuration

1. Create a wildcard DNS record for your domain:
   ```
   Type: A
   Name: *
   Value: [Your Server IP]
   TTL: 3600
   ```

2. Alternatively, create individual DNS records for each tenant:
   ```
   Type: A
   Name: tenant1
   Value: [Your Server IP]
   TTL: 3600
   ```

3. Verify DNS propagation:
   ```
   ping tenant1.example.com
   ```

## Step 2: SSL Certificate Setup

### Option 1: Using Let's Encrypt (Recommended)

1. Install Certbot:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. Obtain a wildcard certificate:
   ```bash
   sudo certbot certonly --manual --preferred-challenges=dns \
     --email admin@example.com \
     --server https://acme-v02.api.letsencrypt.org/directory \
     --agree-tos \
     -d "*.example.com"
   ```

3. Follow the DNS challenge instructions to validate domain ownership.

4. Certificate files will be saved to `/etc/letsencrypt/live/example.com/`.

### Option 2: Using a Commercial SSL Certificate

1. Generate a CSR (Certificate Signing Request):
   ```bash
   openssl req -new -newkey rsa:2048 -nodes \
     -keyout /etc/nginx/ssl/example.com.key \
     -out example.com.csr
   ```

2. Purchase a wildcard SSL certificate from a provider (DigiCert, Comodo, etc.).

3. Submit the CSR to your SSL provider and complete validation.

4. Download the issued certificate and save it to `/etc/nginx/ssl/example.com.crt`.

## Step 3: Nginx Configuration

1. Create the Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/sentrifense
   ```

2. Copy the configuration from `middleware/nginx.conf` into this file.

3. Update the SSL certificate paths if needed:
   ```
   ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
   ```

4. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sentrifense /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Step 4: Middleware Configuration

1. Update the middleware environment variables to recognize tenant IDs from headers:
   ```
   # .env
   MULTI_TENANT_ENABLED=true
   DEFAULT_TENANT_ID=default
   ```

2. Ensure the middleware is extracting and using the `X-Tenant-ID` header in API requests.

## Step 5: Testing the Setup

1. Access the application using a tenant subdomain:
   ```
   https://tenant1.example.com
   ```

2. Verify the correct tenant ID is being passed to the middleware by checking the logs.

3. Test tenant isolation by logging into different tenant domains and confirming data separation.

## Step 6: Custom Branding per Tenant

1. In the frontend code, add support for tenant-specific styling:
   ```typescript
   // src/hooks/useTenantTheme.ts
   export const useTenantTheme = () => {
     const { currentTenant } = useAuth();
     
     // Load tenant-specific theme settings from API or local storage
     // ...

     return {
       colors: { /* tenant colors */ },
       logo: /* tenant logo URL */,
       // other theme settings
     };
   };
   ```

2. Add theme customization options in the admin panel.

## Troubleshooting

### Certificate Issues

- **Problem**: SSL certificate not working for subdomains
  **Solution**: Ensure you have a wildcard certificate (`*.example.com`)

- **Problem**: Certificate validation fails
  **Solution**: Check DNS propagation with `nslookup` or online DNS tools

### Routing Issues

- **Problem**: Subdomains not routing to the application
  **Solution**: Check Nginx configuration and verify logs: `sudo tail -f /var/log/nginx/error.log`

- **Problem**: Tenant ID not being passed correctly
  **Solution**: Check request headers in browser developer tools or middleware logs

## Security Considerations

1. **Data Isolation**: Ensure strict tenant data separation in the backend code
2. **Authentication**: Implement tenant-specific authentication realms
3. **Rate Limiting**: Add per-tenant rate limiting to prevent abuse
4. **Logging**: Implement tenant-aware logging for better debugging and auditing 