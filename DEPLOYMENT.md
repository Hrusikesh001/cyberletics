# Sentrifense Deployment Guide

This guide provides instructions for deploying the Sentrifense phishing control center with Gophish integration in various environments.

## Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- Gophish server
- Web server (for production deployment)

## Environment Configuration

### Frontend (.env)

Create a `.env` file in the project root with the following variables:

```
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Sentrifense
VITE_APP_DESCRIPTION=Phishing Control Center
```

### Backend (.env)

Create a `.env` file in the server directory with the following variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sentrifense

# Gophish API Configuration
GOPHISH_API_KEY=your_gophish_api_key_here
GOPHISH_BASE_URL=https://your-gophish-server:3333/api

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d
```

## Development Deployment

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Start MongoDB:
   ```bash
   mongod --dbpath /path/to/data/directory
   ```

4. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

6. Access the application at `http://localhost:5173`

## Production Deployment

### Backend Deployment

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Build the backend:
   ```bash
   cd server
   npm install --production
   ```

3. Start the backend with PM2:
   ```bash
   pm2 start server.js --name sentrifense-backend
   ```

4. Set up PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory. Deploy these files to your web server.

3. Configure your web server to serve the static files and proxy API requests to the backend server.

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/sentrifense/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the backend
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy WebSocket connections
    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Gophish Configuration

1. Install and set up Gophish by following the [official documentation](https://docs.getgophish.com/user-guide/installation).

2. Obtain your API key from the Gophish admin interface (Settings page).

3. Configure the webhook URL in Gophish to point to your Sentrifense backend:
   ```
   http://your-server-address/webhooks
   ```

4. Update the `.env` file for the backend with your Gophish API key and server URL.

## Database Backup

It's important to regularly back up your MongoDB database to prevent data loss.

1. Create a backup script:
   ```bash
   #!/bin/bash
   
   BACKUP_DIR="/path/to/backups"
   DATE=$(date +%Y-%m-%d)
   
   # Create backup directory if it doesn't exist
   mkdir -p $BACKUP_DIR
   
   # Backup the database
   mongodump --db sentrifense --out $BACKUP_DIR/$DATE
   
   # Compress the backup
   tar -czf $BACKUP_DIR/sentrifense-$DATE.tar.gz $BACKUP_DIR/$DATE
   
   # Remove the uncompressed directory
   rm -rf $BACKUP_DIR/$DATE
   
   # Keep only the last 7 backups
   ls -t $BACKUP_DIR/sentrifense-*.tar.gz | tail -n +8 | xargs rm -f
   ```

2. Set up a cron job to run the backup script daily:
   ```
   0 0 * * * /path/to/backup-script.sh
   ```

## Security Considerations

1. Always use HTTPS in production environments.
2. Set strong, unique passwords for MongoDB and Gophish.
3. Configure firewall rules to restrict access to your servers.
4. Regularly update all components to patch security vulnerabilities.
5. Store sensitive environment variables securely and do not commit them to version control.

## Troubleshooting

### WebSocket Connection Issues

If you encounter issues with real-time updates:

1. Check that the Socket.io server is running.
2. Verify that the `VITE_SOCKET_URL` in the frontend `.env` file is correct.
3. Ensure your web server is properly configured to proxy WebSocket connections.

### MongoDB Connection Issues

If the application can't connect to MongoDB:

1. Verify MongoDB is running.
2. Check the MongoDB connection string in the backend `.env` file.
3. Ensure network connectivity between the application server and MongoDB.

### Gophish API Issues

If you can't connect to the Gophish API:

1. Verify the Gophish server is running.
2. Check the API key and base URL in the backend `.env` file.
3. Ensure Gophish is configured to accept API requests from your server. 