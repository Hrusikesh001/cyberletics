const express = require('express');
const router = express.Router();
const GophishClient = require('../lib/gophishClient');

// Get Gophish server info and connection status
router.get('/gophish', async (req, res) => {
  try {
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    // Test connection to Gophish API
    const result = await gophishClient.testConnection();
    
    if (result.success) {
      // Return server info with masked API key
      const apiKey = process.env.GOPHISH_API_KEY || '';
      const maskedKey = apiKey.length > 0 
        ? apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4)
        : '';
      
      res.json({
        status: 'connected',
        version: result.data?.version || 'Unknown',
        baseUrl: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
        apiKey: maskedKey,
        config: gophishClient.getConfig()
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to connect to Gophish API',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Gophish connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Gophish API',
      error: error.message
    });
  }
});

// Test Gophish connection
router.post('/gophish/test', async (req, res) => {
  try {
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.testConnection();
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Successfully connected to Gophish API',
        data: {
          version: result.data?.version || 'Unknown'
        }
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to connect to Gophish API',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Gophish connection test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Gophish API',
      error: error.message
    });
  }
});

// Update Gophish connection settings
router.put('/gophish', (req, res) => {
  const { apiKey, baseUrl } = req.body;
  
  // In a real application, you would securely store these values
  // This example just modifies environment variables during runtime
  // A production system should update the .env file or use a secure config storage
  
  if (apiKey) {
    process.env.GOPHISH_API_KEY = apiKey;
  }
  
  if (baseUrl) {
    process.env.GOPHISH_BASE_URL = baseUrl;
  }
  
  res.json({
    status: 'success',
    message: 'Gophish settings updated successfully',
    config: {
      baseUrl: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: apiKey ? `${apiKey.substring(0, 4)}••••••••${apiKey.substring(apiKey.length - 4)}` : ''
    }
  });
});

// Get Gophish API configuration
router.get('/gophish/config', (req, res) => {
  const gophishClient = new GophishClient({
    baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
    apiKey: process.env.GOPHISH_API_KEY || ''
  });
  
  res.json({
    status: 'success',
    data: gophishClient.getConfig()
  });
});

module.exports = router; 