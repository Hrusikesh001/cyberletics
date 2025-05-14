import mongoose, { Document, Schema, Model } from 'mongoose';

// Define possible event types
type EventType = 
  | 'login' 
  | 'logout' 
  | 'failed_login' 
  | 'password_change' 
  | 'user_created' 
  | 'user_updated' 
  | 'user_deleted' 
  | 'tenant_created' 
  | 'tenant_updated' 
  | 'tenant_deleted' 
  | 'campaign_created' 
  | 'campaign_launched' 
  | 'campaign_completed' 
  | 'template_created' 
  | 'template_updated' 
  | 'template_deleted' 
  | 'settings_changed'
  | 'role_changed'
  | 'permissions_changed'
  | 'api_key_generated'
  | 'api_key_revoked'
  | 'data_export'
  | 'report_generated';

// AuditLog interface
export interface IAuditLog extends Document {
  tenantId: string;
  userId: string;
  eventType: EventType;
  resourceType: string;
  resourceId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Define AuditLog schema
const AuditLogSchema: Schema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    resourceType: {
      type: String,
      required: true,
      index: true
    },
    resourceId: {
      type: String,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false // We'll use the timestamp field instead
  }
);

// Create compound indexes for efficient querying
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, eventType: 1, timestamp: -1 });

// Static methods
AuditLogSchema.statics = {
  /**
   * Create a new audit log entry
   * @param {Object} logData - The log data to create
   * @returns {Promise<IAuditLog>}
   */
  async createLog(logData: Partial<IAuditLog>): Promise<IAuditLog> {
    return this.create({
      ...logData,
      timestamp: new Date()
    });
  },

  /**
   * Get recent audit logs for a tenant
   * @param {String} tenantId - The tenant ID
   * @param {Number} limit - Number of logs to return
   * @returns {Promise<IAuditLog[]>}
   */
  async getRecentLogs(tenantId: string, limit = 100): Promise<IAuditLog[]> {
    return this.find({ tenantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .exec();
  },

  /**
   * Get logs for a specific user
   * @param {String} tenantId - The tenant ID
   * @param {String} userId - The user ID
   * @param {Number} limit - Number of logs to return
   * @returns {Promise<IAuditLog[]>}
   */
  async getUserLogs(tenantId: string, userId: string, limit = 50): Promise<IAuditLog[]> {
    return this.find({ tenantId, userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  },

  /**
   * Get logs for a specific event type
   * @param {String} tenantId - The tenant ID
   * @param {String} eventType - The event type
   * @param {Number} limit - Number of logs to return
   * @returns {Promise<IAuditLog[]>}
   */
  async getEventLogs(tenantId: string, eventType: EventType, limit = 50): Promise<IAuditLog[]> {
    return this.find({ tenantId, eventType })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .exec();
  },

  /**
   * Search logs by date range
   * @param {String} tenantId - The tenant ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Number} limit - Number of logs to return
   * @returns {Promise<IAuditLog[]>}
   */
  async searchByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit = 100
  ): Promise<IAuditLog[]> {
    return this.find({
      tenantId,
      timestamp: { $gte: startDate, $lte: endDate }
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .exec();
  }
};

// Create and export AuditLog model
const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog; 