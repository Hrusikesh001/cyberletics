import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Zap,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DateRange } from 'react-day-picker';
import ReportsFilters from './ReportsFilters';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import apiService from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Campaign, ApiResponse, CampaignListResponse } from '@/types/api';
import GophishConnectionStatus from '@/components/common/GophishConnectionStatus';

// Convert campaign data to format needed for charts
const formatCampaignDataForChart = (campaigns: Campaign[]) => {
  return campaigns.map(campaign => ({
    name: campaign.name,
    sent: campaign.stats?.sent || 0,
    opened: campaign.stats?.opened || 0,
    clicked: campaign.stats?.clicked || 0,
    submitted: campaign.stats?.submitted || 0,
  }));
};

// Calculate summary statistics
const calculateStats = (campaigns: Campaign[]) => {
  let totalTargets = 0;
  let totalClicked = 0;
  let totalSubmitted = 0;

  campaigns.forEach(campaign => {
    totalTargets += campaign.stats?.sent || 0;
    totalClicked += campaign.stats?.clicked || 0;
    totalSubmitted += campaign.stats?.submitted || 0;
  });

  const clickRate = totalTargets > 0 ? (totalClicked / totalTargets) * 100 : 0;
  const submissionRate = totalTargets > 0 ? (totalSubmitted / totalTargets) * 100 : 0;

  return {
    totalTargets,
    clickRate: clickRate.toFixed(1),
    submissionRate: submissionRate.toFixed(1)
  };
};

// Function to filter campaigns based on filter criteria
const filterCampaigns = (
  campaigns: Campaign[], 
  dateRange?: DateRange, 
  campaignId?: string,
  status?: string
) => {
  return campaigns.filter(campaign => {
    // Filter by date range
    if (dateRange?.from) {
      const campaignDate = new Date(campaign.launch_date);
      if (dateRange.from && campaignDate < dateRange.from) {
        return false;
      }
      if (dateRange.to && campaignDate > dateRange.to) {
        return false;
      }
    }
    
    // Filter by campaign ID
    if (campaignId && campaignId !== 'all' && campaign.id !== campaignId) {
      return false;
    }
    
    // Filter by status
    if (status && status !== 'all') {
      if (status === 'opened' && !(campaign.stats?.opened > 0)) {
        return false;
      }
      if (status === 'clicked' && !(campaign.stats?.clicked > 0)) {
        return false;
      }
      if (status === 'submitted' && !(campaign.stats?.submitted > 0)) {
        return false;
      }
    }
    
    return true;
  });
};

// Function to export CSV
const exportCSV = (campaigns: Campaign[], filename = 'campaign-report.csv') => {
  // Create CSV header
  let csvContent = "Campaign Name,Launch Date,Status,Sent,Opened,Clicked,Submitted\n";
  
  // Add each campaign's data
  campaigns.forEach(campaign => {
    const row = [
      `"${campaign.name}"`,
      new Date(campaign.launch_date).toLocaleDateString(),
      campaign.status,
      campaign.stats?.sent || 0,
      campaign.stats?.opened || 0,
      campaign.stats?.clicked || 0,
      campaign.stats?.submitted || 0
    ].join(',');
    csvContent += row + "\n";
  });
  
  // Create a download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ReportsPage: React.FC = () => {
  const [filterState, setFilterState] = useState({
    dateRange: undefined as DateRange | undefined,
    campaign: 'all',
    status: 'all'
  });
  
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  
  // Fetch campaigns from API
  const { data: campaignsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await apiService.getCampaigns();
      return response.data as ApiResponse<CampaignListResponse>;
    }
  });
  
  // Update filtered campaigns when data or filters change
  useEffect(() => {
    if (campaignsData?.data?.data) {
      const filtered = filterCampaigns(
        campaignsData.data.data,
        filterState.dateRange,
        filterState.campaign,
        filterState.status
      );
      setFilteredCampaigns(filtered);
    }
  }, [campaignsData, filterState]);

  const handleFilter = (filters: { 
    dateRange: DateRange | undefined; 
    campaign: string; 
    status: string; 
  }) => {
    setFilterState(filters);
    toast.success('Filters applied');
  };
  
  const handleExport = () => {
    if (filteredCampaigns.length > 0) {
      exportCSV(filteredCampaigns, `campaign-report-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Report exported successfully');
    } else {
      toast.error('No data to export');
    }
  };
  
  // Calculate statistics from filtered data
  const stats = calculateStats(filteredCampaigns);
  const chartData = formatCampaignDataForChart(filteredCampaigns);
  
  if (isLoading) {
    return (
      <div>
        <PageHeader 
          title="Reports" 
          description="View campaign results and analytics."
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

  if (isError) {
    return (
      <div>
        <PageHeader 
          title="Reports" 
          description="View campaign results and analytics."
        />
        
        <GophishConnectionStatus onRetry={refetch} />
        
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load campaign data. Please check your connection to the Gophish API.
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
        title="Reports" 
        description="View campaign results and analytics."
      />
      
      <ReportsFilters 
        onFilter={handleFilter} 
        onExport={handleExport}
        campaigns={campaignsData?.data?.data || []}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Target Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalTargets.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Targets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vulnerability Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.clickRate}%</div>
                <p className="text-xs text-muted-foreground">Click Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credential Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.submissionRate}%</div>
                <p className="text-xs text-muted-foreground">Submission Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">No campaign data available for the selected filters</p>
              </div>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 70,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      tick={{ fontSize: 12 }}
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" stackId="a" name="Emails Sent" fill="#4e46e5" />
                    <Bar dataKey="opened" stackId="a" name="Emails Opened" fill="#0ea5e9" />
                    <Bar dataKey="clicked" stackId="a" name="Links Clicked" fill="#f97316" />
                    <Bar dataKey="submitted" stackId="a" name="Credentials Submitted" fill="#ea384c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
