const express = require('express');
const router = express.Router();
const GophishClient = require('../lib/gophishClient');
const { localDB } = require('../db');

// Get all campaigns (both from Gophish and local DB)
router.get('/', async (req, res) => {
  try {
    // Get campaigns from Gophish
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getCampaigns();
    
    if (result.success) {
      // Sync campaigns with local database
      const campaigns = result.data;
      const localCampaigns = localDB.getCampaigns();
      
      // Update local DB with latest campaign data
      for (const campaign of campaigns) {
        const existingIndex = localCampaigns.findIndex(c => c.gophishId === campaign.id.toString());
        const campaignData = {
          gophishId: campaign.id.toString(),
          name: campaign.name,
          created_date: new Date(campaign.created_date).toISOString(),
          launch_date: new Date(campaign.launch_date).toISOString(),
          send_by_date: campaign.send_by_date ? new Date(campaign.send_by_date).toISOString() : null,
          completed_date: campaign.completed_date ? new Date(campaign.completed_date).toISOString() : null,
          template: {
            id: campaign.template.id,
            name: campaign.template.name
          },
          page: {
            id: campaign.page.id,
            name: campaign.page.name
          },
          smtp: {
            id: campaign.smtp.id,
            name: campaign.smtp.name
          },
          url: campaign.url,
          status: campaign.status,
          stats: {
            total: campaign.stats?.total || 0,
            sent: campaign.stats?.sent || 0,
            opened: campaign.stats?.opened || 0,
            clicked: campaign.stats?.clicked || 0,
            submitted: campaign.stats?.submitted || 0,
            reported: campaign.stats?.reported || 0
          },
          lastSynced: new Date().toISOString()
        };
        
        if (existingIndex !== -1) {
          // Update existing campaign
          localCampaigns[existingIndex] = { ...localCampaigns[existingIndex], ...campaignData };
        } else {
          // Add new campaign
          campaignData.id = Date.now().toString();
          localCampaigns.push(campaignData);
        }
      }
      
      // Save updated campaigns
      localDB.saveCampaigns(localCampaigns);
      
      res.json({
        status: 'success',
        data: campaigns
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to fetch campaigns from Gophish',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    
    // If Gophish is down, try to return cached data from local DB
    try {
      const localCampaigns = localDB.getCampaigns().sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
      
      if (localCampaigns.length > 0) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached campaigns. Gophish API unavailable.',
          data: localCampaigns
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to fetch campaigns from Gophish and no local cache available',
          error: error.message
        });
      }
    } catch (dbError) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch campaigns',
        error: error.message
      });
    }
  }
});

// Get a specific campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getCampaign(id);
    
    if (result.success) {
      // Update local DB with campaign data
      const localCampaigns = localDB.getCampaigns();
      const campaign = result.data;
      const existingIndex = localCampaigns.findIndex(c => c.gophishId === campaign.id.toString());
      
      if (existingIndex !== -1) {
        localCampaigns[existingIndex] = {
          ...localCampaigns[existingIndex],
          gophishId: campaign.id.toString(),
          name: campaign.name,
          created_date: new Date(campaign.created_date).toISOString(),
          launch_date: new Date(campaign.launch_date).toISOString(),
          send_by_date: campaign.send_by_date ? new Date(campaign.send_by_date).toISOString() : null,
          completed_date: campaign.completed_date ? new Date(campaign.completed_date).toISOString() : null,
          template: {
            id: campaign.template.id,
            name: campaign.template.name
          },
          page: {
            id: campaign.page.id,
            name: campaign.page.name
          },
          smtp: {
            id: campaign.smtp.id,
            name: campaign.smtp.name
          },
          url: campaign.url,
          status: campaign.status,
          stats: {
            total: campaign.stats?.total || 0,
            sent: campaign.stats?.sent || 0,
            opened: campaign.stats?.opened || 0,
            clicked: campaign.stats?.clicked || 0,
            submitted: campaign.stats?.submitted || 0,
            reported: campaign.stats?.reported || 0
          },
          lastSynced: new Date().toISOString()
        };
      } else {
        // Add new campaign if not found
        const newCampaign = {
          id: Date.now().toString(),
          gophishId: campaign.id.toString(),
          name: campaign.name,
          created_date: new Date(campaign.created_date).toISOString(),
          launch_date: new Date(campaign.launch_date).toISOString(),
          send_by_date: campaign.send_by_date ? new Date(campaign.send_by_date).toISOString() : null,
          completed_date: campaign.completed_date ? new Date(campaign.completed_date).toISOString() : null,
          template: {
            id: campaign.template.id,
            name: campaign.template.name
          },
          page: {
            id: campaign.page.id,
            name: campaign.page.name
          },
          smtp: {
            id: campaign.smtp.id,
            name: campaign.smtp.name
          },
          url: campaign.url,
          status: campaign.status,
          stats: {
            total: campaign.stats?.total || 0,
            sent: campaign.stats?.sent || 0,
            opened: campaign.stats?.opened || 0,
            clicked: campaign.stats?.clicked || 0,
            submitted: campaign.stats?.submitted || 0,
            reported: campaign.stats?.reported || 0
          },
          lastSynced: new Date().toISOString()
        };
        localCampaigns.push(newCampaign);
      }
      
      localDB.saveCampaigns(localCampaigns);
      
      res.json({
        status: 'success',
        data: campaign
      });
    } else {
      // Try to get from local DB if Gophish fails
      const localCampaign = localDB.getCampaigns().find(c => c.gophishId === id);
      
      if (localCampaign) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached campaign. Gophish API unavailable.',
          data: localCampaign
        });
      } else {
        res.status(result.status || 404).json({
          status: 'error',
          message: `Campaign with ID ${id} not found`,
          error: result.error
        });
      }
    }
  } catch (error) {
    console.error(`Error fetching campaign ${req.params.id}:`, error);
    
    // Try to return cached results
    try {
      const localCampaign = localDB.getCampaigns().find(c => c.gophishId === req.params.id);
      
      if (localCampaign) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached campaign. Gophish API unavailable.',
          data: localCampaign
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: `Failed to fetch campaign with ID ${req.params.id}`,
          error: error.message
        });
      }
    } catch (dbError) {
      res.status(500).json({
        status: 'error',
        message: `Failed to fetch campaign with ID ${req.params.id}`,
        error: error.message
      });
    }
  }
});

// Create a new campaign
router.post('/', async (req, res) => {
  try {
    const campaignData = req.body;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.createCampaign(campaignData);
    
    if (result.success) {
      // Store in local DB
      const localCampaigns = localDB.getCampaigns();
      const newCampaign = {
        id: Date.now().toString(),
        gophishId: result.data.id.toString(),
        name: result.data.name,
        created_date: new Date(result.data.created_date).toISOString(),
        launch_date: new Date(result.data.launch_date).toISOString(),
        send_by_date: result.data.send_by_date ? new Date(result.data.send_by_date).toISOString() : null,
        completed_date: result.data.completed_date ? new Date(result.data.completed_date).toISOString() : null,
        template: {
          id: result.data.template.id,
          name: result.data.template.name
        },
        page: {
          id: result.data.page.id,
          name: result.data.page.name
        },
        smtp: {
          id: result.data.smtp.id,
          name: result.data.smtp.name
        },
        url: result.data.url,
        status: result.data.status,
        stats: {
          total: result.data.stats?.total || 0,
          sent: result.data.stats?.sent || 0,
          opened: result.data.stats?.opened || 0,
          clicked: result.data.stats?.clicked || 0,
          submitted: result.data.stats?.submitted || 0,
          reported: result.data.stats?.reported || 0
        },
        lastSynced: new Date().toISOString()
      };
      localCampaigns.push(newCampaign);
      localDB.saveCampaigns(localCampaigns);
      
      res.status(201).json({
        status: 'success',
        message: 'Campaign created successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to create campaign',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

// Complete a campaign
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.completeCampaign(id);
    
    if (result.success) {
      // Update local DB
      const localCampaigns = localDB.getCampaigns();
      const campaign = localCampaigns.find(c => c.gophishId === id);
      if (campaign) {
        campaign.status = 'COMPLETED';
        campaign.completed_date = new Date().toISOString();
      }
      localDB.saveCampaigns(localCampaigns);
      
      res.json({
        status: 'success',
        message: 'Campaign completed successfully',
        data: result.data
      });
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to complete campaign',
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error completing campaign ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete campaign',
      error: error.message
    });
  }
});

// Get campaign results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.getCampaignResults(id);
    
    if (result.success) {
      // Update local DB with results
      const localCampaigns = localDB.getCampaigns();
      const campaign = localCampaigns.find(c => c.gophishId === id);
      if (campaign) {
        campaign.results = result.data.map(result => ({
          email: result.email,
          firstName: result.first_name,
          lastName: result.last_name,
          position: result.position,
          status: result.status,
          ip: result.ip,
          latitude: result.latitude,
          longitude: result.longitude,
          sendDate: result.send_date ? new Date(result.send_date).toISOString() : null,
          openDate: result.open_date ? new Date(result.open_date).toISOString() : null,
          clickDate: result.click_date ? new Date(result.click_date).toISOString() : null,
          submitDate: result.submit_date ? new Date(result.submit_date).toISOString() : null,
          reportDate: result.report_date ? new Date(result.report_date).toISOString() : null
        }));
      }
      localDB.saveCampaigns(localCampaigns);
      
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      // Try to get from local DB if Gophish fails
      const localCampaign = localDB.getCampaigns().find(c => c.gophishId === id);
      
      if (localCampaign && localCampaign.results) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached results. Gophish API unavailable.',
          data: localCampaign.results
        });
      } else {
        res.status(result.status || 500).json({
          status: 'error',
          message: 'Failed to fetch campaign results',
          error: result.error
        });
      }
    }
  } catch (error) {
    console.error(`Error fetching campaign results for ${req.params.id}:`, error);
    
    // Try to return cached results
    try {
      const localCampaign = localDB.getCampaigns().find(c => c.gophishId === req.params.id);
      
      if (localCampaign && localCampaign.results) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached results. Gophish API unavailable.',
          data: localCampaign.results
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to fetch campaign results',
          error: error.message
        });
      }
    } catch (dbError) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch campaign results',
        error: error.message
      });
    }
  }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = new GophishClient({
      baseURL: process.env.GOPHISH_BASE_URL || 'https://localhost:3333',
      apiKey: process.env.GOPHISH_API_KEY || ''
    });
    
    const result = await gophishClient.deleteCampaign(id);
    
    if (result.success) {
      // Remove from local DB as well
      const localCampaigns = localDB.getCampaigns();
      const initialLength = localCampaigns.length;
      localCampaigns.splice(localCampaigns.findIndex(c => c.gophishId === id), 1);
      if (localCampaigns.length < initialLength) {
        localDB.saveCampaigns(localCampaigns);
        res.json({
          status: 'success',
          message: 'Campaign deleted successfully'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: `Failed to delete campaign with ID ${id}`,
          error: 'Campaign not found in local DB'
        });
      }
    } else {
      res.status(result.status || 500).json({
        status: 'error',
        message: 'Failed to delete campaign',
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error deleting campaign ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete campaign',
      error: error.message
    });
  }
});

module.exports = router; 