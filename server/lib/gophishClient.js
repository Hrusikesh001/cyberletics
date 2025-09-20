const axios = require('axios');
const https = require('https');

class GophishClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://localhost:3333';
    this.apiKey = config.apiKey || '';
    this.timeout = config.timeout || 10000;
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      },
      validateStatus: status => status < 500, // Don't throw on 4xx errors
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Disable SSL certificate verification for self-signed certs
      })
    });

    // Add request interceptor to handle API key
    this.client.interceptors.request.use((config) => {
      // Add API key to headers if not present
      if (this.apiKey && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${this.apiKey}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Gophish API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Helper method to handle API responses
  _handleResponse(response) {
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } else {
      return {
        success: false,
        error: response.data || 'Unknown error',
        status: response.status
      };
    }
  }

  // Helper method to handle errors
  _handleError(error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data || 'API Error',
        status: error.response.status
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error - no response received',
        status: 0
      };
    } else {
      return {
        success: false,
        error: error.message || 'Unknown error',
        status: 0
      };
    }
  }

  // Test connection to Gophish API
  async testConnection() {
    try {
      const response = await this.client.get('/');
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  // ==================== CAMPAIGNS ====================

  /**
   * Get all campaigns
   * GET /api/campaigns/
   */
  async getCampaigns() {
    try {
      const response = await this.client.get('/api/campaigns/');
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get a specific campaign by ID
   * GET /api/campaigns/:id
   */
  async getCampaign(id) {
    try {
      const response = await this.client.get(`/api/campaigns/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Create a new campaign
   * POST /api/campaigns/
   */
  async createCampaign(campaignData) {
    try {
      const response = await this.client.post('/api/campaigns/', campaignData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Update an existing campaign
   * PUT /api/campaigns/:id
   */
  async updateCampaign(id, campaignData) {
    try {
      const response = await this.client.put(`/api/campaigns/${id}`, campaignData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Delete a campaign
   * DELETE /api/campaigns/:id
   */
  async deleteCampaign(id) {
    try {
      const response = await this.client.delete(`/api/campaigns/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get campaign summary/stats
   * GET /api/campaigns/:id/summary
   */
  async getCampaignSummary(id) {
    try {
      const response = await this.client.get(`/api/campaigns/${id}/summary`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Complete a campaign
   * POST /api/campaigns/:id/complete
   */
  async completeCampaign(id) {
    try {
      const response = await this.client.post(`/api/campaigns/${id}/complete`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get campaign results
   * GET /api/campaigns/:id/results
   */
  async getCampaignResults(id) {
    try {
      const response = await this.client.get(`/api/campaigns/${id}/results`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  // ==================== GROUPS ====================

  /**
   * Get all groups
   * GET /api/groups/
   */
  async getGroups() {
    try {
      const response = await this.client.get('/api/groups/');
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get a specific group by ID
   * GET /api/groups/:id
   */
  async getGroup(id) {
    try {
      const response = await this.client.get(`/api/groups/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Create a new group
   * POST /api/groups/
   */
  async createGroup(groupData) {
    try {
      const response = await this.client.post('/api/groups/', groupData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Update an existing group
   * PUT /api/groups/:id
   */
  async updateGroup(id, groupData) {
    try {
      const response = await this.client.put(`/api/groups/${id}`, groupData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Delete a group
   * DELETE /api/groups/:id
   */
  async deleteGroup(id) {
    try {
      const response = await this.client.delete(`/api/groups/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  // ==================== TEMPLATES ====================

  /**
   * Get all templates
   * GET /api/templates/
   */
  async getTemplates() {
    try {
      const response = await this.client.get('/api/templates/');
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get a specific template by ID
   * GET /api/templates/:id
   */
  async getTemplate(id) {
    try {
      const response = await this.client.get(`/api/templates/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Create a new template
   * POST /api/templates/
   */
  async createTemplate(templateData) {
    try {
      const response = await this.client.post('/api/templates/', templateData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Update an existing template
   * PUT /api/templates/:id
   */
  async updateTemplate(id, templateData) {
    try {
      const response = await this.client.put(`/api/templates/${id}`, templateData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Delete a template
   * DELETE /api/templates/:id
   */
  async deleteTemplate(id) {
    try {
      const response = await this.client.delete(`/api/templates/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  // ==================== LANDING PAGES ====================

  /**
   * Get all landing pages
   * GET /api/pages/
   */
  async getPages() {
    try {
      const response = await this.client.get('/api/pages/');
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get a specific landing page by ID
   * GET /api/pages/:id
   */
  async getPage(id) {
    try {
      const response = await this.client.get(`/api/pages/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Create a new landing page
   * POST /api/pages/
   */
  async createPage(pageData) {
    try {
      const response = await this.client.post('/api/pages/', pageData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Update an existing landing page
   * PUT /api/pages/:id
   */
  async updatePage(id, pageData) {
    try {
      const response = await this.client.put(`/api/pages/${id}`, pageData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Delete a landing page
   * DELETE /api/pages/:id
   */
  async deletePage(id) {
    try {
      const response = await this.client.delete(`/api/pages/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  // ==================== SMTP PROFILES ====================

  /**
   * Get all SMTP profiles
   * GET /api/smtp/
   */
  async getSmtpProfiles() {
    try {
      const response = await this.client.get('/api/smtp/');
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get a specific SMTP profile by ID
   * GET /api/smtp/:id
   */
  async getSmtpProfile(id) {
    try {
      const response = await this.client.get(`/api/smtp/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Create a new SMTP profile
   * POST /api/smtp/
   */
  async createSmtpProfile(smtpData) {
    try {
      const response = await this.client.post('/api/smtp/', smtpData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Update an existing SMTP profile
   * PUT /api/smtp/:id
   */
  async updateSmtpProfile(id, smtpData) {
    try {
      const response = await this.client.put(`/api/smtp/${id}`, smtpData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Delete an SMTP profile
   * DELETE /api/smtp/:id
   */
  async deleteSmtpProfile(id) {
    try {
      const response = await this.client.delete(`/api/smtp/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  // ==================== USERS ====================

  /**
   * Get all users
   * GET /api/users/
   */
  async getUsers() {
    try {
      const response = await this.client.get('/api/users/');
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Get a specific user by ID
   * GET /api/users/:id
   */
  async getUser(id) {
    try {
      const response = await this.client.get(`/api/users/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Create a new user
   * POST /api/users/
   */
  async createUser(userData) {
    try {
      const response = await this.client.post('/api/users/', userData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Update an existing user
   * PUT /api/users/:id
   */
  async updateUser(id, userData) {
    try {
      const response = await this.client.put(`/api/users/${id}`, userData);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Delete a user
   * DELETE /api/users/:id
   */
  async deleteUser(id) {
    try {
      const response = await this.client.delete(`/api/users/${id}`);
      return this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Update API key
   */
  updateApiKey(apiKey) {
    this.apiKey = apiKey;
    this.client.defaults.headers.Authorization = `Bearer ${apiKey}`;
  }

  /**
   * Update base URL
   */
  updateBaseURL(baseURL) {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 4)}••••••••${this.apiKey.substring(this.apiKey.length - 4)}` : '',
      timeout: this.timeout
    };
  }
}

module.exports = GophishClient; 