#!/bin/bash

# Sentrifense Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="sentrifense"
BACKEND_PORT=5000
FRONTEND_PORT=5173

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18+ is required. Current version: $(node -v)"
    fi
    
    success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install frontend dependencies
    log "Installing frontend dependencies..."
    npm ci --silent
    
    # Install backend dependencies
    log "Installing backend dependencies..."
    cd server
    npm ci --silent --only=production
    cd ..
    
    success "Dependencies installed successfully"
}

# Build frontend
build_frontend() {
    log "Building frontend for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build
    
    if [ ! -d "dist" ]; then
        error "Frontend build failed - dist directory not found"
    fi
    
    success "Frontend built successfully"
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    # Check if .env files exist
    if [ ! -f ".env" ]; then
        warning "Frontend .env file not found. Creating template..."
        cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Sentrifense
VITE_APP_DESCRIPTION=Phishing Control Center
EOF
    fi
    
    if [ ! -f "server/.env" ]; then
        warning "Backend .env file not found. Creating template..."
        cat > server/.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:5173

# Gophish API Configuration
GOPHISH_API_KEY=your_gophish_api_key_here
GOPHISH_BASE_URL=https://localhost:3333

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRY=7d
EOF
        warning "Please update server/.env with your actual configuration"
    fi
    
    success "Environment setup completed"
}

# Start backend
start_backend() {
    log "Starting backend server..."
    
    cd server
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 not found. Installing PM2..."
        npm install -g pm2
    fi
    
    # Stop existing process if running
    pm2 stop $APP_NAME-backend 2>/dev/null || true
    pm2 delete $APP_NAME-backend 2>/dev/null || true
    
    # Start the backend
    pm2 start server.js --name "$APP_NAME-backend" --env production
    
    # Save PM2 configuration
    pm2 save
    
    cd ..
    
    success "Backend started successfully"
}

# Start frontend
start_frontend() {
    log "Starting frontend development server..."
    
    # Start frontend in background
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait a moment for the server to start
    sleep 5
    
    # Check if frontend is running
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
        success "Frontend started successfully on port $FRONTEND_PORT"
    else
        error "Frontend failed to start"
    fi
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Check backend
    if curl -s http://localhost:$BACKEND_PORT/api/settings/gophish > /dev/null; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    success "All health checks passed"
}

# Show status
show_status() {
    log "Application Status:"
    echo ""
    echo "Backend:"
    pm2 status $APP_NAME-backend 2>/dev/null || echo "  Not running"
    echo ""
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Backend API: http://localhost:$BACKEND_PORT"
    echo ""
    echo "Useful commands:"
    echo "  pm2 logs $APP_NAME-backend    # View backend logs"
    echo "  pm2 restart $APP_NAME-backend # Restart backend"
    echo "  pm2 stop $APP_NAME-backend    # Stop backend"
    echo ""
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Kill frontend process if running
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
}

# Main deployment function
deploy() {
    log "Starting Sentrifense deployment..."
    
    # Set up cleanup on exit
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    setup_environment
    build_frontend
    start_backend
    start_frontend
    health_check
    
    success "Deployment completed successfully!"
    show_status
}

# Stop function
stop() {
    log "Stopping Sentrifense..."
    
    # Stop backend
    pm2 stop $APP_NAME-backend 2>/dev/null || true
    
    # Kill frontend process
    pkill -f "vite" 2>/dev/null || true
    
    success "Sentrifense stopped"
}

# Restart function
restart() {
    log "Restarting Sentrifense..."
    
    stop
    sleep 2
    deploy
}

# Show usage
usage() {
    echo "Usage: $0 {deploy|stop|restart|status}"
    echo ""
    echo "Commands:"
    echo "  deploy   - Deploy the application"
    echo "  stop     - Stop the application"
    echo "  restart  - Restart the application"
    echo "  status   - Show application status"
    echo ""
}

# Main script logic
case "$1" in
    deploy)
        deploy
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        show_status
        ;;
    *)
        usage
        exit 1
        ;;
esac 