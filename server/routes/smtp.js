const express = require('express');
const router = express.Router();
const GophishClient = require('../lib/gophishClient');

// Get all SMTP profiles
router.get('/', async (req, res) => {
  try {
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getSmtpProfiles();
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to fetch SMTP profiles',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching SMTP profiles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch SMTP profiles',
      error: error.message
    });
  }
});

// Get a specific SMTP profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getSmtpProfile(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 404).json({
        status: 'error',
        message: `Failed to fetch SMTP profile with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error fetching SMTP profile ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch SMTP profile with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Create a new SMTP profile
router.post('/', async (req, res) => {
  try {
    const smtpData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.createSmtpProfile(smtpData);
    
    if (result.success) {
      res.status(201).json({
        status: 'success',
        message: 'SMTP profile created successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to create SMTP profile',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating SMTP profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create SMTP profile',
      error: error.message
    });
  }
});

// Update an existing SMTP profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const smtpData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.updateSmtpProfile(id, smtpData);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'SMTP profile updated successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to update SMTP profile with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error updating SMTP profile ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to update SMTP profile with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete an SMTP profile
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.deleteSmtpProfile(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'SMTP profile deleted successfully'
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to delete SMTP profile with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error deleting SMTP profile ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to delete SMTP profile with ID ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router; 