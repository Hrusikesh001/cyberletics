import { Router } from 'express';
import CampaignEvent from '../models/CampaignEvent';
import Tenant from '../models/Tenant';

const router = Router();

// Webhook endpoint for handling campaign events
router.post('/', async (req, res) => {
  try {
    const event = req.body;
    
    // Validate webhook payload
    if (!event || !event.campaign_id || !event.email || !event.message) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }
    
    // Extract tenant ID from the request
    // In a real scenario, this might be a specific subdomain or API key
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      console.warn('Webhook received without tenant ID, using default');
      // For demonstration, we'll use the first active tenant if no tenant ID provided
      const firstTenant = await Tenant.findOne({ status: 'active' });
      if (!firstTenant) {
        return res.status(400).json({ message: 'No active tenant found' });
      }
    }
    
    // Convert Gophish webhook format to our event format
    const eventData = {
      tenantId: tenantId || 'default',
      campaignId: event.campaign_id,
      email: event.email,
      eventType: event.message.toLowerCase().includes('clicked') ? 'clicked' : 
                event.message.toLowerCase().includes('submitted') ? 'submitted_data' : 
                event.message.toLowerCase().includes('opened') ? 'email_opened' : 'email_sent',
      ipAddress: event.details?.ip,
      userAgent: event.details?.user_agent,
      payload: event,
      timestamp: new Date()
    };
    
    // Track the event
    await CampaignEvent.create(eventData);
    
    // Return success response
    res.status(200).json({ message: 'Event received and processed' });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    // Always return 200 to prevent retries
    res.status(200).json({ message: 'Event received but processing failed' });
  }
});

// Get registered webhooks (placeholder)
router.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    
    // In a real implementation, you would fetch registered webhooks from the database
    // For now, just return a message
    return res.json({
      message: 'Webhook listing not implemented in this version',
      info: {
        tenantId
      }
    });
  } catch (error: any) {
    console.error('Error fetching webhooks:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register a new webhook (placeholder)
router.post('/register', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { url, secret, events } = req.body;
    
    // Validate input
    if (!url) {
      return res.status(400).json({ message: 'Webhook URL is required' });
    }
    
    // In a real implementation, you would register a webhook
    // For now, just return a message
    return res.json({
      message: 'Webhook registration not implemented in this version',
      info: {
        tenantId,
        url,
        secret: secret ? '******' : undefined,
        events: events || ['all']
      }
    });
  } catch (error: any) {
    console.error('Error registering webhook:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Simulate campaign event (for testing)
router.post('/simulate', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaignId, email, eventType } = req.body;
    
    // Validate input
    if (!campaignId || !email || !eventType) {
      return res.status(400).json({ message: 'Campaign ID, email, and event type are required' });
    }
    
    // Validate event type
    const validEventTypes = ['clicked', 'email_opened', 'submitted_data', 'email_sent'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({ message: 'Invalid event type' });
    }
    
    // Create simulated event
    const eventData = {
      tenantId,
      campaignId,
      email,
      eventType,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      payload: {
        simulator: true,
        campaign_id: campaignId,
        email,
        message: `Email ${eventType}`,
        time: new Date().toISOString()
      },
      timestamp: new Date()
    };
    
    // Track the event
    await CampaignEvent.create(eventData);
    
    // Return success response
    res.status(200).json({ 
      message: 'Simulated event processed',
      event: eventData
    });
  } catch (error: any) {
    console.error('Error simulating event:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 