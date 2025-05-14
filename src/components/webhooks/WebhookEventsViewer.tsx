import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Eye, 
  MousePointer, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  Trash2,
  Loader2,
  Search,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import apiService from '@/lib/api';
import { WebhookEvent } from '@/lib/socket';

interface WebhookEventsViewerProps {
  campaignId?: string;
  limit?: number;
  showFilters?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

const WebhookEventsViewer: React.FC<WebhookEventsViewerProps> = ({
  campaignId,
  limit = 10,
  showFilters = true,
  showClearButton = true,
  onClear
}) => {
  const [page, setPage] = useState(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || '');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate offset for pagination
  const offset = (page - 1) * limit;
  
  // Fetch webhook events
  const { 
    data: eventsData, 
    isLoading, 
    isError, 
    refetch
  } = useQuery({
    queryKey: ['webhook-events', selectedCampaignId, selectedEventType, offset, limit, searchTerm],
    queryFn: async () => {
      const params: Record<string, any> = {
        limit,
        offset,
      };
      
      if (selectedEventType) {
        params.event = selectedEventType;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (selectedCampaignId) {
        const response = await apiService.getCampaignWebhookEvents(selectedCampaignId, params);
        return response.data.data;
      } else {
        const response = await apiService.getWebhookEvents(params);
        return response.data.data;
      }
    }
  });
  
  // Fetch campaigns for the dropdown
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns-for-webhook-viewer'],
    queryFn: async () => {
      const response = await apiService.getCampaigns();
      return response.data.data;
    },
    enabled: showFilters && !campaignId,
  });
  
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
        return <Eye className="h-4 w-4" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  const handleClearEvents = async () => {
    try {
      if (selectedCampaignId) {
        await apiService.clearCampaignWebhookEvents(selectedCampaignId);
      } else {
        await apiService.clearAllWebhookEvents();
      }
      
      toast.success('Webhook events cleared successfully');
      refetch();
      
      if (onClear) {
        onClear();
      }
    } catch (error) {
      toast.error('Failed to clear webhook events', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  const events = eventsData?.events || [];
  const totalEvents = eventsData?.pagination?.total || 0;
  const totalPages = Math.ceil(totalEvents / limit);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Events</CardTitle>
        <CardDescription>
          Events received from Gophish webhooks
          {selectedCampaignId && campaignsData && (
            <>
              {' '}for campaign: <strong>
                {campaignsData.find((c: any) => c.id === selectedCampaignId)?.name || selectedCampaignId}
              </strong>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {!campaignId && (
              <div className="flex-1">
                <Label htmlFor="campaign-filter" className="mb-2 block">Campaign</Label>
                <Select
                  value={selectedCampaignId}
                  onValueChange={setSelectedCampaignId}
                  disabled={isLoadingCampaigns}
                >
                  <SelectTrigger id="campaign-filter">
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All campaigns</SelectItem>
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
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex-1">
              <Label htmlFor="event-type-filter" className="mb-2 block">Event Type</Label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger id="event-type-filter">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All events</SelectItem>
                  <SelectItem value="email_opened">Email Opened</SelectItem>
                  <SelectItem value="link_clicked">Link Clicked</SelectItem>
                  <SelectItem value="form_submitted">Form Submitted</SelectItem>
                  <SelectItem value="email_reported">Email Reported</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load webhook events. Please try again.
            </AlertDescription>
          </Alert>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No webhook events found
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>IP Address</TableHead>
                  {!selectedCampaignId && <TableHead>Campaign</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event: WebhookEvent, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center">
                        {getEventIcon(event.event)}
                        <span className="ml-2">
                          {event.event.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{event.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(event.timestamp.toString())}
                      </div>
                    </TableCell>
                    <TableCell>{event.ip || 'N/A'}</TableCell>
                    {!selectedCampaignId && (
                      <TableCell>
                        {event.campaignName || event.campaignId}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1} 
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let pageNumber;
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all
                    pageNumber = i + 1;
                  } else if (page <= 3) {
                    // If near start, show first 5
                    pageNumber = i + 1;
                  } else if (page >= totalPages - 2) {
                    // If near end, show last 5
                    pageNumber = totalPages - 4 + i;
                  } else {
                    // Show 2 before and 2 after current page
                    pageNumber = page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        isActive={pageNumber === page}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        
        {showClearButton && (
          <Button 
            variant="destructive" 
            onClick={handleClearEvents}
            disabled={events.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Events
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WebhookEventsViewer; 