import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import https from 'https';
import config from '../config/config';
import logger from './logger';
import { ServiceUnavailableError } from './errorHandler';

/**
 * Interface for tenant-specific GoPhish settings
 */
interface GoPhishSettings {
  apiKey: string;
  apiUrl: string;
}

/**
 * GoPhish Client class for making API requests
 */
class GoPhishClient {
  private client: AxiosInstance;
  private tenantId: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  /**
   * Create a new GoPhish client
   * @param tenantId Tenant ID
   * @param settings Custom settings (optional)
   */
  constructor(tenantId: string, settings?: GoPhishSettings) {
    this.tenantId = tenantId;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: settings?.apiUrl || config.gophish.baseUrl,
      headers: {
        'Authorization': `Bearer ${settings?.apiKey || config.gophish.apiKey}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId
      },
      // SSL configuration
      httpsAgent: config.gophish.verifySSL ? 
        undefined : 
        new https.Agent({ rejectUnauthorized: false })
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`GoPhish API Request [${tenantId}]: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error(`GoPhish API Request Error [${tenantId}]: ${error.message}`);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`GoPhish API Response [${tenantId}]: ${response.status} ${response.config.url}`);
        this.retryCount = 0; // Reset retry count on successful response
        return response;
      },
      async (error: AxiosError) => {
        // Log the error
        logger.error(`GoPhish API Error [${tenantId}]: ${error.message}`, {
          status: error.response?.status,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          data: error.response?.data
        });

        // Retry for server errors (5xx) or network errors, but not for client errors (4xx)
        if (
          this.retryCount < this.maxRetries && 
          (
            !error.response || 
            (error.response.status >= 500 && error.response.status < 600)
          )
        ) {
          this.retryCount++;
          
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          logger.info(`Retrying GoPhish API request (${this.retryCount}/${this.maxRetries}) after ${delay}ms`);
          
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(this.client(error.config as AxiosRequestConfig));
            }, delay);
          });
        }
        
        // If max retries reached or client error, reject with enhanced error
        if (this.retryCount >= this.maxRetries) {
          logger.error(`Max retries reached for GoPhish API request [${tenantId}]`);
        }
        
        this.retryCount = 0; // Reset retry count
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get data from GoPhish API
   * @param endpoint API endpoint
   * @param params Query parameters
   */
  async get<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'GET', endpoint);
    }
  }

  /**
   * Post data to GoPhish API
   * @param endpoint API endpoint
   * @param data Request body
   */
  async post<T = any>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error, 'POST', endpoint);
    }
  }

  /**
   * Put data to GoPhish API
   * @param endpoint API endpoint
   * @param data Request body
   */
  async put<T = any>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.client.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error, 'PUT', endpoint);
    }
  }

  /**
   * Delete data from GoPhish API
   * @param endpoint API endpoint
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error, 'DELETE', endpoint);
    }
  }

  /**
   * Handle API errors
   * @param error Error object
   * @param method HTTP method
   * @param endpoint API endpoint
   */
  private handleError(error: any, method: string, endpoint: string): never {
    // Convert to AxiosError if possible
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // Server responded with non-2xx status
      const status = axiosError.response.status;
      const data = axiosError.response.data;
      
      // Log detailed error
      logger.error(`GoPhish API Error [${this.tenantId}] ${method} ${endpoint}:`, {
        status,
        data,
        message: axiosError.message
      });
      
      // Build error message
      let message = `GoPhish API Error (${status})`;
      if (typeof data === 'object' && data !== null && 'message' in data) {
        message += `: ${data.message}`;
      } else if (typeof data === 'string') {
        message += `: ${data}`;
      }
      
      // Throw appropriate error
      throw new ServiceUnavailableError(message);
    } else if (axiosError.request) {
      // Request made but no response received
      logger.error(`GoPhish API No Response [${this.tenantId}] ${method} ${endpoint}:`, {
        message: axiosError.message
      });
      
      throw new ServiceUnavailableError(`GoPhish API unavailable: No response received`);
    } else {
      // Error setting up the request
      logger.error(`GoPhish API Request Setup Error [${this.tenantId}] ${method} ${endpoint}:`, {
        message: error.message
      });
      
      throw new ServiceUnavailableError(`GoPhish API request failed: ${error.message}`);
    }
  }
}

/**
 * Factory function to create a GoPhish client for a tenant
 * @param tenantId Tenant ID
 * @param customSettings Optional custom settings
 */
export const createGoPhishClient = (tenantId: string, customSettings?: GoPhishSettings): GoPhishClient => {
  return new GoPhishClient(tenantId, customSettings);
};

export default GoPhishClient; 