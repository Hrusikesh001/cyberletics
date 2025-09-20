import React, { useState } from 'react';
import { useGophishSettings } from '@/hooks/useGophishSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Settings, TestTube } from 'lucide-react';

export const GophishSettings: React.FC = () => {
  const {
    settings,
    isLoading,
    error,
    testConnection,
    updateSettings,
    refreshSettings
  } = useGophishSettings();

  const [formData, setFormData] = useState({
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey
  });

  const [isEditing, setIsEditing] = useState(false);

  // Update form data when settings change
  React.useEffect(() => {
    setFormData({
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey
    });
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey
    });
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    switch (settings.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (settings.status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'loading':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gophish Configuration
        </CardTitle>
        <CardDescription>
          Configure your Gophish server connection settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Connection Status</span>
          </div>
          {getStatusBadge()}
        </div>

        {settings.version && (
          <div className="text-sm text-gray-600">
            <strong>Version:</strong> {settings.version}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Settings Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="baseUrl">Gophish Server URL</Label>
            <Input
              id="baseUrl"
              type="url"
              placeholder="https://your-gophish-server:3333"
              value={formData.baseUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
              disabled={!isEditing || isLoading}
            />
          </div>

          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Gophish API key"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              disabled={!isEditing || isLoading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
              <Button
                onClick={testConnection}
                disabled={isLoading}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Button
                onClick={refreshSettings}
                disabled={isLoading}
                variant="outline"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                variant="outline"
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Processing...</span>
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Base URL:</strong> The URL where your Gophish server is running (e.g., https://localhost:3333)</p>
          <p><strong>API Key:</strong> Your Gophish API key found in the Gophish admin interface</p>
          <p className="text-xs">
            Note: The API key is masked for security. Make sure your Gophish server is running and accessible.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 