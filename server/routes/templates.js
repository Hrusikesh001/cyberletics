const express = require('express');
const router = express.Router();
const GophishClient = require('../lib/gophishClient');

// Get all templates
router.get('/', async (req, res) => {
  try {
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getTemplates();
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to fetch templates',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

// Get a specific template
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getTemplate(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 404).json({
        status: 'error',
        message: `Failed to fetch template with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error fetching template ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch template with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Create a new template
router.post('/', async (req, res) => {
  try {
    const templateData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.createTemplate(templateData);
    
    if (result.success) {
      res.status(201).json({
        status: 'success',
        message: 'Template created successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to create template',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create template',
      error: error.message
    });
  }
});

// Update an existing template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.updateTemplate(id, templateData);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Template updated successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to update template with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error updating template ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to update template with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete a template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.deleteTemplate(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Template deleted successfully'
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to delete template with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error deleting template ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to delete template with ID ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router; 