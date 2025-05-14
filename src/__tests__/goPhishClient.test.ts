import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import goPhishClient from '@/api/goPhishClient';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        },
        response: {
          use: vi.fn()
        }
      }
    }))
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('GoPhish API Client', () => {
  let mockedAxios: any;
  
  beforeEach(() => {
    // Reset localStorage
    localStorageMock.clear();
    localStorageMock.setItem('auth_token', 'fake-jwt-token');
    localStorageMock.setItem('current_tenant_id', 'tenant1');
    
    // Get the mocked axios instance
    mockedAxios = axios.create();
    
    // Reset mocks
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Campaign operations', () => {
    it('should fetch campaigns', async () => {
      // Setup mock response
      const mockResponse = {
        data: [
          { id: '1', name: 'Test Campaign 1' },
          { id: '2', name: 'Test Campaign 2' }
        ]
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.getCampaigns();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/campaigns');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should create a campaign', async () => {
      // Setup mock data and response
      const campaignData = {
        name: 'New Campaign',
        template: { id: '1' },
        page: { id: '2' },
        smtp: { id: '3' },
        groups: [{ id: '4' }]
      };
      
      const mockResponse = {
        data: { id: '5', ...campaignData }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.createCampaign(campaignData);
      
      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith('/campaigns', campaignData);
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should update a campaign', async () => {
      // Setup mock data and response
      const campaignId = '5';
      const campaignData = {
        name: 'Updated Campaign Name'
      };
      
      const mockResponse = {
        data: { id: campaignId, name: 'Updated Campaign Name' }
      };
      
      mockedAxios.put.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.updateCampaign(campaignId, campaignData);
      
      // Assertions
      expect(mockedAxios.put).toHaveBeenCalledWith(`/campaigns/${campaignId}`, campaignData);
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should delete a campaign', async () => {
      // Setup mock data and response
      const campaignId = '5';
      const mockResponse = {
        data: { success: true }
      };
      
      mockedAxios.delete.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.deleteCampaign(campaignId);
      
      // Assertions
      expect(mockedAxios.delete).toHaveBeenCalledWith(`/campaigns/${campaignId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('Template operations', () => {
    it('should upload a template', async () => {
      // Setup mock data and response
      const templateData = {
        name: 'New Template',
        subject: 'Test Subject',
        html: '<p>Hello, {{.FirstName}}!</p>'
      };
      
      const mockResponse = {
        data: { id: '1', ...templateData }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.uploadTemplate(templateData);
      
      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith('/templates', templateData);
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should fetch templates', async () => {
      // Setup mock response
      const mockResponse = {
        data: [
          { id: '1', name: 'Template 1' },
          { id: '2', name: 'Template 2' }
        ]
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.getTemplates();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/templates');
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('Landing page operations', () => {
    it('should get landing pages', async () => {
      // Setup mock response
      const mockResponse = {
        data: [
          { id: '1', name: 'Landing Page 1' },
          { id: '2', name: 'Landing Page 2' }
        ]
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.getLandingPages();
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/landing-pages');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should create a landing page', async () => {
      // Setup mock data and response
      const pageData = {
        name: 'New Landing Page',
        html: '<html><body><form>Login form</form></body></html>'
      };
      
      const mockResponse = {
        data: { id: '3', ...pageData }
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.createLandingPage(pageData);
      
      // Assertions
      expect(mockedAxios.post).toHaveBeenCalledWith('/landing-pages', pageData);
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('Reporting operations', () => {
    it('should fetch reports with filters', async () => {
      // Setup mock data and response
      const filters = {
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      
      const mockResponse = {
        data: {
          campaigns: [
            { id: '1', name: 'Campaign 1', stats: { sent: 100, opened: 50, clicked: 25 } }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.fetchReports(filters);
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith('/reports', { params: filters });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should fetch campaign results', async () => {
      // Setup mock data and response
      const campaignId = '1';
      
      const mockResponse = {
        data: {
          results: [
            { email: 'user1@example.com', status: 'Success' },
            { email: 'user2@example.com', status: 'Clicked' }
          ]
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await goPhishClient.fetchCampaignResults(campaignId);
      
      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(`/campaigns/${campaignId}/results`);
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('Authentication and headers', () => {
    it('should include tenant ID in headers when set', () => {
      // Set tenant ID
      goPhishClient.setTenantId('tenant1');
      
      // Spy on axios interceptors
      const requestInterceptor = vi.fn();
      mockedAxios.interceptors.request.use.mockImplementationOnce(fn => {
        requestInterceptor.mockImplementationOnce(fn);
      });
      
      // Create a mock request config
      const config = {
        headers: {}
      };
      
      // Call the interceptor manually since we can't easily test it through the client
      requestInterceptor(config);
      
      // Assertions
      expect(config.headers['X-Tenant-ID']).toBe('tenant1');
    });
  });
}); 