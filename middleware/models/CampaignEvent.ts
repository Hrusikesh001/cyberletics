import mongoose, { Document, Schema } from 'mongoose';

// Campaign event interface
export interface ICampaignEvent extends Document {
  tenantId: string;
  campaignId: string;
  userId?: string;
  email: string;
  eventType: 'email_sent' | 'email_opened' | 'clicked' | 'submitted_data' | 'reported';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  payload?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign event schema
const CampaignEventSchema: Schema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    campaignId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      index: true
    },
    email: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ['email_sent', 'email_opened', 'clicked', 'submitted_data', 'reported'],
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    browser: {
      type: String
    },
    operatingSystem: {
      type: String
    },
    deviceType: {
      type: String
    },
    location: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number
    },
    payload: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Compound indices for common queries
CampaignEventSchema.index({ tenantId: 1, campaignId: 1, timestamp: -1 });
CampaignEventSchema.index({ tenantId: 1, eventType: 1, timestamp: -1 });
CampaignEventSchema.index({ email: 1, campaignId: 1, eventType: 1 });

// Statics
CampaignEventSchema.statics = {
  /**
   * Track a new campaign event
   * @param {Object} eventData
   * @returns {Promise<ICampaignEvent>}
   */
  async trackEvent(eventData: Partial<ICampaignEvent>): Promise<ICampaignEvent> {
    return this.create({
      ...eventData,
      timestamp: eventData.timestamp || new Date()
    });
  },

  /**
   * Get events for a specific campaign
   * @param {String} tenantId
   * @param {String} campaignId
   * @param {Object} options
   * @returns {Promise<ICampaignEvent[]>}
   */
  async getCampaignEvents(
    tenantId: string,
    campaignId: string,
    options: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ICampaignEvent[]> {
    const { eventType, startDate, endDate, limit = 50, offset = 0 } = options;
    
    const query: any = { tenantId, campaignId };
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    return this.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  },

  /**
   * Get event timeline data for a campaign
   * @param {String} tenantId
   * @param {String} campaignId
   * @returns {Promise<Object>}
   */
  async getEventTimeline(
    tenantId: string,
    campaignId: string
  ): Promise<{
    timeline: Array<{
      date: string;
      sent: number;
      opened: number;
      clicked: number;
      submitted: number;
    }>;
    totals: {
      sent: number;
      opened: number;
      clicked: number;
      submitted: number;
    };
  }> {
    // Get events grouped by date and type
    const timelineData = await this.aggregate([
      { $match: { tenantId, campaignId } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Process the aggregation results
    const dateMap = new Map<string, { 
      sent: number; 
      opened: number; 
      clicked: number; 
      submitted: number;
    }>();
    
    const totals = {
      sent: 0,
      opened: 0,
      clicked: 0,
      submitted: 0
    };
    
    timelineData.forEach(item => {
      const date = item._id.date;
      const eventType = item._id.eventType;
      const count = item.count;
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { sent: 0, opened: 0, clicked: 0, submitted: 0 });
      }
      
      const dateEntry = dateMap.get(date)!;
      
      switch (eventType) {
        case 'email_sent':
          dateEntry.sent += count;
          totals.sent += count;
          break;
        case 'email_opened':
          dateEntry.opened += count;
          totals.opened += count;
          break;
        case 'clicked':
          dateEntry.clicked += count;
          totals.clicked += count;
          break;
        case 'submitted_data':
          dateEntry.submitted += count;
          totals.submitted += count;
          break;
      }
    });
    
    // Convert map to array for response
    const timeline = Array.from(dateMap.entries()).map(([date, counts]) => ({
      date,
      ...counts
    }));
    
    return { timeline, totals };
  },

  /**
   * Get event statistics by hour of day and day of week
   * @param {String} tenantId
   * @param {String} campaignId
   * @param {String} eventType
   * @returns {Promise<Object>}
   */
  async getEventHeatmap(
    tenantId: string,
    campaignId?: string,
    eventType: string = 'clicked'
  ): Promise<Array<{
    hour: number;
    weekday: number;
    count: number;
  }>> {
    const match: any = { 
      tenantId, 
      eventType 
    };
    
    if (campaignId) {
      match.campaignId = campaignId;
    }
    
    const heatmapData = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            weekday: { $dayOfWeek: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to zero-indexed weekday (0=Sunday, 6=Saturday)
    // MongoDB's $dayOfWeek returns 1=Sunday, 7=Saturday
    return heatmapData.map(item => ({
      hour: item._id.hour,
      weekday: item._id.weekday - 1,
      count: item.count
    }));
  }
};

// Create and export the model
const CampaignEvent = mongoose.model<ICampaignEvent>('CampaignEvent', CampaignEventSchema);
export default CampaignEvent; 