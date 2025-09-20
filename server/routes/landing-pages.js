const express = require('express');
const router = express.Router();
const GophishClient = require('../lib/gophishClient');

// Get all landing pages
router.get('/', async (req, res) => {
  try {
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getPages();
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to fetch landing pages',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch landing pages',
      error: error.message
    });
  }
});

// Get a specific landing page
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getPage(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 404).json({
        status: 'error',
        message: `Failed to fetch landing page with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error fetching landing page ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch landing page with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Create a new landing page
router.post('/', async (req, res) => {
  try {
    const pageData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.createPage(pageData);
    
    if (result.success) {
      res.status(201).json({
        status: 'success',
        message: 'Landing page created successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to create landing page',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating landing page:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create landing page',
      error: error.message
    });
  }
});

// Update an existing landing page
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pageData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.updatePage(id, pageData);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Landing page updated successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to update landing page with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error updating landing page ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to update landing page with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete a landing page
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.deletePage(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Landing page deleted successfully'
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to delete landing page with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error deleting landing page ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to delete landing page with ID ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router; 