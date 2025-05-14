
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const APISettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('4a8basjd7b9b9c8d7e6f');
  const [showKey, setShowKey] = useState(false);

  const generateNewApiKey = () => {
    // In a real app, this would call an API endpoint to generate a new key
    const newKey = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
    toast.success('New API key generated');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const displayKey = showKey ? apiKey : '•'.repeat(apiKey.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Manage your API keys and access for programmatic access to Sentrifense.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  value={displayKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button variant="outline" size="icon" onClick={copyToClipboard} className="ml-2">
                <Copy size={16} />
              </Button>
              <Button variant="outline" size="icon" onClick={generateNewApiKey} className="ml-2">
                <RefreshCw size={16} />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This key provides full access to your Sentrifense account through the API.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="text-lg font-medium">API Documentation</h3>
            <p className="text-sm text-muted-foreground">
              Access our comprehensive API documentation to learn how to integrate with Sentrifense programmatically.
            </p>
            <Button variant="outline" onClick={() => toast.info('Documentation would open here')}>
              View API Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APISettings;
