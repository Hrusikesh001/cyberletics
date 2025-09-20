# 🚀 Sentrifense Production Deployment Guide

This guide covers the complete deployment process for the Sentrifense phishing simulation SaaS platform with Gophish API integration.

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18+ (LTS recommended)
- **Memory**: Minimum 2GB RAM, 4GB+ recommended
- **Storage**: 10GB+ available space
- **Network**: HTTPS support for production

### External Dependencies
- **Gophish Server**: Running and accessible
- **Domain**: SSL certificate for production
- **Database**: Local storage (JSON files) or MongoDB (optional)

## 🔧 Environment Configuration

### 1. Backend Environment Variables

Create `.env` file in the `server/` directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-domain.com

# Gophish API Configuration
GOPHISH_API_KEY=your_actual_gophish_api_key_here
GOPHISH_BASE_URL=https://your-gophish-server:3333

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here
JWT_EXPIRY=7d

# Optional: MongoDB (if using instead of local storage)
# MONGODB_URI=mongodb://localhost:27017/sentrifense

# Optional: Mock data for development
# USE_MOCK_DATA=false
```

### 2. Frontend Environment Variables

Create `.env` file in the root directory:

```bash
# API Configuration
VITE_API_URL=https://your-domain.com/api
VITE_SOCKET_URL=https://your-domain.com

# Application Configuration
VITE_APP_NAME=Sentrifense
VITE_APP_DESCRIPTION=Phishing Control Center

# Optional: Development overrides
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000
```

## 🏗️ Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1.1 Create Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/settings/gophish || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/server.js"]
```

#### 1.2 Create docker-compose.yml

```yaml
version: '3.8'

services:
  sentrifense:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - GOPHISH_API_KEY=${GOPHISH_API_KEY}
      - GOPHISH_BASE_URL=${GOPHISH_BASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CLIENT_URL=${CLIENT_URL}
    volumes:
      - ./server/data:/app/server/data
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - sentrifense-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - sentrifense
    restart: unless-stopped
    networks:
      - sentrifense-network

networks:
  sentrifense-network:
    driver: bridge

volumes:
  data:
  logs:
```

#### 1.3 Create nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream sentrifense {
        server sentrifense:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://sentrifense;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://sentrifense;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
    }
}
```

### Option 2: Manual Deployment

#### 2.1 Backend Deployment

```bash
# 1. Install dependencies
cd server
npm ci --only=production

# 2. Set environment variables
export NODE_ENV=production
export PORT=5000
export GOPHISH_API_KEY=your_api_key
export GOPHISH_BASE_URL=https://your-gophish-server:3333
export JWT_SECRET=your_jwt_secret
export CLIENT_URL=https://your-domain.com

# 3. Start with PM2
npm install -g pm2
pm2 start server.js --name "sentrifense-backend"
pm2 save
pm2 startup
```

#### 2.2 Frontend Deployment

```bash
# 1. Build for production
npm ci
npm run build

# 2. Deploy to web server
# Copy dist/ contents to your web server directory
```

## 🔒 Security Configuration

### 1. SSL/TLS Setup

```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot --nginx -d your-domain.com

# Or use self-signed for testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

### 2. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# iptables (CentOS/RHEL)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### 3. Environment Security

```bash
# Generate secure secrets
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # JWT_REFRESH_SECRET

# Set file permissions
chmod 600 .env
chown root:root .env
```

## 📊 Monitoring & Logging

### 1. Application Logs

```bash
# PM2 logs
pm2 logs sentrifense-backend

# Docker logs
docker-compose logs -f sentrifense

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. Health Checks

```bash
# API health check
curl -f https://your-domain.com/api/settings/gophish

# Application status
pm2 status
docker-compose ps
```

### 3. Performance Monitoring

```bash
# Install monitoring tools
npm install -g clinic
clinic doctor -- node server/server.js

# Memory usage
pm2 monit
docker stats
```

## 🔄 Update & Maintenance

### 1. Application Updates

```bash
# Docker deployment
git pull
docker-compose build
docker-compose up -d

# Manual deployment
git pull
npm ci
npm run build
pm2 restart sentrifense-backend
```

### 2. Database Backup

```bash
# Local storage backup
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/

# MongoDB backup (if using)
mongodump --db sentrifense --out backup-$(date +%Y%m%d)
```

### 3. Rollback Procedure

```bash
# Docker rollback
docker-compose down
docker image tag sentrifense:previous sentrifense:latest
docker-compose up -d

# Manual rollback
git checkout previous-version
npm ci
npm run build
pm2 restart sentrifense-backend
```

## 🧪 Testing Deployment

### 1. Pre-deployment Tests

```bash
# Run test suite
cd server
node test-all-endpoints.js

# Test Gophish connection
curl -X GET "https://your-domain.com/api/settings/gophish"

# Test frontend
curl -X GET "https://your-domain.com"
```

### 2. Post-deployment Verification

```bash
# Check all endpoints
./scripts/health-check.sh

# Verify SSL
curl -I https://your-domain.com

# Test API functionality
curl -X GET "https://your-domain.com/api/campaigns"
```

## 📝 Troubleshooting

### Common Issues

1. **Gophish Connection Failed**
   - Verify Gophish server is running
   - Check API key and base URL
   - Test SSL certificate validity

2. **Frontend Not Loading**
   - Check nginx configuration
   - Verify static files are served
   - Check browser console for errors

3. **API Errors**
   - Check server logs
   - Verify environment variables
   - Test API endpoints directly

### Debug Commands

```bash
# Check application status
pm2 status
docker-compose ps

# View logs
pm2 logs
docker-compose logs

# Test connectivity
curl -v https://your-domain.com/api/settings/gophish

# Check SSL
openssl s_client -connect your-domain.com:443
```

## 📞 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review application logs
3. Test individual components
4. Verify environment configuration
5. Check network connectivity

## 🎯 Next Steps

After successful deployment:

1. **Configure Gophish Settings**: Use the web interface to set up your Gophish connection
2. **Create Initial Data**: Set up campaigns, templates, and groups
3. **User Training**: Train users on the new platform
4. **Monitor Performance**: Set up monitoring and alerting
5. **Regular Maintenance**: Schedule regular updates and backups 