// Tenant types
export interface Tenant {
  id: string;
  name: string;
  displayName: string;
  domain?: string;
  logoUrl?: string;
  status: 'active' | 'suspended' | 'pending';
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  gophishApiKey: string;
  gophishApiUrl: string;
  emailFrom: string;
  primaryColor?: string;
  secondaryColor?: string;
  allowUserRegistration: boolean;
  maxUsers: number;
  maxCampaigns: number;
  allowedTemplates: string[];
}

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: string; // Global role (super-admin, admin, user)
  tenantRole: 'admin' | 'user'; // Role within the specific tenant
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantCreateInput {
  name: string;
  displayName: string;
  domain?: string;
  settings: {
    gophishApiKey: string;
    gophishApiUrl?: string;
    emailFrom: string;
    primaryColor?: string;
    secondaryColor?: string;
    allowUserRegistration?: boolean;
    maxUsers?: number;
    maxCampaigns?: number;
    allowedTemplates?: string[];
  };
}

export interface TenantUpdateInput {
  displayName?: string;
  domain?: string;
  logoUrl?: string;
  settings?: Partial<TenantSettings>;
  status?: 'active' | 'suspended' | 'pending';
  plan?: 'free' | 'basic' | 'professional' | 'enterprise';
}

export interface TenantAddUserInput {
  email: string;
  role?: 'admin' | 'user';
}

export interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  usagePercentage: {
    users: number;
    campaigns: number;
  };
} 