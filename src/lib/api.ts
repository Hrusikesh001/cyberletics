import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant context header
    const tenantId = localStorage.getItem('current_tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with non-2xx status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden
        toast.error('You do not have permission to perform this action');
      } else if (status === 429) {
        // Rate limited
        toast.error('Too many requests. Please try again later.');
      } else {
        // Other errors
        const errorMessage = data?.message || 'An error occurred';
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API service functions
const apiService = {
  // Tenant Management
  getTenants: () => Promise.resolve(api.get('/tenants')),
  getTenant: (id: string) => Promise.resolve(api.get(`/tenants/${id}`)),
  createTenant: (data: any) => Promise.resolve(api.post('/tenants', data)),
  updateTenant: (id: string, data: any) => Promise.resolve(api.put(`/tenants/${id}`, data)),
  updateTenantStatus: (id: string, status: 'active' | 'suspended' | 'pending') => 
    Promise.resolve(api.patch(`/tenants/${id}/status`, { status })),
  getTenantUsers: (id: string) => Promise.resolve(api.get(`/tenants/${id}/users`)),
  addUserToTenant: (id: string, data: { email: string, role: 'admin' | 'user' }) => 
    Promise.resolve(api.post(`/tenants/${id}/users`, data)),
  removeUserFromTenant: (tenantId: string, userId: string) => 
    Promise.resolve(api.delete(`/tenants/${tenantId}/users/${userId}`)),
  updateUserTenantRole: (tenantId: string, userId: string, role: 'admin' | 'user') => 
    Promise.resolve(api.put(`/tenants/${tenantId}/users/${userId}/role`, { role })),
  deleteTenant: (id: string) => Promise.resolve(api.delete(`/tenants/${id}`)),
  getTenantStats: (id: string) => Promise.resolve(api.get(`/tenants/${id}/stats`)),

  // User Management
  getUsers: (params = {}) => Promise.resolve(api.get('/users', { params })),
  getUser: (id: string) => Promise.resolve(api.get(`/users/${id}`)),
  createUser: (data: any) => Promise.resolve(api.post('/users', data)),
  updateUser: (id: string, data: any) => Promise.resolve(api.put(`/users/${id}`, data)),
  deleteUser: (id: string) => Promise.resolve(api.delete(`/users/${id}`)),
  activateUser: (id: string) => Promise.resolve(api.patch(`/users/${id}/activate`)),
  deactivateUser: (id: string) => Promise.resolve(api.patch(`/users/${id}/deactivate`)),
  getUserStats: () => Promise.resolve(api.get('/users/stats')),
  importUsers: (formData: FormData) => Promise.resolve(api.post('/users/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })),
  changePassword: (data: { currentPassword: string, newPassword: string }) => 
    Promise.resolve(api.post('/users/change-password', data)),
  requestPasswordReset: (email: string) => 
    Promise.resolve(api.post('/users/password-reset', { email })),
  resetPassword: (data: { token: string, newPassword: string }) => 
    Promise.resolve(api.post('/users/reset-password', data)),
  getUserProfile: () => Promise.resolve(api.get('/users/profile')),
  updateUserProfile: (data: any) => Promise.resolve(api.put('/users/profile', data)),

  // Training Modules
  getTrainingModules: (params = {}) => Promise.resolve(api.get('/training/modules', { params })),
  getTrainingModule: (id: string) => Promise.resolve(api.get(`/training/modules/${id}`)),
  createTrainingModule: (data: any) => Promise.resolve(api.post('/training/modules', data)),
  updateTrainingModule: (id: string, data: any) => Promise.resolve(api.put(`/training/modules/${id}`, data)),
  deleteTrainingModule: (id: string) => Promise.resolve(api.delete(`/training/modules/${id}`)),
  getTrainingProgress: () => Promise.resolve(api.get('/training/progress')),
  updateTrainingProgress: (data: any) => Promise.resolve(api.post('/training/progress', data)),
  getTrainingStats: () => Promise.resolve(api.get('/training/stats')),
  getUserTrainingProgress: (userId: string) => Promise.resolve(api.get(`/training/progress/${userId}`)),
  
  // Gophish Settings
  getGophishSettings: () => Promise.resolve(api.get('/settings/gophish')),
  testGophishConnection: () => Promise.resolve(api.post('/settings/gophish/test')),
  updateGophishSettings: (settings: any) => Promise.resolve(api.put('/settings/gophish', settings)),
  
  // SMTP Profiles
  getSmtpProfiles: () => Promise.resolve(api.get('/smtp')),
  getSmtpProfile: (id: string) => Promise.resolve(api.get(`/smtp/${id}`)),
  createSmtpProfile: (data: any) => Promise.resolve(api.post('/smtp', data)),
  updateSmtpProfile: (id: string, data: any) => Promise.resolve(api.put(`/smtp/${id}`, data)),
  deleteSmtpProfile: (id: string) => Promise.resolve(api.delete(`/smtp/${id}`)),
  testSmtpConnection: (data: any) => Promise.resolve(api.post('/smtp/test', data)),
  
  // Email Templates
  getTemplates: () => Promise.resolve(api.get('/templates')),
  getTemplate: (id: string) => Promise.resolve(api.get(`/templates/${id}`)),
  createTemplate: (data: any) => Promise.resolve(api.post('/templates', data)),
  updateTemplate: (id: string, data: any) => Promise.resolve(api.put(`/templates/${id}`, data)),
  deleteTemplate: (id: string) => Promise.resolve(api.delete(`/templates/${id}`)),
  importTemplate: (formData: FormData) => Promise.resolve(api.post('/templates/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })),
  
  // Landing Pages
  getLandingPages: () => Promise.resolve(api.get('/landing-pages')),
  getLandingPage: (id: string) => Promise.resolve(api.get(`/landing-pages/${id}`)),
  createLandingPage: (data: any) => Promise.resolve(api.post('/landing-pages', data)),
  updateLandingPage: (id: string, data: any) => Promise.resolve(api.put(`/landing-pages/${id}`, data)),
  deleteLandingPage: (id: string) => Promise.resolve(api.delete(`/landing-pages/${id}`)),
  importLandingPage: (formData: FormData) => Promise.resolve(api.post('/landing-pages/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })),
  
  // Groups & Users
  getGroups: () => Promise.resolve(api.get('/groups')),
  getGroup: (id: string) => Promise.resolve(api.get(`/groups/${id}`)),
  createGroup: (data: any) => Promise.resolve(api.post('/groups', data)),
  updateGroup: (id: string, data: any) => Promise.resolve(api.put(`/groups/${id}`, data)),
  deleteGroup: (id: string) => Promise.resolve(api.delete(`/groups/${id}`)),
  importGroupFromCsv: (formData: FormData) => Promise.resolve(api.post('/groups/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })),
  
  // Campaigns
  getCampaigns: () => Promise.resolve(api.get('/campaigns')),
  getCampaign: (id: string) => Promise.resolve(api.get(`/campaigns/${id}`)),
  getCampaignSummary: (id: string) => Promise.resolve(api.get(`/campaigns/${id}/summary`)),
  getCampaignResults: (id: string) => Promise.resolve(api.get(`/campaigns/${id}/results`)),
  createCampaign: (data: any) => Promise.resolve(api.post('/campaigns', data)),
  completeCampaign: (id: string) => Promise.resolve(api.get(`/campaigns/${id}/complete`)),
  deleteCampaign: (id: string) => Promise.resolve(api.delete(`/campaigns/${id}`)),
  
  // Webhook Events
  getWebhookEvents: (params: { limit?: number, offset?: number, campaignId?: string, event?: string } = {}) => 
    Promise.resolve(api.get('/webhooks', { params })),
  getCampaignWebhookEvents: (campaignId: string, params: { limit?: number, offset?: number, event?: string } = {}) => 
    Promise.resolve(api.get(`/webhooks/campaign/${campaignId}`, { params })),
  clearAllWebhookEvents: () => Promise.resolve(api.delete('/webhooks')),
  clearCampaignWebhookEvents: (campaignId: string) => Promise.resolve(api.delete(`/webhooks/campaign/${campaignId}`)),
};

export default apiService; 