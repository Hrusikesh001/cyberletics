import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';

const GophishSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch current settings
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['gophishSettings'],
    queryFn: async () => {
      const response = await apiService.getGophishSettings();
      return response.data.data;
    }
  });
  
  // Test connection mutation
  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await apiService.testGophishConnection();
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Connection successful', {
        description: `Connected to Gophish API (v${data.data?.version || 'Unknown'})`
      });
    },
    onError: (error) => {
      toast.error('Connection failed', {
        description: error instanceof Error ? error.message : 'Could not connect to Gophish'
      });
    }
  });
  
  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: { apiKey?: string, baseUrl?: string }) => {
      const response = await apiService.updateGophishSettings(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['gophishSettings'] });
      setIsUpdating(false);
    },
    onError: (error) => {
      toast.error('Failed to update settings', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
      setIsUpdating(false);
    }
  });
  
  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      setApiKey(settings.apiKey || '');
      setBaseUrl(settings.baseUrl || '');
    }
  }, [settings]);
  
  const saveSettings = () => {
    setIsUpdating(true);
    updateSettings.mutate({
      apiKey: apiKey.trim() || undefined,
      baseUrl: baseUrl.trim() || undefined
    });
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  const displayKey = showKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 20));
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gophish API Settings</CardTitle>
            <CardDescription>Loading settings...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gophish API Settings</CardTitle>
            <CardDescription>Configure your connection to the Gophish API.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load Gophish settings. Please check your network connection and try again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gophish API Settings</CardTitle>
          <CardDescription>
            Configure your connection to the Gophish API to enable phishing campaign management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings && settings.status === 'connected' && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Connected to Gophish API</AlertTitle>
              <AlertDescription>
                Successfully connected to Gophish API (v{settings.version || 'Unknown'})
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  value={displayKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                  placeholder="Enter your Gophish API key"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button variant="outline" size="icon" 
                onClick={() => copyToClipboard(apiKey)} 
                className="ml-2"
                disabled={!apiKey}
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Gophish API key can be found in your Gophish account settings.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-gophish-server:3333/api"
            />
            <p className="text-sm text-muted-foreground">
              The base URL of your Gophish API server.
            </p>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => testConnection.mutate()}
              disabled={testConnection.isPending}
            >
              {testConnection.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
            
            <Button 
              onClick={saveSettings}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure Gophish to send webhook events to Sentrifense.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            To receive real-time updates from Gophish, configure a webhook in your Gophish settings with the following URL:
          </p>
          
          <Alert>
            <code className="text-sm font-mono">{window.location.origin}/webhooks</code>
          </Alert>
          
          <Button 
            variant="outline" 
            onClick={() => copyToClipboard(`${window.location.origin}/webhooks`)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Webhook URL
          </Button>
          
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Gophish will send real-time notifications when emails are opened, links are clicked, and forms are submitted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GophishSettings; 