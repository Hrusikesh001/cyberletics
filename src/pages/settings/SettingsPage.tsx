import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import GophishSettings from './GophishSettings';
import APISettings from './APISettings';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const handleSaveSettings = () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };
  return <div>
      <PageHeader title="Settings" description="Manage your application settings" />

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="gophish">Gophish</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure the general settings for your phishing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" defaultValue="Sentrifense" />
                <p className="text-sm text-muted-foreground">
                  The name of the application displayed in the UI
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base-url">Base URL</Label>
                <Input id="base-url" defaultValue="https://example.com" />
                <p className="text-sm text-muted-foreground">
                  The base URL for generating phishing links
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme-mode">Theme Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeSwitcher />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-log-out">Auto Log Out</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out inactive users
                  </p>
                </div>
                <Switch id="auto-log-out" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="log-level">Log Level</Label>
                <select id="log-level" className="w-full p-2 rounded-md border border-input bg-background">
                  <option>Debug</option>
                  <option>Info</option>
                  <option>Warning</option>
                  <option>Error</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  The minimum log level to record
                </p>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <APISettings />
        </TabsContent>

        <TabsContent value="gophish">
          <GophishSettings />
        </TabsContent>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>Default SMTP Settings</CardTitle>
              <CardDescription>
                Configure the default SMTP settings for sending phishing emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.example.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" placeholder="587" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-security">Security</Label>
                  <select id="smtp-security" className="w-full p-2 rounded-md border border-input bg-background">
                    <option>None</option>
                    <option>TLS</option>
                    <option>SSL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-address">Default From Address</Label>
                <Input id="from-address" placeholder="no-reply@example.com" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auth-required">Authentication Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable if SMTP server requires authentication
                  </p>
                </div>
                <Switch id="auth-required" defaultChecked />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input id="smtp-username" placeholder="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input id="smtp-password" placeholder="••••••••" type="password" />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};
export default SettingsPage;