import { useState, useEffect, useCallback } from 'react';
import { useGoPhishClient } from '@/api/goPhishClient';

interface GophishSettings {
  baseUrl: string;
  apiKey: string;
  version?: string;
  status: 'connected' | 'error' | 'loading' | 'disconnected';
}

interface UseGophishSettingsReturn {
  settings: GophishSettings;
  isLoading: boolean;
  error: string | null;
  testConnection: () => Promise<void>;
  updateSettings: (newSettings: Partial<GophishSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const useGophishSettings = (): UseGophishSettingsReturn => {
  const client = useGoPhishClient();
  const [settings, setSettings] = useState<GophishSettings>({
    baseUrl: '',
    apiKey: '',
    status: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial settings
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const configResponse = await client.getGophishConfig();
      if (configResponse.status === 'success' && configResponse.data) {
        setSettings({
          baseUrl: configResponse.data.baseURL || '',
          apiKey: configResponse.data.apiKey || '',
          status: 'disconnected'
        });
      }
    } catch (err) {
      console.error('Failed to load Gophish settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Test connection
  const testConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await client.testGophishConnection();
      
      if (response.status === 'connected') {
        setSettings(prev => ({
          ...prev,
          version: response.data?.version,
          status: 'connected'
        }));
      } else {
        setSettings(prev => ({
          ...prev,
          status: 'error'
        }));
        setError(response.message || 'Connection failed');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setSettings(prev => ({
        ...prev,
        status: 'error'
      }));
      setError('Connection test failed');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<GophishSettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await client.updateGophishSettings({
        apiKey: newSettings.apiKey,
        baseUrl: newSettings.baseUrl
      });
      
      if (response.status === 'success') {
        setSettings(prev => ({
          ...prev,
          ...newSettings,
          status: 'disconnected' // Reset status after update
        }));
        
        // Test connection with new settings
        await testConnection();
      } else {
        setError(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  }, [client, testConnection]);

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    await loadSettings();
    await testConnection();
  }, [loadSettings, testConnection]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    error,
    testConnection,
    updateSettings,
    refreshSettings
  };
}; 