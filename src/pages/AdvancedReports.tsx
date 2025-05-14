import React, { useState, useEffect } from 'react';
import { useGoPhishClient } from '@/api/goPhishClient';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Filter } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, isAfter, startOfDay, endOfDay } from 'date-fns';

// Define types for campaign data
interface CampaignSummary {
  id: string;
  name: string;
  created_date: string;
  launch_date: string;
  status: string;
}

interface EventDataPoint {
  timestamp: number;
  hour: number;
  weekday: number;
  campaignId: string;
  campaignName: string;
  event: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  userId?: string;
  email?: string;
  browser?: string;
}

const AdvancedReports: React.FC = () => {
  const goPhishClient = useGoPhishClient();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [eventData, setEventData] = useState<EventDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('heatmap');

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const campaignsData = await goPhishClient.getCampaigns();
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    fetchCampaigns();
  }, [goPhishClient]);

  // Fetch event data based on filters
  useEffect(() => {
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would fetch this data from the API
        // For demonstration, we'll generate sample data
        const filters = {
          campaignId: selectedCampaign !== 'all' ? selectedCampaign : undefined,
          startDate: format(dateRange.start, 'yyyy-MM-dd'),
          endDate: format(dateRange.end, 'yyyy-MM-dd'),
        };
        
        // Simulate API call to fetch report data
        if (selectedCampaign === 'all') {
          // Get data for all campaigns in range
          const allData: EventDataPoint[] = [];
          for (const campaign of campaigns) {
            if (campaign.launch_date) {
              const launchDate = new Date(campaign.launch_date);
              if (isAfter(launchDate, startOfDay(dateRange.start)) && 
                  isAfter(endOfDay(dateRange.end), launchDate)) {
                // Generate sample data for this campaign
                allData.push(...generateSampleEventData(campaign.id, campaign.name, 30));
              }
            }
          }
          setEventData(allData);
        } else {
          // Get data for a specific campaign
          const selectedCampaignObj = campaigns.find(c => c.id === selectedCampaign);
          if (selectedCampaignObj) {
            setEventData(generateSampleEventData(selectedCampaignObj.id, selectedCampaignObj.name, 100));
          }
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have campaigns loaded
    if (campaigns.length > 0) {
      fetchEventData();
    }
  }, [campaigns, selectedCampaign, dateRange, goPhishClient]);

  // Helper function to generate sample event data
  const generateSampleEventData = (campaignId: string, campaignName: string, count: number): EventDataPoint[] => {
    const events = ['email_sent', 'email_opened', 'clicked', 'submitted_data', 'reported'];
    const data: EventDataPoint[] = [];
    
    for (let i = 0; i < count; i++) {
      const eventType = events[Math.floor(Math.random() * events.length)];
      const now = new Date();
      const timestamp = subDays(now, Math.floor(Math.random() * 30)).getTime();
      const date = new Date(timestamp);
      
      data.push({
        timestamp,
        hour: date.getHours(),
        weekday: date.getDay(),
        campaignId,
        campaignName,
        event: eventType,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        browser: ['Chrome', 'Firefox', 'Edge', 'Safari'][Math.floor(Math.random() * 4)],
        email: `user${Math.floor(Math.random() * 100)}@example.com`
      });
    }
    
    return data;
  };

  // Prepare data for heatmap
  const getHeatmapData = () => {
    const heatmapData = [];
    
    // Initialize counters for each hour/day combination
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapData.push({
          weekday: day,
          hour,
          count: 0,
          weekdayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
          hourFormatted: `${hour}:00`
        });
      }
    }
    
    // Count events for each cell
    eventData.forEach(event => {
      // Only count clicked and submitted_data events
      if (event.event === 'clicked' || event.event === 'submitted_data') {
        const index = (event.weekday * 24) + event.hour;
        if (heatmapData[index]) {
          heatmapData[index].count++;
        }
      }
    });
    
    return heatmapData;
  };

  // Prepare event counts by type
  const getEventTypeData = () => {
    const counts = {
      email_sent: 0,
      email_opened: 0,
      clicked: 0,
      submitted_data: 0,
      reported: 0
    };
    
    eventData.forEach(event => {
      if (counts[event.event as keyof typeof counts] !== undefined) {
        counts[event.event as keyof typeof counts]++;
      }
    });
    
    return [
      { name: 'Sent', value: counts.email_sent, color: '#8884d8' },
      { name: 'Opened', value: counts.email_opened, color: '#82ca9d' },
      { name: 'Clicked', value: counts.clicked, color: '#ffc658' },
      { name: 'Submitted', value: counts.submitted_data, color: '#ff8042' },
      { name: 'Reported', value: counts.reported, color: '#ff0000' }
    ];
  };

  // Prepare conversion funnel data
  const getConversionData = () => {
    const counts = {
      email_sent: 0,
      email_opened: 0,
      clicked: 0,
      submitted_data: 0
    };
    
    eventData.forEach(event => {
      if (counts[event.event as keyof typeof counts] !== undefined) {
        counts[event.event as keyof typeof counts]++;
      }
    });
    
    // If no emails were sent, set a default value to avoid divide-by-zero
    if (counts.email_sent === 0) counts.email_sent = 1;
    
    return [
      { name: 'Sent', value: 100, absolute: counts.email_sent },
      { name: 'Opened', value: Math.round((counts.email_opened / counts.email_sent) * 100), absolute: counts.email_opened },
      { name: 'Clicked', value: Math.round((counts.clicked / counts.email_sent) * 100), absolute: counts.clicked },
      { name: 'Submitted', value: Math.round((counts.submitted_data / counts.email_sent) * 100), absolute: counts.submitted_data }
    ];
  };

  // Custom tooltip for heatmap
  const HeatmapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="font-semibold">{data.weekdayName} {data.hourFormatted}</p>
          <p className="text-sm">Events: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (eventData.length === 0) return;
    
    // Convert data to CSV format
    const headers = ['Timestamp', 'Campaign', 'Event', 'Email', 'IP', 'Browser'];
    const csvData = eventData.map(event => [
      new Date(event.timestamp).toISOString(),
      event.campaignName,
      event.event,
      event.email || '',
      event.ip || '',
      event.browser || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `phishing_events_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Advanced Reports</h1>
          <Button onClick={exportToCSV} disabled={eventData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine the report data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto">
                <p className="text-sm font-medium mb-2">Campaign</p>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="w-full md:w-[240px]">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col w-full md:w-auto">
                <p className="text-sm font-medium mb-2">Date Range</p>
                <div className="flex gap-2">
                  <DatePicker
                    date={dateRange.start}
                    setDate={(date) => date && setDateRange(prev => ({ ...prev, start: date }))}
                    disabled={(date) => date > new Date()}
                    placeholder="Start date"
                  />
                  <DatePicker
                    date={dateRange.end}
                    setDate={(date) => date && setDateRange(prev => ({ ...prev, end: date }))}
                    disabled={(date) => date > new Date() || date < dateRange.start}
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="heatmap">Click Heatmap</TabsTrigger>
            <TabsTrigger value="events">Event Breakdown</TabsTrigger>
            <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          </TabsList>
          
          <Card className="mt-4">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <TabsContent value="heatmap" className="mt-0">
                    <div className="h-[500px]">
                      <h3 className="text-lg font-medium mb-4">Click Activity Heatmap</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        This visualization shows when users are most likely to interact with phishing emails.
                        Darker colors indicate higher activity.
                      </p>
                      <ResponsiveContainer width="100%" height="80%">
                        <ScatterChart
                          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                          <CartesianGrid />
                          <XAxis
                            type="number"
                            dataKey="hour"
                            name="Hour"
                            domain={[0, 23]}
                            tickFormatter={(hour) => `${hour}:00`}
                            label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="weekday"
                            name="Day"
                            domain={[0, 6]}
                            tickFormatter={(day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                            label={{ value: 'Day of Week', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip content={<HeatmapTooltip />} />
                          <Scatter
                            name="Activity"
                            data={getHeatmapData()}
                            fill="#8884d8"
                            shape="circle"
                          >
                            {getHeatmapData().map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.count === 0 
                                  ? '#f3f4f6' 
                                  : `rgba(47, 133, 90, ${Math.min(0.1 + (entry.count * 0.15), 1)})`}
                                r={entry.count === 0 ? 2 : Math.min(3 + (entry.count * 1.5), 12)}
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="events" className="mt-0">
                    <div className="h-[500px]">
                      <h3 className="text-lg font-medium mb-4">Event Type Distribution</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Breakdown of different event types across the selected campaign(s).
                      </p>
                      <ResponsiveContainer width="100%" height="80%">
                        <BarChart
                          data={getEventTypeData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Count">
                            {getEventTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="conversion" className="mt-0">
                    <div className="h-[500px]">
                      <h3 className="text-lg font-medium mb-4">Conversion Funnel</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Shows the percentage of users that progress through each stage of the phishing funnel.
                      </p>
                      <ResponsiveContainer width="100%" height="80%">
                        <LineChart
                          data={getConversionData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            formatter={(value, name, props) => {
                              return [`${value}% (${props.payload.absolute})`, 'Conversion Rate'];
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="Conversion Rate"
                            stroke="#8884d8"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdvancedReports; 