import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Users, 
  BarChart3, 
  Mail, 
  Calendar, 
  Settings, 
  Edit, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle
} from 'lucide-react';

import apiService from '@/lib/api';
import { Tenant, TenantStats } from '@/types/tenant';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch tenant details
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const response = await apiService.getTenant(id!);
      return response.data as Tenant;
    },
  });

  // Fetch tenant stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['tenant-stats', id],
    queryFn: async () => {
      const response = await apiService.getTenantStats(id!);
      return response.data as TenantStats;
    },
    enabled: !!tenant,
  });

  // Fetch tenant users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['tenant-users', id],
    queryFn: async () => {
      const response = await apiService.getTenantUsers(id!);
      return response.data;
    },
    enabled: !!tenant,
  });

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive" className="ml-2">Suspended</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 ml-2">Pending</Badge>;
      default:
        return <Badge variant="outline" className="ml-2">{status}</Badge>;
    }
  };

  // Render status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Loading state
  if (isTenantLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (!tenant) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center p-6 border rounded-lg">
          <p className="text-muted-foreground">Tenant not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/tenants')}
          >
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/tenants')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center">
              {tenant.displayName}
              {renderStatusBadge(tenant.status)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tenant.domain ? `${tenant.domain} • ` : ''}ID: {tenant.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/tenants/${id}/users`)}>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button onClick={() => navigate(`/tenants/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Tenant
          </Button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {renderStatusIcon(tenant.status)}
              <span className="text-2xl font-bold ml-2 capitalize">{tenant.status}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold ml-2 capitalize">{tenant.plan}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold ml-2">
                {isUsersLoading ? '...' : (users as any[]).length} / {tenant.settings.maxUsers}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-2xl font-bold ml-2">
                {format(new Date(tenant.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="api">API Configuration</TabsTrigger>
        </TabsList>
        
        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Current resource utilization for this tenant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isStatsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : stats ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Users</span>
                        <span className="text-sm text-muted-foreground">
                          {stats.activeUsers} / {tenant.settings.maxUsers}
                        </span>
                      </div>
                      <Progress value={stats.usagePercentage.users} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Campaigns</span>
                        <span className="text-sm text-muted-foreground">
                          {stats.activeCampaigns} / {tenant.settings.maxCampaigns}
                        </span>
                      </div>
                      <Progress value={stats.usagePercentage.campaigns} />
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No stats available</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Tenant branding configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Primary Color</span>
                    <div className="flex items-center">
                      <div 
                        className="h-6 w-6 rounded border mr-2"
                        style={{ backgroundColor: tenant.settings.primaryColor || '#1E40AF' }}
                      />
                      <span className="text-sm font-mono">
                        {tenant.settings.primaryColor || '#1E40AF'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Secondary Color</span>
                    <div className="flex items-center">
                      <div 
                        className="h-6 w-6 rounded border mr-2"
                        style={{ backgroundColor: tenant.settings.secondaryColor || '#3B82F6' }}
                      />
                      <span className="text-sm font-mono">
                        {tenant.settings.secondaryColor || '#3B82F6'}
                      </span>
                    </div>
                  </div>
                  
                  {tenant.logoUrl && (
                    <div className="mt-4">
                      <span className="text-sm mb-2 block">Logo</span>
                      <img 
                        src={tenant.logoUrl} 
                        alt={`${tenant.displayName} logo`} 
                        className="max-h-20 border rounded p-2" 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Settings tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Settings</CardTitle>
              <CardDescription>
                Configuration and capabilities for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">ID</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tenant.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Display Name</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tenant.displayName}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Domain</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tenant.domain || '-'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Plan</h3>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{tenant.plan}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Capabilities & Limits</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${tenant.settings.allowUserRegistration ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm">User Registration</span>
                    </div>
                    
                    <div>
                      <span className="text-sm">Max Users: </span>
                      <span className="text-sm font-medium">{tenant.settings.maxUsers}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm">Max Campaigns: </span>
                      <span className="text-sm font-medium">{tenant.settings.maxCampaigns}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm">Allowed Templates: </span>
                      <span className="text-sm font-medium">
                        {tenant.settings.allowedTemplates && tenant.settings.allowedTemplates.length > 0 
                          ? tenant.settings.allowedTemplates.length 
                          : 'All'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Configuration tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                GoPhish API settings for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium">GoPhish API URL</h3>
                <p className="font-mono text-sm bg-muted p-2 rounded mt-1">
                  {tenant.settings.gophishApiUrl}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">API Key</h3>
                <p className="font-mono text-sm bg-muted p-2 rounded mt-1">
                  ••••••••••••••••••••
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Default Sender Email</h3>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{tenant.settings.emailFrom}</span>
                </div>
              </div>
              
              <Button variant="outline" onClick={() => navigate(`/tenants/${id}/edit?tab=api`)}>
                <Settings className="h-4 w-4 mr-2" />
                Edit API Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantDetail; 