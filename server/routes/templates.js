const express = require('express');
const router = express.Router();
const { createGophishClient } = require('../server');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get all templates
router.get('/', async (req, res) => {
  try {
    const gophishClient = createGophishClient();
    const response = await gophishClient.get('/templates/');
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to fetch templates',
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/templates/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to fetch template with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/templates/', templateData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: 'Template created successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to create template',
        error: response.data
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

// Import a template from an HTML file
router.post('/import', upload.single('template_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No template file provided'
      });
    }
    
    const templateName = req.body.name || `Imported Template ${new Date().toISOString()}`;
    const templateSubject = req.body.subject || 'Imported Template';
    const templateContent = req.file.buffer.toString('utf8');
    
    const templateData = {
      name: templateName,
      subject: templateSubject,
      html: templateContent,
      text: req.body.text || ''
    };
    
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/templates/', templateData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: 'Template imported successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to import template',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Error importing template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import template',
      error: error.message
    });
  }
});

// Update an existing template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    const gophishClient = createGophishClient();
    const response = await gophishClient.put(`/templates/${id}`, templateData);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'Template updated successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to update template with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.delete(`/templates/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'Template deleted successfully'
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to delete template with ID ${id}`,
        error: response.data
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