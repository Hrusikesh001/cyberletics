import axios, { AxiosInstance } from 'axios';
import { useAuth } from '@/context/AuthContext';

// GoPhish API Client
class GoPhishClient {
  private client: AxiosInstance;
  private tenantId: string | null = null;

  constructor() {
    // Get the base URL from environment variables
    const baseURL = import.meta.env.VITE_GOPHISH_API_URL || 'http://localhost:5000/api';
    
    // Create Axios instance
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include auth token and tenant ID
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Include tenant ID in headers if available
        if (this.tenantId) {
          config.headers['X-Tenant-ID'] = this.tenantId;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Set the tenant ID for subsequent requests
  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  // Campaign operations
  async getCampaigns() {
    const response = await this.client.get('/campaigns');
    return response.data;
  }

  async getCampaign(id: string) {
    const response = await this.client.get(`/campaigns/${id}`);
    return response.data;
  }

  async createCampaign(data: any) {
    const response = await this.client.post('/campaigns', data);
    return response.data;
  }

  async updateCampaign(id: string, data: any) {
    const response = await this.client.put(`/campaigns/${id}`, data);
    return response.data;
  }

  async deleteCampaign(id: string) {
    const response = await this.client.delete(`/campaigns/${id}`);
    return response.data;
  }

  // Template operations
  async getTemplates() {
    const response = await this.client.get('/templates');
    return response.data;
  }

  async getTemplate(id: string) {
    const response = await this.client.get(`/templates/${id}`);
    return response.data;
  }

  async uploadTemplate(templateData: any) {
    const response = await this.client.post('/templates', templateData);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await this.client.delete(`/templates/${id}`);
    return response.data;
  }

  // Landing page operations
  async getLandingPages() {
    const response = await this.client.get('/landing-pages');
    return response.data;
  }

  async getLandingPage(id: string) {
    const response = await this.client.get(`/landing-pages/${id}`);
    return response.data;
  }

  async createLandingPage(data: any) {
    const response = await this.client.post('/landing-pages', data);
    return response.data;
  }

  async updateLandingPage(id: string, data: any) {
    const response = await this.client.put(`/landing-pages/${id}`, data);
    return response.data;
  }

  async deleteLandingPage(id: string) {
    const response = await this.client.delete(`/landing-pages/${id}`);
    return response.data;
  }

  // Reporting operations
  async fetchReports(filters: any = {}) {
    const response = await this.client.get('/reports', { params: filters });
    return response.data;
  }

  async fetchCampaignResults(campaignId: string) {
    const response = await this.client.get(`/campaigns/${campaignId}/results`);
    return response.data;
  }

  async generatePDFReport(campaignId: string) {
    const response = await this.client.get(`/reports/${campaignId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async fetchEventTimeline(campaignId: string) {
    const response = await this.client.get(`/reports/${campaignId}/timeline`);
    return response.data;
  }
}

// Create singleton instance
const goPhishClient = new GoPhishClient();

// Hook to use the GoPhish client with the current tenant
export const useGoPhishClient = () => {
  const { currentTenant } = useAuth();
  
  // Set the tenant ID whenever it changes
  if (currentTenant) {
    goPhishClient.setTenantId(currentTenant.id);
  }
  
  return goPhishClient;
};

export default goPhishClient; 