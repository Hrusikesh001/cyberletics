const express = require('express');
const router = express.Router();
const GophishClient = require('../lib/gophishClient');

// Get all Gophish users
router.get('/', async (req, res) => {
  try {
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getUsers();
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to fetch users',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get a specific user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getUser(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(result.status || 404).json({
        status: 'error',
        message: `Failed to fetch user with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch user with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const userData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.createUser(userData);
    
    if (result.success) {
      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to create user',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Update an existing user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.updateUser(id, userData);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'User updated successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to update user with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to update user with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.deleteUser(id);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: `Failed to delete user with ID ${id}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to delete user with ID ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router; 