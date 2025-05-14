const express = require('express');
const router = express.Router();
const WebhookEvent = require('../models/WebhookEvent');
const Campaign = require('../models/Campaign');

// Middleware to validate webhook events
const validateWebhook = (req, res, next) => {
  const event = req.body;
  
  if (!event || !event.email || !event.campaign_id) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid webhook data. Missing required fields.'
    });
  }
  
  next();
};

// Get all webhook events
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, campaignId, event: eventType } = req.query;
    
    // Build query
    const query = {};
    if (campaignId) query.campaignId = campaignId;
    if (eventType) query.event = eventType;
    
    // Execute query with pagination
    const events = await WebhookEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await WebhookEvent.countDocuments(query);
    
    res.json({
      status: 'success',
      data: {
        events,
        pagination: {
          total,
          offset: parseInt(offset),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch webhook events',
      error: error.message
    });
  }
});

// Get events for a specific campaign
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 100, offset = 0, event: eventType } = req.query;
    
    // Build query
    const query = { campaignId };
    if (eventType) query.event = eventType;
    
    // Execute query with pagination
    const events = await WebhookEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await WebhookEvent.countDocuments(query);
    
    res.json({
      status: 'success',
      data: {
        events,
        pagination: {
          total,
          offset: parseInt(offset),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error(`Error fetching webhook events for campaign ${req.params.campaignId}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch webhook events for campaign ${req.params.campaignId}`,
      error: error.message
    });
  }
});

// Process webhook event (called from webhook endpoint)
router.post('/', validateWebhook, async (req, res) => {
  try {
    const eventData = req.body;
    
    // Map Gophish webhook data to our schema
    const webhookEvent = new WebhookEvent({
      event: eventData.message.includes('opened') ? 'email_opened' :
             eventData.message.includes('clicked') ? 'link_clicked' :
             eventData.message.includes('submitted') ? 'form_submitted' :
             eventData.message.includes('reported') ? 'email_reported' : 'unknown',
      email: eventData.email,
      campaignId: eventData.campaign_id.toString(),
      campaignName: eventData.campaign_name,
      userId: eventData.user_id ? eventData.user_id.toString() : undefined,
      details: {
        message: eventData.message,
        payload: eventData.payload
      },
      ip: eventData.payload?.ip,
      userAgent: eventData.payload?.browser?.user_agent,
      timestamp: new Date()
    });
    
    // Save to MongoDB
    await webhookEvent.save();
    
    // Update campaign stats in local DB
    const campaign = await Campaign.findOne({ gophishId: eventData.campaign_id.toString() });
    if (campaign) {
      // Find the specific user result
      const userResult = campaign.results.find(r => r.email === eventData.email);
      
      if (userResult) {
        // Update status and dates based on event type
        if (eventData.message.includes('opened')) {
          userResult.status = 'OPENED';
          userResult.openDate = new Date();
          campaign.stats.opened = (campaign.stats.opened || 0) + 1;
        } else if (eventData.message.includes('clicked')) {
          userResult.status = 'CLICKED';
          userResult.clickDate = new Date();
          campaign.stats.clicked = (campaign.stats.clicked || 0) + 1;
        } else if (eventData.message.includes('submitted')) {
          userResult.status = 'SUBMITTED';
          userResult.submitDate = new Date();
          campaign.stats.submitted = (campaign.stats.submitted || 0) + 1;
        } else if (eventData.message.includes('reported')) {
          userResult.status = 'REPORTED';
          userResult.reportDate = new Date();
          campaign.stats.reported = (campaign.stats.reported || 0) + 1;
        }
        
        // Save IP if available
        if (eventData.payload?.ip) {
          userResult.ip = eventData.payload.ip;
        }
        
        // Save location if available
        if (eventData.payload?.latitude && eventData.payload?.longitude) {
          userResult.latitude = eventData.payload.latitude;
          userResult.longitude = eventData.payload.longitude;
        }
        
        await campaign.save();
      }
    }
    
    // Send real-time update through Socket.io
    // This is handled in server.js with io.emit('webhook-event', eventData)
    
    res.status(201).json({
      status: 'success',
      message: 'Webhook event processed and saved',
      data: webhookEvent
    });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process webhook event',
      error: error.message
    });
  }
});

// Clear all webhook events
router.delete('/', async (req, res) => {
  try {
    await WebhookEvent.deleteMany({});
    
    res.json({
      status: 'success',
      message: 'All webhook events cleared'
    });
  } catch (error) {
    console.error('Error clearing webhook events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear webhook events',
      error: error.message
    });
  }
});

// Clear webhook events for a specific campaign
router.delete('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    await WebhookEvent.deleteMany({ campaignId });
    
    res.json({
      status: 'success',
      message: `Webhook events for campaign ${campaignId} cleared`
    });
  } catch (error) {
    console.error(`Error clearing webhook events for campaign ${req.params.campaignId}:`, error);
    res.status(500).json({
      status: 'error',
      message: `Failed to clear webhook events for campaign ${req.params.campaignId}`,
      error: error.message
    });
  }
});

module.exports = router; 