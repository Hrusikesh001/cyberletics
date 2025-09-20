const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { connectDB } = require('./db'); // Local storage connection logic

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:8080',
  'http://localhost:8081',
  'http://192.168.56.1:8080',
  'http://192.168.101.12:8080',
  'http://172.24.192.1:8080'
];

// Setup Socket.io for real-time updates
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in development
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));

// Connect to MongoDB
connectDB();

// Import the GophishClient
const GophishClient = require('./lib/gophishClient');

// Create Gophish API client
const createGophishClient = () => {
  // Check if we're in development mode and using mock data
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true') {
    // Return a mock client that doesn't actually connect to Gophish
    return {
      get: async (url) => {
        console.log(`MOCK: GET request to ${url}`);
        // Return mock data based on the requested endpoint
        if (url === '/') {
          return { status: 200, data: { version: 'Mock Gophish v0.0.0' } };
        } else if (url === '/campaigns') {
          return { status: 200, data: [] }; // Return empty array of campaigns
        } else if (url === '/templates') {
          return { status: 200, data: [] }; // Return empty array of templates
        } else if (url === '/smtp') {
          return { status: 200, data: [] }; // Return empty array of SMTP settings
        } else if (url === '/landing_pages') {
          return { status: 200, data: [] }; // Return empty array of landing pages
        } else if (url === '/groups') {
          return { status: 200, data: [] }; // Return empty array of groups
        }
        // Default response
        return { status: 200, data: {} };
      },
      post: async (url, data) => {
        console.log(`MOCK: POST request to ${url}`, data);
        return { status: 200, data: { id: 1, ...data } };
      },
      put: async (url, data) => {
        console.log(`MOCK: PUT request to ${url}`, data);
        return { status: 200, data: { id: 1, ...data } };
      },
      delete: async (url) => {
        console.log(`MOCK: DELETE request to ${url}`);
        return { status: 200, data: { success: true } };
      }
    };
  }
  
  // Create and return the new GophishClient instance
  return new GophishClient({
    baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
    apiKey: process.env.GOPHISH_API_KEY || '',
    timeout: 10000
  });
};

// Load routes
const settingsRoutes = require('./routes/settings');
const smtpRoutes = require('./routes/smtp');
const templatesRoutes = require('./routes/templates');
const landingPagesRoutes = require('./routes/landing-pages');
const groupsRoutes = require('./routes/groups');
const campaignsRoutes = require('./routes/campaigns');
const usersRoutes = require('./routes/users');
const webhooksRoutes = require('./routes/webhooks');
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenant');

// API routes
app.use('/api/settings', settingsRoutes);
app.use('/api/smtp', smtpRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/landing-pages', landingPagesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/auth', authRoutes); // Auth, onboarding, invitation
app.use('/api/tenant', tenantRoutes); // Tenant-specific data

// Webhook endpoint
app.post('/webhooks', (req, res) => {
  const event = req.body;
  
  // Broadcast the webhook event to all connected clients
  io.emit('webhook-event', event);
  
  // Save to MongoDB
  // Implementation will be in the webhooks route handler
  
  res.status(200).send('Event received');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the Gophish client creator for use in route handlers
module.exports = { createGophishClient };

// Also export it globally for route handlers
global.createGophishClient = createGophishClient; 