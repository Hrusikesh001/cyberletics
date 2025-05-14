const express = require('express');
const router = express.Router();
const { createGophishClient } = require('../server');

// Get Gophish server info and connection status
router.get('/gophish', async (req, res) => {
  try {
    const gophishClient = createGophishClient();
    
    // Test connection to Gophish API by fetching server information
    const response = await gophishClient.get('/');
    
    if (response.status === 200) {
      // Return server info with masked API key
      const apiKey = process.env.GOPHISH_API_KEY || '';
      const maskedKey = apiKey.length > 0 
        ? apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4)
        : '';
      
      res.json({
        status: 'connected',
        version: response.data?.version || 'Unknown',
        baseUrl: process.env.GOPHISH_BASE_URL || 'https://localhost:3333/api',
        apiKey: maskedKey
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to connect to Gophish API',
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.get('/');
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'Successfully connected to Gophish API',
        data: {
          version: response.data?.version || 'Unknown'
        }
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to connect to Gophish API',
        error: response.data
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
    message: 'Gophish settings updated successfully'
  });
});

module.exports = router; 