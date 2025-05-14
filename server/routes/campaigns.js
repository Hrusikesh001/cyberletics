const express = require('express');
const router = express.Router();
const { createGophishClient } = require('../server');
const Campaign = require('../models/Campaign');

// Get all campaigns (both from Gophish and local DB)
router.get('/', async (req, res) => {
  try {
    // Get campaigns from Gophish
    const gophishClient = createGophishClient();
    const response = await gophishClient.get('/campaigns/');
    
    if (response.status === 200) {
      // Sync campaigns with local database
      const campaigns = response.data;
      
      // Update local DB with latest campaign data
      for (const campaign of campaigns) {
        await Campaign.findOneAndUpdate(
          { gophishId: campaign.id.toString() },
          {
            gophishId: campaign.id.toString(),
            name: campaign.name,
            created_date: new Date(campaign.created_date),
            launch_date: new Date(campaign.launch_date),
            send_by_date: campaign.send_by_date ? new Date(campaign.send_by_date) : null,
            completed_date: campaign.completed_date ? new Date(campaign.completed_date) : null,
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
            lastSynced: new Date()
          },
          { upsert: true, new: true }
        );
      }
      
      res.json({
        status: 'success',
        data: campaigns
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to fetch campaigns from Gophish',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    
    // If Gophish is down, try to return cached data from local DB
    try {
      const localCampaigns = await Campaign.find().sort({ created_date: -1 });
      
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
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/campaigns/${id}`);
    
    if (response.status === 200) {
      const campaign = response.data;
      
      // Update local DB
      await Campaign.findOneAndUpdate(
        { gophishId: campaign.id.toString() },
        {
          gophishId: campaign.id.toString(),
          name: campaign.name,
          created_date: new Date(campaign.created_date),
          launch_date: new Date(campaign.launch_date),
          send_by_date: campaign.send_by_date ? new Date(campaign.send_by_date) : null,
          completed_date: campaign.completed_date ? new Date(campaign.completed_date) : null,
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
          lastSynced: new Date()
        },
        { upsert: true, new: true }
      );
      
      res.json({
        status: 'success',
        data: campaign
      });
    } else {
      // Try to get from local DB if Gophish fails
      const localCampaign = await Campaign.findOne({ gophishId: id });
      
      if (localCampaign) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached campaign. Gophish API unavailable.',
          data: localCampaign
        });
      } else {
        res.status(response.status).json({
          status: 'error',
          message: `Failed to fetch campaign with ID ${id}`,
          error: response.data
        });
      }
    }
  } catch (error) {
    console.error(`Error fetching campaign ${req.params.id}:`, error);
    
    // Try to get from local DB if Gophish API is down
    try {
      const localCampaign = await Campaign.findOne({ gophishId: req.params.id });
      
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

// Get campaign summary
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/campaigns/${id}/summary`);
    
    if (response.status === 200) {
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to fetch campaign summary for ID ${id}`,
        error: response.data
      });
    }
  } catch (error) {
    console.error(`Error fetching campaign summary ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch campaign summary for ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Get campaign results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/campaigns/${id}/results`);
    
    if (response.status === 200) {
      // Update local DB with results
      const campaign = await Campaign.findOne({ gophishId: id });
      if (campaign) {
        campaign.results = response.data.map(result => ({
          email: result.email,
          firstName: result.first_name,
          lastName: result.last_name,
          position: result.position,
          status: result.status,
          ip: result.ip,
          latitude: result.latitude,
          longitude: result.longitude,
          sendDate: result.send_date ? new Date(result.send_date) : null,
          openDate: result.open_date ? new Date(result.open_date) : null,
          clickDate: result.click_date ? new Date(result.click_date) : null,
          submitDate: result.submit_date ? new Date(result.submit_date) : null,
          reportDate: result.report_date ? new Date(result.report_date) : null
        }));
        await campaign.save();
      }
      
      res.json({
        status: 'success',
        data: response.data
      });
    } else {
      // Try to get from local DB if Gophish fails
      const localCampaign = await Campaign.findOne({ gophishId: id });
      
      if (localCampaign && localCampaign.results) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached campaign results. Gophish API unavailable.',
          data: localCampaign.results
        });
      } else {
        res.status(response.status).json({
          status: 'error',
          message: `Failed to fetch campaign results for ID ${id}`,
          error: response.data
        });
      }
    }
  } catch (error) {
    console.error(`Error fetching campaign results ${req.params.id}:`, error);
    
    // Try to return cached results
    try {
      const localCampaign = await Campaign.findOne({ gophishId: req.params.id });
      
      if (localCampaign && localCampaign.results) {
        res.json({
          status: 'partial_success',
          message: 'Returned cached campaign results. Gophish API unavailable.',
          data: localCampaign.results
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: `Failed to fetch campaign results for ID ${req.params.id}`,
          error: error.message
        });
      }
    } catch (dbError) {
      res.status(500).json({
        status: 'error',
        message: `Failed to fetch campaign results for ID ${req.params.id}`,
        error: error.message
      });
    }
  }
});

// Create a new campaign
router.post('/', async (req, res) => {
  try {
    const campaignData = req.body;
    const gophishClient = createGophishClient();
    const response = await gophishClient.post('/campaigns/', campaignData);
    
    if (response.status === 201) {
      const campaign = response.data;
      
      // Store in local DB
      await Campaign.create({
        gophishId: campaign.id.toString(),
        name: campaign.name,
        created_date: new Date(campaign.created_date),
        launch_date: new Date(campaign.launch_date),
        send_by_date: campaign.send_by_date ? new Date(campaign.send_by_date) : null,
        completed_date: campaign.completed_date ? new Date(campaign.completed_date) : null,
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
        }
      });
      
      res.status(201).json({
        status: 'success',
        message: 'Campaign created successfully',
        data: campaign
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: 'Failed to create campaign',
        error: response.data
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
router.get('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = createGophishClient();
    const response = await gophishClient.get(`/campaigns/${id}/complete`);
    
    if (response.status === 200) {
      // Update local DB
      await Campaign.findOneAndUpdate(
        { gophishId: id },
        { 
          status: 'COMPLETED',
          completed_date: new Date()
        }
      );
      
      res.json({
        status: 'success',
        message: 'Campaign completed successfully',
        data: response.data
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to complete campaign with ID ${id}`,
        error: response.data
      });
    }
  } catch (error) {
    console.error(`Error completing campaign ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to complete campaign with ID ${req.params.id}`,
      error: error.message
    });
  }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gophishClient = createGophishClient();
    const response = await gophishClient.delete(`/campaigns/${id}`);
    
    if (response.status === 200) {
      // Remove from local DB as well
      await Campaign.findOneAndDelete({ gophishId: id });
      
      res.json({
        status: 'success',
        message: 'Campaign deleted successfully'
      });
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Failed to delete campaign with ID ${id}`,
        error: response.data
      });
    }
  } catch (error) {
    console.error(`Error deleting campaign ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to delete campaign with ID ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router; 