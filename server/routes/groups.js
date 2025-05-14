const express = require('express');
const router = express.Router();
const { createGophishClient } = require('../server');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const csv = require('csv-parser');
const { Readable } = require('stream');

// Get all groups
router.get('/', async (req, res) => {
  try {
    const gophishClient = createGophishClient();
    const response = await gophishClient.get('/groups/');
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to fetch groups',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch groups',
      error: error.message
    });
  }
});

// Get a specific group
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/groups/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to fetch group with ID ${id}`,
        error: response.data
      });
    }
  } catch (error) {
    console.error(`Error fetching group ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch group with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Create a new group
router.post('/', async (req, res) => {
  try {
    const groupData = req.body;
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/groups/', groupData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: 'Group created successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to create group',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create group',
      error: error.message
    });
  }
});

// Import users from CSV
router.post('/import', upload.single('csv_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No CSV file provided'
      });
    }
    
    const groupName = req.body.name || `Imported Group ${new Date().toISOString()}`;
    const fileContent = req.file.buffer.toString('utf8');
    
    // Parse CSV
    const users = [];
    const readableStream = Readable.from(fileContent);
    
    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csv())
        .on('data', (data) => {
          const user = {
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            position: data.position || ''
          };
          
          // Only add users with valid email addresses
          if (user.email && user.email.includes('@')) {
            users.push(user);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    if (users.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid users found in CSV file'
      });
    }
    
    // Create group with imported users
    const groupData = {
      name: groupName,
      targets: users
    };
    
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/groups/', groupData);
    
    if (response.status === 201) {
      res.status(201).json({
        status: 'success',
        message: `Group created with ${users.length} users`,
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to create group from CSV',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Error importing users from CSV:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import users from CSV',
      error: error.message
    });
  }
});

// Update an existing group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const groupData = req.body;
    const gophishClient = createGophishClient();
    const response = await gophishClient.put(`/groups/${id}`, groupData);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'Group updated successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to update group with ID ${id}`,
        error: response.data
      });
    }
  } catch (error) {
    console.error(`Error updating group ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to update group with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete a group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = createGophishClient();
    const response = await gophishClient.delete(`/groups/${id}`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        message: 'Group deleted successfully'
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to delete group with ID ${id}`,
        error: response.data
      });
    }
  } catch (error) {
    console.error(`Error deleting group ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to delete group with ID ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router; 