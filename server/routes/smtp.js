const express = require('express');
const router = express.Router();
const { createGophishClient } = require('../server');

// Get all SMTP profiles
router.get('/', async (req, res) => {
  try {
    const gophishClient = createGophishClient();
    const response = await gophishClient.get('/smtp/');
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to fetch SMTP profiles',
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/smtp/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to fetch SMTP profile with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/smtp/', smtpData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: 'SMTP profile created successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to create SMTP profile',
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.put(`/smtp/${id}`, smtpData);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'SMTP profile updated successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to update SMTP profile with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.delete(`/smtp/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'SMTP profile deleted successfully'
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to delete SMTP profile with ID ${id}`,
        error: response.data
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