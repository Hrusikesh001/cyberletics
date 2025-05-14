import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import WebhookTester from '@/components/webhooks/WebhookTester';
import WebhookEventsViewer from '@/components/webhooks/WebhookEventsViewer';

const WebhooksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [refreshEvents, setRefreshEvents] = useState(0);

  const handleWebhookSent = () => {
    // Switch to events tab after sending a webhook
    setActiveTab('events');
    // Trigger a refresh of the events list
    setRefreshEvents(prev => prev + 1);
  };

  return (
    <div>
      <PageHeader 
        title="Webhooks" 
        description="Test and monitor webhook events from Gophish" 
      />

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Integration</CardTitle>
            <CardDescription>
              Webhooks allow Gophish to send real-time event notifications to Sentrifense
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="mb-4">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Webhook URL</AlertTitle>
              <AlertDescription>
                Configure your Gophish instance to send webhooks to:{' '}
                <code className="bg-muted p-1 rounded text-sm">
                  {window.location.origin}/webhooks
                </code>
              </AlertDescription>
            </Alert>
            
            <p className="text-muted-foreground text-sm">
              Webhooks provide real-time notifications when users interact with your phishing campaigns.
              Events include email opens, link clicks, form submissions, and email reports.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="events">Webhook Events</TabsTrigger>
          <TabsTrigger value="test">Test Webhooks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <WebhookEventsViewer 
            limit={15} 
            key={`events-viewer-${refreshEvents}`} 
          />
        </TabsContent>
        
        <TabsContent value="test">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WebhookTester onSuccess={handleWebhookSent} />
            
            <Card>
              <CardHeader>
                <CardTitle>About Webhook Testing</CardTitle>
                <CardDescription>
                  How to test webhook functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  The webhook tester allows you to simulate webhook events from Gophish without having to send real phishing emails. This is useful for:
                </p>
                
                <ul className="list-disc list-inside text-sm space-y-2">
                  <li>Testing your webhook configuration</li>
                  <li>Testing event handling in Sentrifense</li>
                  <li>Verifying real-time notifications are working</li>
                  <li>Simulating different user interactions with emails</li>
                </ul>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Event Types</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Email Opened</span> - User opened the email
                    </div>
                    <div>
                      <span className="font-medium">Link Clicked</span> - User clicked a link in the email
                    </div>
                    <div>
                      <span className="font-medium">Form Submitted</span> - User submitted credentials on landing page
                    </div>
                    <div>
                      <span className="font-medium">Email Reported</span> - User reported the email as phishing
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhooksPage; 