# Sentrifense Gophish Integration

This document describes the integration between Sentrifense and the Gophish API, providing a comprehensive phishing campaign management solution.

## Overview

[Gophish](https://getgophish.com/) is a powerful, open-source phishing framework that makes it easy to test an organization's security awareness through simulated phishing campaigns. This integration connects Sentrifense to the Gophish API, enabling you to manage all aspects of your phishing campaigns from within the Sentrifense UI.

## Features

- **Complete API Integration**: Access all Gophish capabilities through a unified interface
- **Real-time Campaign Tracking**: Monitor campaign results as they happen with WebSocket notifications
- **Database Persistence**: Store campaign and event data in MongoDB for historical analysis
- **Webhook Handling**: Process and analyze webhook events from Gophish

## Architecture

The integration consists of two main components:

1. **Express Backend**: 
   - Provides a RESTful API for interacting with Gophish
   - Manages authentication and communication with the Gophish API
   - Stores data in MongoDB for persistence
   - Handles webhooks and real-time events with Socket.io

2. **React Frontend**:
   - Communicates with the Express backend
   - Provides a modern, responsive UI for managing phishing campaigns
   - Displays real-time updates using Socket.io

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB
- Gophish instance (with API access)

### Environment Variables

#### Backend (.env)

```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/sentrifense
GOPHISH_API_KEY=your_gophish_api_key_here
GOPHISH_BASE_URL=https://your-gophish-server:3333/api
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d
```

#### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shubhamsk581/Sentrifense.git
   cd Sentrifense
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

4. Start MongoDB:
   ```bash
   mongod --dbpath /path/to/data/directory
   ```

5. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

6. Start the frontend:
   ```bash
   cd ..
   npm run dev
   ```

7. Access the application at `http://localhost:5173`

## Gophish Configuration

1. In your Gophish admin interface, go to Settings
2. Copy your API key
3. In Sentrifense, go to Settings > Gophish
4. Enter your Gophish API key and server URL
5. Set up a webhook in Gophish pointing to `http://your-sentrifense-server/webhooks`

## Included Components

### Backend

- **API Routes**:
  - `/api/settings/gophish`: Manage Gophish connection settings
  - `/api/smtp`: SMTP profile management
  - `/api/templates`: Email template management
  - `/api/landing-pages`: Landing page management
  - `/api/groups`: Target group management
  - `/api/campaigns`: Campaign management
  - `/api/users`: Gophish user management
  - `/api/webhooks`: Webhook event handling

- **Models**:
  - `Campaign`: Store campaign data
  - `WebhookEvent`: Store webhook events

### Frontend

- **Pages**:
  - Gophish Settings
  - SMTP Profiles
  - Email Templates
  - Landing Pages
  - User Groups
  - Campaigns (with real-time tracking)

- **Services**:
  - API Client for backend communication
  - Socket.io client for real-time updates

## Troubleshooting

- **API Connection Issues**: Verify your Gophish API key and URL in the settings
- **WebSocket Connection**: Check if your server allows WebSocket connections
- **Missing Data**: Ensure MongoDB is running and accessible

## Security Considerations

- The Gophish API key is stored in the backend .env file and should never be exposed to the client
- All API requests are authenticated
- Sensitive data is not logged or stored in plain text
- Webhooks should be configured to use HTTPS in production

## License

This project is licensed under the MIT License - see the LICENSE file for details. 