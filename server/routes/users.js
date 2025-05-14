const express = require('express');
const router = express.Router();
const { createGophishClient } = require('../server');

// Get all Gophish users
router.get('/', async (req, res) => {
  try {
    const gophishClient = createGophishClient();
    const response = await gophishClient.get('/users/');
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to fetch users',
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/users/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to fetch user with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/users/', userData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to create user',
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.put(`/users/${id}`, userData);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'User updated successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to update user with ID ${id}`,
        error: response.data
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.delete(`/users/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to delete user with ID ${id}`,
        error: response.data
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