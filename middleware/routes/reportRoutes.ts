import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import axios from 'axios';
import CampaignEvent from '../models/CampaignEvent';

const router = Router();

// All report routes require authentication
router.use(verifyToken);

// Get campaign reports
router.get('/campaigns', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { startDate, endDate } = req.query;

    // Create date filter if provided
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate as string) };
    }
    if (endDate) {
      if (!dateFilter.createdAt) dateFilter.createdAt = {};
      dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    // Get campaign data from GoPhish API
    const GOPHISH_API_KEY = process.env.GOPHISH_API_KEY || '';
    const GOPHISH_BASE_URL = process.env.GOPHISH_BASE_URL || 'https://localhost:3333/api';
    
    const goPhishClient = axios.create({
      baseURL: GOPHISH_BASE_URL,
      headers: {
        'Authorization': `Bearer ${GOPHISH_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId
      },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // For development only
    });

    const campaignsResponse = await goPhishClient.get('/campaigns');
    const campaigns = campaignsResponse.data;
    
    // Process and transform data
    const reports = await Promise.all(campaigns.map(async (campaign: any) => {
      // Get additional event data from our database
      const events = await CampaignEvent.find({
        tenantId,
        campaignId: campaign.id.toString(),
        ...dateFilter
      });
      
      // Calculate additional metrics
      const clickRate = campaign.stats.sent > 0 
        ? (campaign.stats.clicked / campaign.stats.sent) * 100 
        : 0;
        
      const submissionRate = campaign.stats.sent > 0 
        ? (campaign.stats.submitted_data / campaign.stats.sent) * 100 
        : 0;
      
      return {
        id: campaign.id,
        name: campaign.name,
        created_date: campaign.created_date,
        launch_date: campaign.launch_date,
        completed_date: campaign.completed_date,
        status: campaign.status,
        stats: {
          total: campaign.results.length,
          sent: campaign.stats.sent,
          opened: campaign.stats.opened,
          clicked: campaign.stats.clicked,
          submitted_data: campaign.stats.submitted_data,
          click_rate: clickRate.toFixed(2),
          submission_rate: submissionRate.toFixed(2)
        },
        timeline: events.map(e => ({
          timestamp: e.timestamp,
          email: e.email,
          eventType: e.eventType,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent
        }))
      };
    }));
    
    return res.json(reports);
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaignId, eventType = 'clicked' } = req.query;
    
    // Validate event type
    const validEventTypes = ['clicked', 'email_opened', 'submitted_data', 'email_sent'];
    if (!validEventTypes.includes(eventType as string)) {
      return res.status(400).json({ message: 'Invalid event type' });
    }
    
    // Build query
    const query: any = { tenantId, eventType };
    if (campaignId) {
      query.campaignId = campaignId as string;
    }
    
    // Get heatmap data by hour of day and day of week
    const heatmapData = await CampaignEvent.aggregate([
      { $match: query },
      {
        $project: {
          hour: { $hour: '$timestamp' },
          dayOfWeek: { $dayOfWeek: '$timestamp' } // 1 for Sunday, 7 for Saturday
        }
      },
      {
        $group: {
          _id: { hour: '$hour', dayOfWeek: '$dayOfWeek' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id.hour',
          dayOfWeek: '$_id.dayOfWeek',
          count: 1
        }
      },
      { $sort: { dayOfWeek: 1, hour: 1 } }
    ]);
    
    // Format data as a 7x24 matrix (7 days, 24 hours)
    const formattedData = Array(7).fill(0).map(() => Array(24).fill(0));
    
    heatmapData.forEach((item: any) => {
      // Adjust to 0-indexed
      const dayIndex = item.dayOfWeek - 1; // Convert to 0-based index
      const hourIndex = item.hour;
      
      formattedData[dayIndex][hourIndex] = item.count;
    });
    
    return res.json({
      eventType,
      data: formattedData,
      rawData: heatmapData
    });
  } catch (error: any) {
    console.error('Error generating heatmap:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event timeline for a campaign
router.get('/timeline/:campaignId', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaignId } = req.params;
    
    // Get events for campaign
    const events = await CampaignEvent.find({ tenantId, campaignId })
      .sort({ timestamp: 1 });
    
    // Group events by type
    const eventsByType = events.reduce((acc: any, event) => {
      if (!acc[event.eventType]) {
        acc[event.eventType] = [];
      }
      
      acc[event.eventType].push({
        email: event.email,
        timestamp: event.timestamp,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      });
      
      return acc;
    }, {});
    
    // Calculate timeline metrics
    const firstEvent = events.length > 0 ? events[0].timestamp : null;
    const lastEvent = events.length > 0 ? events[events.length - 1].timestamp : null;
    
    // Time to first click
    const firstClick = events.find(e => e.eventType === 'clicked')?.timestamp;
    const timeToFirstClick = firstClick && firstEvent 
      ? Math.round((firstClick.getTime() - firstEvent.getTime()) / 1000) 
      : null;
    
    return res.json({
      campaignId,
      events: eventsByType,
      summary: {
        totalEvents: events.length,
        firstEvent,
        lastEvent,
        duration: firstEvent && lastEvent 
          ? Math.round((lastEvent.getTime() - firstEvent.getTime()) / 1000) 
          : null,
        timeToFirstClick
      }
    });
  } catch (error: any) {
    console.error('Error generating timeline:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comparative report across campaigns
router.get('/comparative', requireRole('admin'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaigns } = req.query;
    
    // If campaigns IDs provided as comma separated list
    const campaignIds = campaigns 
      ? (campaigns as string).split(',') 
      : [];
    
    // Get campaign data from GoPhish API
    const GOPHISH_API_KEY = process.env.GOPHISH_API_KEY || '';
    const GOPHISH_BASE_URL = process.env.GOPHISH_BASE_URL || 'https://localhost:3333/api';
    
    const goPhishClient = axios.create({
      baseURL: GOPHISH_BASE_URL,
      headers: {
        'Authorization': `Bearer ${GOPHISH_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId
      },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // For development only
    });
    
    const campaignsResponse = await goPhishClient.get('/campaigns');
    let campaigns = campaignsResponse.data;
    
    // Filter campaigns if IDs were provided
    if (campaignIds.length > 0) {
      campaigns = campaigns.filter((c: any) => 
        campaignIds.includes(c.id.toString())
      );
    }
    
    // Extract key metrics for comparison
    const comparativeData = campaigns.map((campaign: any) => {
      const clickRate = campaign.stats.sent > 0 
        ? (campaign.stats.clicked / campaign.stats.sent) * 100 
        : 0;
      
      const submissionRate = campaign.stats.sent > 0 
        ? (campaign.stats.submitted_data / campaign.stats.sent) * 100 
        : 0;
      
      const openRate = campaign.stats.sent > 0 
        ? (campaign.stats.opened / campaign.stats.sent) * 100 
        : 0;
      
      return {
        id: campaign.id,
        name: campaign.name,
        launchDate: campaign.launch_date,
        status: campaign.status,
        totalTargets: campaign.results.length,
        sent: campaign.stats.sent,
        opened: campaign.stats.opened,
        clicked: campaign.stats.clicked,
        submitted: campaign.stats.submitted_data,
        openRate: openRate.toFixed(2),
        clickRate: clickRate.toFixed(2),
        submissionRate: submissionRate.toFixed(2)
      };
    });
    
    return res.json(comparativeData);
  } catch (error: any) {
    console.error('Error generating comparative report:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate PDF report for a campaign (placeholder)
router.get('/export/:campaignId/pdf', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaignId } = req.params;
    
    // In a real implementation, you would generate a PDF
    // For now, just return a message
    return res.json({
      message: 'PDF generation not implemented in this version',
      info: {
        tenantId,
        campaignId,
        format: 'PDF' 
      }
    });
  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export campaign data to CSV (placeholder)
router.get('/export/:campaignId/csv', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId;
    const { campaignId } = req.params;
    
    // In a real implementation, you would generate a CSV file
    // For now, just return a message
    return res.json({
      message: 'CSV export not implemented in this version',
      info: {
        tenantId,
        campaignId,
        format: 'CSV'
      }
    });
  } catch (error: any) {
    console.error('Error exporting to CSV:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 