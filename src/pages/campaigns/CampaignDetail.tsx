import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  Mail, 
  Eye, 
  MousePointer, 
  FileText, 
  AlertTriangle,
  Download,
  RefreshCw,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';
import { WebhookEvent } from '@/lib/socket';

// Result interface
interface CampaignResult {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  status: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  sendDate?: string;
  openDate?: string;
  clickDate?: string;
  submitDate?: string;
  reportDate?: string;
}

// Campaign interface
interface Campaign {
  id: string;
  name: string;
  status: string;
  created_date: string;
  launch_date: string;
  send_by_date?: string;
  completed_date?: string;
  template: {
    id: string;
    name: string;
  };
  page: {
    id: string;
    name: string;
  };
  smtp: {
    id: string;
    name: string;
  };
  url: string;
  stats: {
    total: number;
    sent: number;
    opened: number;
    clicked: number;
    submitted: number;
    reported: number;
  };
}

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch campaign details
  const { 
    data: campaign, 
    isLoading: isLoadingCampaign, 
    isError: isErrorCampaign,
    error: campaignError
  } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await apiService.getCampaign(id!);
      return response.data.data;
    },
    enabled: !!id
  });

  // Fetch campaign results
  const { 
    data: results, 
    isLoading: isLoadingResults,
    isError: isErrorResults
  } = useQuery({
    queryKey: ['campaign-results', id],
    queryFn: async () => {
      const response = await apiService.getCampaignResults(id!);
      return response.data.data;
    },
    enabled: !!id
  });

  // Fetch webhook events for this campaign
  const { 
    data: webhookEvents, 
    isLoading: isLoadingEvents,
    isError: isErrorEvents
  } = useQuery({
    queryKey: ['campaign-events', id],
    queryFn: async () => {
      const response = await apiService.getCampaignWebhookEvents(id!);
      return response.data.data.events;
    },
    enabled: !!id
  });

  // Complete campaign mutation
  const completeCampaign = useMutation({
    mutationFn: async () => {
      const response = await apiService.completeCampaign(id!);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign completed successfully');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (error) => {
      toast.error('Failed to complete campaign', { 
        description: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  });

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async () => {
      const response = await apiService.deleteCampaign(id!);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      navigate('/campaigns');
    },
    onError: (error) => {
      toast.error('Failed to delete campaign', { 
        description: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  });

  // Listen for real-time webhook events
  useEffect(() => {
    const handleWebhookEvent = (event: CustomEvent<WebhookEvent>) => {
      const webhookEvent = event.detail;
      
      // Only update if the event is for this campaign
      if (webhookEvent.campaignId === id) {
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        queryClient.invalidateQueries({ queryKey: ['campaign-results', id] });
        queryClient.invalidateQueries({ queryKey: ['campaign-events', id] });
      }
    };

    // Add event listener
    window.addEventListener('gophish-webhook', handleWebhookEvent as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('gophish-webhook', handleWebhookEvent as EventListener);
    };
  }, [id, queryClient]);

  const handleStopCampaign = () => {
    if (window.confirm('Are you sure you want to stop this campaign?')) {
      completeCampaign.mutate();
    }
  };

  const handleDeleteCampaign = () => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaign.mutate();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'email_opened':
        return <Eye className="h-4 w-4" />;
      case 'link_clicked':
        return <MousePointer className="h-4 w-4" />;
      case 'form_submitted':
        return <FileText className="h-4 w-4" />;
      case 'email_reported':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'bg-blue-500';
      case 'opened':
        return 'bg-yellow-500';
      case 'clicked':
        return 'bg-orange-500';
      case 'submitted':
        return 'bg-green-500';
      case 'reported':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Loading state
  if (isLoadingCampaign) {
    return (
      <div>
        <PageHeader
          title="Campaign Details"
          description="Loading campaign details..."
          actions={
            <Button variant="outline" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          }
        />
        <Card className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading campaign data...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (isErrorCampaign) {
    return (
      <div>
        <PageHeader
          title="Campaign Details"
          description="Error loading campaign"
          actions={
            <Button variant="outline" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          }
        />
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load campaign details. Please check your connection to the Gophish API.
                {campaignError instanceof Error && (
                  <div className="mt-2 text-sm">{campaignError.message}</div>
                )}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/campaigns')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div>
        <PageHeader
          title="Campaign Details"
          description="Campaign not found"
          actions={
            <Button variant="outline" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          }
        />
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Found</AlertTitle>
              <AlertDescription>
                The campaign you're looking for does not exist or has been deleted.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={campaign.name}
        description={`Campaign details and results • Created on ${formatDate(campaign.created_date)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/campaigns')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
            {campaign.status === 'IN_PROGRESS' && (
              <Button variant="secondary" onClick={handleStopCampaign}>
                <XCircle className="mr-2 h-4 w-4" />
                Stop Campaign
              </Button>
            )}
            <Button variant="destructive" onClick={handleDeleteCampaign}>
              Delete Campaign
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="events">Webhook Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Campaign Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <StatusBadge status={campaign.status.toLowerCase()} />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['campaign', id] })}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Campaign Timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(campaign.created_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Launched:</span>
                      <span>{formatDate(campaign.launch_date)}</span>
                    </div>
                    {campaign.completed_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed:</span>
                        <span>{formatDate(campaign.completed_date)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Campaign Settings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template:</span>
                      <span>{campaign.template.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Landing Page:</span>
                      <span>{campaign.page.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SMTP Profile:</span>
                      <span>{campaign.smtp.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Results Overview</CardTitle>
                <CardDescription>
                  Real-time statistics of phishing campaign progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.stats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-sm flex items-center">
                          <Users className="mr-1 h-4 w-4" /> Total
                        </span>
                        <div className="text-2xl font-bold">{campaign.stats.total}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-sm flex items-center">
                          <Send className="mr-1 h-4 w-4" /> Sent
                        </span>
                        <div className="text-2xl font-bold">{campaign.stats.sent}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-sm flex items-center">
                          <Eye className="mr-1 h-4 w-4" /> Opened
                        </span>
                        <div className="text-2xl font-bold">{campaign.stats.opened}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-sm flex items-center">
                          <MousePointer className="mr-1 h-4 w-4" /> Clicked
                        </span>
                        <div className="text-2xl font-bold">{campaign.stats.clicked}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-sm flex items-center">
                          <FileText className="mr-1 h-4 w-4" /> Submitted
                        </span>
                        <div className="text-2xl font-bold">{campaign.stats.submitted}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Email Open Rate</span>
                          <span>{campaign.stats.total > 0 ? 
                            Math.round((campaign.stats.opened / campaign.stats.total) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={campaign.stats.total > 0 ? 
                            (campaign.stats.opened / campaign.stats.total) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Link Click Rate</span>
                          <span>{campaign.stats.opened > 0 ? 
                            Math.round((campaign.stats.clicked / campaign.stats.opened) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={campaign.stats.opened > 0 ? 
                            (campaign.stats.clicked / campaign.stats.opened) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Form Submission Rate</span>
                          <span>{campaign.stats.clicked > 0 ? 
                            Math.round((campaign.stats.submitted / campaign.stats.clicked) * 100) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={campaign.stats.clicked > 0 ? 
                            (campaign.stats.submitted / campaign.stats.clicked) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Export Campaign Data
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="results" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Results</CardTitle>
                <CardDescription>
                  Detailed results for each recipient in the campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingResults ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isErrorResults ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load campaign results. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : results && results.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>First Action</TableHead>
                          <TableHead className="text-right">Timeline</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result: CampaignResult, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{result.email}</TableCell>
                            <TableCell>
                              {result.firstName} {result.lastName}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className={`mr-2 h-2 w-2 rounded-full ${getStatusColor(result.status)}`} />
                                {result.status}
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.openDate ? formatDate(result.openDate) : 
                               result.clickDate ? formatDate(result.clickDate) : 
                               result.submitDate ? formatDate(result.submitDate) : 
                               result.reportDate ? formatDate(result.reportDate) : 
                               'No action'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {result.sendDate && <Badge variant="outline" className="text-xs">Sent</Badge>}
                                {result.openDate && <Badge variant="outline" className="bg-yellow-50 text-xs">Opened</Badge>}
                                {result.clickDate && <Badge variant="outline" className="bg-orange-50 text-xs">Clicked</Badge>}
                                {result.submitDate && <Badge variant="outline" className="bg-green-50 text-xs">Submitted</Badge>}
                                {result.reportDate && <Badge variant="outline" className="bg-red-50 text-xs">Reported</Badge>}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No results available yet
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-between">
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['campaign-results', id] })}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Results
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Results
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="events" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Events</CardTitle>
                <CardDescription>
                  Real-time events received from Gophish webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isErrorEvents ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load webhook events. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : webhookEvents && webhookEvents.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {webhookEvents.map((event: WebhookEvent, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center">
                                {getEventIcon(event.event)}
                                <span className="ml-2">{event.event.replace('_', ' ')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{event.email}</TableCell>
                            <TableCell>{formatDate(event.timestamp.toString())}</TableCell>
                            <TableCell>{event.ip || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No webhook events received yet
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-between">
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['campaign-events', id] })}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Events
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Events
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CampaignDetail; 