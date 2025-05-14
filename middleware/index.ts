import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import connectDB from './config/database';
import routes from './routes';

// Import models
import UserProgress from './models/UserProgress';
import CampaignEvent from './models/CampaignEvent';

// Import configuration and utilities
import config from './config/config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler, rateLimitHandler } from './utils/errorHandler';
import { createGoPhishClient } from './utils/gophishClient';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB().catch(err => {
  logger.error('Failed to connect to database, exiting application', { error: err });
  process.exit(1);
});

// Create Express app
const app = express();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GoPhish API configuration
const GOPHISH_BASE_URL = process.env.GOPHISH_BASE_URL || 'https://localhost:3333/api';
const GOPHISH_API_KEY = process.env.GOPHISH_API_KEY || '';

// Configure security middleware
app.use(helmet()); // Set security headers
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: config.rateLimit.standardHeaders,
    legacyHeaders: config.rateLimit.legacyHeaders,
    message: config.rateLimit.message,
    handler: rateLimitHandler
  })
);

// Configure middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));

// Configure logging
app.use(morgan(config.logging.format));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Verification middleware
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add user info to request
    (req as any).user = decoded.user;
    
    // Extract tenant ID from headers or default to the one in JWT
    const tenantId = req.headers['x-tenant-id'] as string || decoded.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    // Add tenant ID to request
    (req as any).tenantId = tenantId;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Proxy middleware setup with tenant context
app.use('/api', verifyToken, async (req, res, next) => {
  const tenantId = (req as any).tenantId;
  const goPhishClient = createGoPhishClient(tenantId);
  
  try {
    // Map our API paths to GoPhish API
    const endpoint = req.path;
    const method = req.method.toLowerCase();
    
    // Log the request for debugging
    console.log(`Proxying ${method.toUpperCase()} ${endpoint} for tenant ${tenantId}`);
    
    // Create a function to call the appropriate method with the appropriate arguments
    const makeRequest = async () => {
      if (method === 'get') {
        return await goPhishClient.get(endpoint, { params: req.query });
      } else if (method === 'post') {
        return await goPhishClient.post(endpoint, req.body);
      } else if (method === 'put') {
        return await goPhishClient.put(endpoint, req.body);
      } else if (method === 'delete') {
        return await goPhishClient.delete(endpoint);
      }
      throw new Error(`Unsupported method: ${method}`);
    };
    
    // Execute the request
    const response = await makeRequest();
    
    // Send the response back to the client
    res.status(response.status).json(response.data);
  } catch (error: any) {
    // Handle errors
    console.error('GoPhish API error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Authentication endpoints
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // In a real app, you would validate credentials against a database
  // For demo purposes, we'll use a simple hardcoded check
  if (email === 'admin@example.com' && password === 'password') {
    // Generate JWT token
    const token = jwt.sign(
      { 
        user: { id: '1', email, name: 'Admin User', role: 'admin' },
        tenantId: 'tenant1'
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    // Return token and user info
    res.json({
      token,
      user: { id: '1', email, name: 'Admin User', role: 'admin' },
      tenants: [
        { id: 'tenant1', name: 'Demo Organization' },
        { id: 'tenant2', name: 'Test Company' }
      ]
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/auth/me', verifyToken, (req, res) => {
  // Return user info from the JWT
  res.json({
    user: (req as any).user,
    tenants: [
      { id: 'tenant1', name: 'Demo Organization' },
      { id: 'tenant2', name: 'Test Company' }
    ]
  });
});

// Training module endpoints
app.post('/training/progress', verifyToken, async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const { moduleId, score, completed, answers, timeSpent } = req.body;
    
    const progressData = {
      userId,
      tenantId,
      moduleId,
      score,
      completed,
      answers,
      timeSpent
    };
    
    const updatedProgress = await UserProgress.updateProgress(progressData);
    res.status(200).json(updatedProgress);
  } catch (error: any) {
    console.error('Error updating training progress:', error);
    res.status(500).json({ message: 'Error updating training progress', error: error.message });
  }
});

app.get('/training/progress', verifyToken, async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    
    const progress = await UserProgress.getUserProgress(userId, tenantId);
    res.status(200).json(progress);
  } catch (error: any) {
    console.error('Error fetching training progress:', error);
    res.status(500).json({ message: 'Error fetching training progress', error: error.message });
  }
});

// Custom API endpoints
app.get('/api/reports', verifyToken, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const goPhishClient = createGoPhishClient(tenantId);
  
  try {
    // Fetch campaign results and aggregate data
    const campaignsResponse = await goPhishClient.get('/campaigns');
    const campaigns = campaignsResponse.data;
    
    // Process and transform data
    const reports = campaigns.map((campaign: any) => {
      return {
        id: campaign.id,
        name: campaign.name,
        created_date: campaign.created_date,
        launch_date: campaign.launch_date,
        completed_date: campaign.completed_date,
        status: campaign.status,
        stats: {
          total: campaign.results.length,
          sent: campaign.stats.sent,
          opened: campaign.stats.opened,
          clicked: campaign.stats.clicked,
          submitted_data: campaign.stats.submitted_data
        }
      };
    });
    
    res.json(reports);
  } catch (error: any) {
    console.error('Reports API error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ 
      message: 'Failed to generate reports', 
      error: error.message 
    });
  }
});

// Event heatmap endpoint
app.get('/api/reports/heatmap', verifyToken, async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaignId, eventType = 'clicked' } = req.query;
    
    const heatmapData = await CampaignEvent.getEventHeatmap(
      tenantId, 
      campaignId as string | undefined, 
      eventType as string
    );
    
    res.status(200).json(heatmapData);
  } catch (error: any) {
    console.error('Error generating heatmap:', error);
    res.status(500).json({ message: 'Error generating heatmap', error: error.message });
  }
});

// Event timeline endpoint
app.get('/api/reports/:campaignId/timeline', verifyToken, async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaignId } = req.params;
    
    const timelineData = await CampaignEvent.getEventTimeline(tenantId, campaignId);
    res.status(200).json(timelineData);
  } catch (error: any) {
    console.error('Error generating timeline:', error);
    res.status(500).json({ message: 'Error generating timeline', error: error.message });
  }
});

// Event tracking endpoint (used by webhooks)
app.post('/api/events/track', async (req, res) => {
  try {
    // For webhooks, we need to extract tenant ID from the event itself
    const { tenantId, campaignId, email, eventType, ...eventData } = req.body;
    
    if (!tenantId || !campaignId || !email || !eventType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const event = await CampaignEvent.trackEvent({
      tenantId,
      campaignId,
      email,
      eventType,
      ...eventData,
      timestamp: new Date()
    });
    
    res.status(200).json({ message: 'Event tracked successfully', event });
  } catch (error: any) {
    console.error('Error tracking event:', error);
    res.status(500).json({ message: 'Error tracking event', error: error.message });
  }
});

// Webhook endpoint
app.post('/webhooks', (req, res) => {
  const event = req.body;
  
  // Process webhook event and track it
  try {
    // Convert Gophish webhook format to our event format
    const eventData = {
      tenantId: event.tenant_id || 'default', // This would need to be included in the webhook payload
      campaignId: event.campaign_id,
      email: event.email,
      eventType: event.message.toLowerCase().includes('clicked') ? 'clicked' : 
                event.message.toLowerCase().includes('submitted') ? 'submitted_data' : 
                event.message.toLowerCase().includes('opened') ? 'email_opened' : 'email_sent',
      ipAddress: event.details?.ip,
      userAgent: event.details?.user_agent,
      payload: event
    };
    
    // Track the event asynchronously (don't wait for it to complete)
    CampaignEvent.trackEvent(eventData).catch((err) => {
      console.error('Error logging webhook event:', err);
    });
    
    res.status(200).send('Event received');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(200).send('Event received but processing failed'); // Still return 200 to Gophish
  }
});

// Mount API routes
app.use('/api', routes);

// Proxy to GoPhish API for authenticated users
app.use('/gophish', createProxyMiddleware({
  target: config.gophish.baseUrl,
  changeOrigin: true,
  secure: config.gophish.verifySSL,
  pathRewrite: {
    '^/gophish': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add GoPhish API key
    const tenantId = (req as any).tenantId;
    proxyReq.setHeader('Authorization', `Bearer ${config.gophish.apiKey}`);
    if (tenantId) {
      proxyReq.setHeader('X-Tenant-ID', tenantId);
    }
  },
  onError: (err, req, res) => {
    logger.error('Proxy error:', { error: err.message });
    res.status(503).json({ message: 'GoPhish service unavailable', error: err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env
  });
});

// Handle 404 errors
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  logger.info(`Middleware server running on port ${PORT} in ${config.env} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', { 
    message: reason.message,
    stack: reason.stack
  });
  
  // In production, we might want to exit the process and let the process
  // manager restart it, but for development we'll keep it running
  if (config.env === 'production') {
    logger.error('Shutting down due to unhandled promise rejection');
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', { 
    message: err.message,
    stack: err.stack
  });
  
  // For uncaught exceptions, we should always exit as the process may be in an
  // inconsistent state
  logger.error('Shutting down due to uncaught exception');
  server.close(() => {
    process.exit(1);
  });
});

export default app; 