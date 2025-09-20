import axios, { AxiosInstance } from 'axios';
import { useAuth } from '@/context/AuthContext';

// Response type for consistent API responses
interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'partial_success' | 'connected';
  data?: T;
  message?: string;
  error?: any;
}

// GoPhish API Client
class GoPhishClient {
  private client: AxiosInstance;
  private tenantId: string | null = null;

  constructor() {
    // Get the base URL from environment variables
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
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

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Set the tenant ID for subsequent requests
  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  // Helper method to handle API responses
  private handleResponse<T>(response: any): ApiResponse<T> {
    return response.data;
  }

  // Gophish connection and settings
  async testGophishConnection(): Promise<ApiResponse> {
    const response = await this.client.get('/settings/gophish');
    return this.handleResponse(response);
  }

  async getGophishConfig(): Promise<ApiResponse> {
    const response = await this.client.get('/settings/gophish/config');
    return this.handleResponse(response);
  }

  async updateGophishSettings(settings: { apiKey?: string; baseUrl?: string }): Promise<ApiResponse> {
    const response = await this.client.put('/settings/gophish', settings);
    return this.handleResponse(response);
  }

  // Campaign operations
  async getCampaigns(): Promise<ApiResponse> {
    const response = await this.client.get('/campaigns');
    return this.handleResponse(response);
  }

  async getCampaign(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/campaigns/${id}`);
    return this.handleResponse(response);
  }

  async createCampaign(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/campaigns', data);
    return this.handleResponse(response);
  }

  async updateCampaign(id: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/campaigns/${id}`, data);
    return this.handleResponse(response);
  }

  async deleteCampaign(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/campaigns/${id}`);
    return this.handleResponse(response);
  }

  async completeCampaign(id: string): Promise<ApiResponse> {
    const response = await this.client.post(`/campaigns/${id}/complete`);
    return this.handleResponse(response);
  }

  async getCampaignResults(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/campaigns/${id}/results`);
    return this.handleResponse(response);
  }

  // Group operations
  async getGroups(): Promise<ApiResponse> {
    const response = await this.client.get('/groups');
    return this.handleResponse(response);
  }

  async getGroup(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/groups/${id}`);
    return this.handleResponse(response);
  }

  async createGroup(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/groups', data);
    return this.handleResponse(response);
  }

  async updateGroup(id: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/groups/${id}`, data);
    return this.handleResponse(response);
  }

  async deleteGroup(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/groups/${id}`);
    return this.handleResponse(response);
  }

  async importGroupFromCSV(csvFile: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    
    const response = await this.client.post('/groups/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return this.handleResponse(response);
  }

  // Template operations
  async getTemplates(): Promise<ApiResponse> {
    const response = await this.client.get('/templates');
    return this.handleResponse(response);
  }

  async getTemplate(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/templates/${id}`);
    return this.handleResponse(response);
  }

  async createTemplate(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/templates', data);
    return this.handleResponse(response);
  }

  async updateTemplate(id: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/templates/${id}`, data);
    return this.handleResponse(response);
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/templates/${id}`);
    return this.handleResponse(response);
  }

  // Landing page operations
  async getLandingPages(): Promise<ApiResponse> {
    const response = await this.client.get('/landing-pages');
    return this.handleResponse(response);
  }

  async getLandingPage(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/landing-pages/${id}`);
    return this.handleResponse(response);
  }

  async createLandingPage(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/landing-pages', data);
    return this.handleResponse(response);
  }

  async updateLandingPage(id: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/landing-pages/${id}`, data);
    return this.handleResponse(response);
  }

  async deleteLandingPage(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/landing-pages/${id}`);
    return this.handleResponse(response);
  }

  // SMTP operations
  async getSmtpProfiles(): Promise<ApiResponse> {
    const response = await this.client.get('/smtp');
    return this.handleResponse(response);
  }

  async getSmtpProfile(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/smtp/${id}`);
    return this.handleResponse(response);
  }

  async createSmtpProfile(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/smtp', data);
    return this.handleResponse(response);
  }

  async updateSmtpProfile(id: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/smtp/${id}`, data);
    return this.handleResponse(response);
  }

  async deleteSmtpProfile(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/smtp/${id}`);
    return this.handleResponse(response);
  }

  // User operations
  async getUsers(): Promise<ApiResponse> {
    const response = await this.client.get('/users');
    return this.handleResponse(response);
  }

  async getUser(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/users/${id}`);
    return this.handleResponse(response);
  }

  async createUser(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/users', data);
    return this.handleResponse(response);
  }

  async updateUser(id: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/users/${id}`, data);
    return this.handleResponse(response);
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/users/${id}`);
    return this.handleResponse(response);
  }

  // Webhook operations
  async getWebhooks(filters: any = {}): Promise<ApiResponse> {
    const response = await this.client.get('/webhooks', { params: filters });
    return this.handleResponse(response);
  }

  // Legacy methods for backward compatibility
  async uploadTemplate(templateData: any): Promise<ApiResponse> {
    return this.createTemplate(templateData);
  }

  async fetchReports(filters: any = {}): Promise<ApiResponse> {
    // This would need to be implemented based on your reporting requirements
    const response = await this.client.get('/webhooks', { params: filters });
    return this.handleResponse(response);
  }

  async fetchCampaignResults(campaignId: string): Promise<ApiResponse> {
    return this.getCampaignResults(campaignId);
  }

  async generatePDFReport(campaignId: string): Promise<ApiResponse> {
    // This would need to be implemented if PDF generation is required
    throw new Error('PDF report generation not implemented');
  }

  async fetchEventTimeline(campaignId: string): Promise<ApiResponse> {
    // This would need to be implemented based on your timeline requirements
    const response = await this.client.get(`/campaigns/${campaignId}/results`);
    return this.handleResponse(response);
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