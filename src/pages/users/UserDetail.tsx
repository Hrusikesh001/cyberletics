import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  UserCog,
  Mail,
  Calendar,
  Edit,
  ArrowLeft,
  Users,
  Shield,
  ShieldAlert,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Building
} from 'lucide-react';

import apiService from '@/lib/api';
import { User } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch user details
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await apiService.getUser(id!);
      return response.data as User;
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center p-6 border rounded-lg">
          <p className="text-muted-foreground">User not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/users')}
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  // Render user role badge
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'super-admin':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
            <UserIcon className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center space-x-2">
              <span>{user.name}</span>
              {renderRoleBadge(user.role)}
              <span>
                {user.isActive ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">Active</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 ml-2">Inactive</Badge>
                )}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              <Mail className="h-4 w-4 inline mr-1" /> {user.email}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/users/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit User
        </Button>
      </div>

      {/* User Information Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenant Access</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Basic information about this user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                    <p>{user.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                    <p className="capitalize">{user.role}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="flex items-center mt-1">
                      {user.isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span>Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Login</h3>
                    <div className="mt-1">
                      {user.lastLogin ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{format(new Date(user.lastLogin), 'MMM d, yyyy')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Summary</CardTitle>
                <CardDescription>Overview of tenant access rights</CardDescription>
              </CardHeader>
              <CardContent>
                {user.tenants.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      This user does not have access to any tenants
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This user has access to {user.tenants.length} tenant{user.tenants.length !== 1 ? 's' : ''}
                    </p>
                    
                    {user.tenants.slice(0, 5).map((tenant, i) => (
                      <div key={tenant.tenantId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{tenant.tenantName || `Tenant ${i + 1}`}</span>
                        </div>
                        {tenant.role === 'admin' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">Admin</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">User</Badge>
                        )}
                      </div>
                    ))}
                    
                    {user.tenants.length > 5 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => {
                          const tabElement = document.querySelector('[data-value="tenants"]');
                          if (tabElement instanceof HTMLElement) {
                            tabElement.click();
                          }
                        }}
                      >
                        Show All Tenants
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tenants Tab */}
        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Access</CardTitle>
              <CardDescription>Tenants this user can access and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {user.tenants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tenant Access</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This user does not have access to any tenants. Assign the user to tenants to provide access to tenant resources.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.tenants.map((tenant, index) => (
                    <div key={tenant.tenantId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-medium">{tenant.tenantName || `Tenant ${index + 1}`}</h3>
                        <p className="text-sm text-muted-foreground">ID: {tenant.tenantId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tenant.role === 'admin' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center">
                            <UserIcon className="h-3 w-3 mr-1" />
                            User
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => navigate(`/tenants/${tenant.tenantId}`)}
                        >
                          View Tenant
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User login and action history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Activity Logging Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  User activity tracking will be available in a future update. This will include login history, actions, and system events.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDetail; 