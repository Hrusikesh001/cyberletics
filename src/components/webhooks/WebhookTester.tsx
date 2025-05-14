import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import apiService from '@/lib/api';

interface WebhookTesterProps {
  onSuccess?: () => void;
}

const WebhookTester: React.FC<WebhookTesterProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState('email_opened');
  const [campaignId, setCampaignId] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch campaigns for dropdown
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns-for-webhook'],
    queryFn: async () => {
      const response = await apiService.getCampaigns();
      return response.data.data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !campaignId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Create webhook payload based on Gophish format
      const campaign = campaignsData.find((c: any) => c.id === campaignId);
      
      const webhookPayload = {
        email: email,
        campaign_id: parseInt(campaignId),
        campaign_name: campaign?.name || 'Test Campaign',
        user_id: 0,
        message: getEventMessage(eventType),
        payload: {
          ip: '127.0.0.1',
          browser: {
            user_agent: navigator.userAgent
          },
          time: new Date().toISOString()
        }
      };
      
      // Send directly to the webhook endpoint
      const response = await axios.post(`${import.meta.env.VITE_API_URL.replace('/api', '')}/webhooks`, webhookPayload);
      
      if (response.status === 200) {
        toast.success('Test webhook sent successfully');
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Failed to send test webhook');
      }
    } catch (error) {
      console.error('Error sending test webhook:', error);
      toast.error('Failed to send test webhook', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const getEventMessage = (type: string): string => {
    switch (type) {
      case 'email_opened':
        return 'Email opened';
      case 'link_clicked':
        return 'Clicked link in email';
      case 'form_submitted':
        return 'Submitted form data';
      case 'email_reported':
        return 'Email reported';
      default:
        return 'Email opened';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Tester</CardTitle>
        <CardDescription>
          Send test webhook events to simulate phishing campaign interactions
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign</Label>
            <Select 
              value={campaignId} 
              onValueChange={setCampaignId}
              disabled={isLoadingCampaigns}
            >
              <SelectTrigger id="campaign">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCampaigns ? (
                  <SelectItem value="loading" disabled>
                    Loading campaigns...
                  </SelectItem>
                ) : campaignsData && campaignsData.length > 0 ? (
                  campaignsData.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No campaigns available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="event-type">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email_opened">Email Opened</SelectItem>
                <SelectItem value="link_clicked">Link Clicked</SelectItem>
                <SelectItem value="form_submitted">Form Submitted</SelectItem>
                <SelectItem value="email_reported">Email Reported</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSending || !campaignId || !email}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Webhook
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default WebhookTester; 