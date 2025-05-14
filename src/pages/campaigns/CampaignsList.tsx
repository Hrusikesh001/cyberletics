import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Edit, Trash2, Eye, PlayCircle, XCircle, Download, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';
import NewCampaignForm from '@/components/campaigns/NewCampaignForm';
import { ApiResponse, Campaign, CampaignListResponse, StatusType } from '@/types/api';
import GophishConnectionStatus from '@/components/common/GophishConnectionStatus';

const CampaignsList: React.FC = () => {
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch campaigns from API
  const { data: campaignsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await apiService.getCampaigns();
      return response.data as ApiResponse<CampaignListResponse>;
    }
  });

  // Complete campaign mutation
  const completeCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.completeCampaign(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign completed successfully');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => {
      toast.error('Failed to complete campaign', { 
        description: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  });

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.deleteCampaign(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => {
      toast.error('Failed to delete campaign', { 
        description: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  });

  const handleStopCampaign = (id: string) => {
    completeCampaign.mutate(id);
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Convert campaign status string to StatusType for the StatusBadge component
  const getStatusType = (status: string): StatusType => {
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'in_progress':
        return 'in_progress';
      case 'queued':
        return 'scheduled';
      case 'completed':
        return 'completed';
      case 'canceled':
        return 'canceled';
      case 'scheduled':
        return 'scheduled';
      default:
        return 'scheduled'; // Default case
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader 
          title="Campaigns" 
          description="Manage your phishing campaigns."
        />
        <Card className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading campaigns...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader 
          title="Campaigns" 
          description="Manage your phishing campaigns."
        />

        <GophishConnectionStatus onRetry={refetch} />

        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load campaigns. Please check your connection to the Gophish API.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const campaigns: Campaign[] = campaignsData?.data?.data || [];

  return (
    <div>
      <PageHeader 
        title="Campaigns" 
        description="Manage your phishing campaigns."
        actions={
          <Button onClick={() => setIsNewCampaignOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        }
      />
      
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-4">No campaigns found</p>
            <Button onClick={() => setIsNewCampaignOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Launch Date</TableHead>
                <TableHead className="text-center">Sent</TableHead>
                <TableHead className="text-center">Opened</TableHead>
                <TableHead className="text-center">Clicked</TableHead>
                <TableHead className="text-center">Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={getStatusType(campaign.status)} />
                  </TableCell>
                  <TableCell>{campaign.template.name}</TableCell>
                  <TableCell>{formatDate(campaign.launch_date)}</TableCell>
                  <TableCell className="text-center">{campaign.stats?.sent || 0}</TableCell>
                  <TableCell className="text-center">
                    {campaign.stats?.opened || 0}
                    {campaign.stats?.sent > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round(((campaign.stats?.opened || 0) / campaign.stats.sent) * 100)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.stats?.clicked || 0}
                    {campaign.stats?.sent > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round(((campaign.stats?.clicked || 0) / campaign.stats.sent) * 100)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.stats?.submitted || 0}
                    {campaign.stats?.sent > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round(((campaign.stats?.submitted || 0) / campaign.stats.sent) * 100)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">Open menu</span>
                          <Send className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        {campaign.status === 'IN_PROGRESS' && (
                          <DropdownMenuItem onClick={() => handleStopCampaign(campaign.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Stop Campaign</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => window.alert("This feature is coming soon")}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Export Results</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteCampaign(campaign.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Campaign</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* New Campaign Dialog */}
      <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new phishing campaign
            </DialogDescription>
          </DialogHeader>
          <NewCampaignForm onComplete={() => setIsNewCampaignOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignsList;
