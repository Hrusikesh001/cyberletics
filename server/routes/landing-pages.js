const express = require('express');
const router = express.Router();
const { createGophishClient } = require('../server');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get all landing pages
router.get('/', async (req, res) => {
  try {
    const gophishClient = createGophishClient();
    const response = await gophishClient.get('/pages/');
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to fetch landing pages',
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/pages/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to fetch landing page with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/pages/', pageData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: 'Landing page created successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to create landing page',
        error: response.data
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

// Import a landing page from an HTML file
router.post('/import', upload.single('page_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No landing page file provided'
      });
    }
    
    const pageName = req.body.name || `Imported Page ${new Date().toISOString()}`;
    const pageContent = req.file.buffer.toString('utf8');
    
    const pageData = {
      name: pageName,
      html: pageContent,
      capture_credentials: req.body.capture_credentials === 'true',
      capture_passwords: req.body.capture_passwords === 'true',
      redirect_url: req.body.redirect_url || ''
    };
    
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/pages/', pageData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: 'Landing page imported successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to import landing page',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Error importing landing page:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import landing page',
      error: error.message
    });
  }
});

// Update an existing landing page
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pageData = req.body;
    const gophishClient = createGophishClient();
    const response = await gophishClient.put(`/pages/${id}`, pageData);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'Landing page updated successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to update landing page with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.delete(`/pages/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'Landing page deleted successfully'
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to delete landing page with ID ${id}`,
        error: response.data
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