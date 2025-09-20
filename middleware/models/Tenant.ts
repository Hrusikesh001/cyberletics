import mongoose, { Document, Schema, Model } from 'mongoose';

// Tenant interface
export interface ITenant extends Document {
  name: string;
  displayName: string;
  domain?: string;
  logoUrl?: string;
  settings: {
    gophishApiKey: string;
    gophishApiUrl: string;
    emailFrom: string;
    primaryColor?: string;
    secondaryColor?: string;
    allowUserRegistration: boolean;
    maxUsers: number;
    maxCampaigns: number;
    allowedTemplates: string[];
  };
  status: 'active' | 'suspended' | 'pending';
  plan: 'free' | 'pro' | 'enterprise';
  billingInfo?: {
    contactName: string;
    contactEmail: string;
    company: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    vatNumber?: string;
  };
  subscription?: {
    id: string;
    startDate: Date;
    endDate: Date;
    renewalDate: Date;
    status: 'active' | 'canceled' | 'past_due';
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planLimits: {
    maxCampaigns: number;
    maxUsers: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define Tenant schema
const TenantSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Tenant name can only contain lowercase letters, numbers, and hyphens']
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true
    },
    logoUrl: {
      type: String
    },
    settings: {
      gophishApiKey: {
        type: String,
        required: true
      },
      gophishApiUrl: {
        type: String,
        required: true,
        default: 'https://localhost:3333/api'
      },
      emailFrom: {
        type: String,
        required: true
      },
      primaryColor: {
        type: String,
        default: '#1E40AF' // Default blue color
      },
      secondaryColor: {
        type: String,
        default: '#3B82F6'
      },
      allowUserRegistration: {
        type: Boolean,
        default: false
      },
      maxUsers: {
        type: Number,
        default: 5
      },
      maxCampaigns: {
        type: Number,
        default: 10
      },
      allowedTemplates: {
        type: [String],
        default: []
      }
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'pending'
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    planLimits: {
      maxCampaigns: { type: Number, default: 10 },
      maxUsers: { type: Number, default: 5 }
    },
    billingInfo: {
      contactName: String,
      contactEmail: String,
      company: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      vatNumber: String
    },
    subscription: {
      id: String,
      startDate: Date,
      endDate: Date,
      renewalDate: Date,
      status: {
        type: String,
        enum: ['active', 'canceled', 'past_due'],
        default: 'active'
      }
    },
    stripeCustomerId: {
      type: String
    },
    stripeSubscriptionId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Add indexing for better query performance
TenantSchema.index({ name: 1 });
TenantSchema.index({ status: 1 });
TenantSchema.index({ plan: 1 });
TenantSchema.index({ 'subscription.status': 1 });

// Statics for tenant operations
TenantSchema.statics = {
  /**
   * Get active tenants
   * @returns {Promise<ITenant[]>}
   */
  async getActiveTenants(): Promise<ITenant[]> {
    return this.find({ status: 'active' }).exec();
  },

  /**
   * Get tenant by name
   * @param {String} name
   * @returns {Promise<ITenant>}
   */
  async getByName(name: string): Promise<ITenant | null> {
    return this.findOne({ name }).exec();
  },

  /**
   * Check if tenant has reached user limit
   * @param {String} tenantId
   * @param {Number} currentUserCount
   * @returns {Promise<boolean>}
   */
  async hasReachedUserLimit(tenantId: string, currentUserCount: number): Promise<boolean> {
    const tenant = await this.findById(tenantId).exec();
    if (!tenant) return true; // If tenant not found, consider limit reached
    return currentUserCount >= tenant.settings.maxUsers;
  },

  /**
   * Check if tenant has reached campaign limit
   * @param {String} tenantId
   * @param {Number} currentCampaignCount
   * @returns {Promise<boolean>}
   */
  async hasReachedCampaignLimit(tenantId: string, currentCampaignCount: number): Promise<boolean> {
    const tenant = await this.findById(tenantId).exec();
    if (!tenant) return true; // If tenant not found, consider limit reached
    return currentCampaignCount >= tenant.settings.maxCampaigns;
  }
};

// Create and export Tenant model
const Tenant: Model<ITenant> = mongoose.model<ITenant>('Tenant', TenantSchema);
export default Tenant; 