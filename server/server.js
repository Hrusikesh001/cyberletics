const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sentrifense')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create Gophish API client
const createGophishClient = () => {
  const client = axios.create({
    baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333/api',
    headers: {
      'Authorization': `Bearer ${process.env.GOPHISH_API_KEY}`,
      'Content-Type': 'application/json'
    },
    validateStatus: status => status < 500
  });
  
  return client;
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

// API routes
app.use('/api/settings', settingsRoutes);
app.use('/api/smtp', smtpRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/landing-pages', landingPagesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/webhooks', webhooksRoutes);

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