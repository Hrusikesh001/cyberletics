import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Tenant, TenantCreateInput, TenantUpdateInput } from '@/types/tenant';
import { toast } from 'sonner';
import apiService from '@/lib/api';
import { Loader2, Save } from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

// Validation schema for tenant
const tenantSchema = z.object({
  name: z.string()
    .min(3, { message: 'Tenant name must be at least 3 characters' })
    .max(50, { message: 'Tenant name must be less than 50 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Tenant name can only contain lowercase letters, numbers, and hyphens' }),
  displayName: z.string()
    .min(3, { message: 'Display name must be at least 3 characters' })
    .max(100, { message: 'Display name must be less than 100 characters' }),
  domain: z.string().optional(),
  gophishApiKey: z.string().min(1, { message: 'API key is required' }),
  gophishApiUrl: z.string().url({ message: 'Must be a valid URL' }).optional(),
  emailFrom: z.string().email({ message: 'Must be a valid email address' }),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Must be a valid hex color code' }).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Must be a valid hex color code' }).optional(),
  allowUserRegistration: z.boolean().default(false),
  maxUsers: z.number().int().min(1).default(5),
  maxCampaigns: z.number().int().min(1).default(10),
  plan: z.enum(['free', 'basic', 'professional', 'enterprise']).default('free'),
  status: z.enum(['active', 'suspended', 'pending']).default('pending'),
});

interface TenantFormProps {
  tenant?: Tenant;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  initialTab?: string;
}

const TenantForm: React.FC<TenantFormProps> = ({ tenant, mode, onSuccess, initialTab }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or existing tenant data
  const form = useForm<z.infer<typeof tenantSchema>>({
    resolver: zodResolver(tenantSchema),
    defaultValues: tenant
      ? {
          name: tenant.name,
          displayName: tenant.displayName,
          domain: tenant.domain || '',
          gophishApiKey: tenant.settings.gophishApiKey,
          gophishApiUrl: tenant.settings.gophishApiUrl,
          emailFrom: tenant.settings.emailFrom,
          primaryColor: tenant.settings.primaryColor || '#1E40AF',
          secondaryColor: tenant.settings.secondaryColor || '#3B82F6',
          allowUserRegistration: tenant.settings.allowUserRegistration,
          maxUsers: tenant.settings.maxUsers,
          maxCampaigns: tenant.settings.maxCampaigns,
          plan: tenant.plan,
          status: tenant.status,
        }
      : {
          name: '',
          displayName: '',
          domain: '',
          gophishApiKey: '',
          gophishApiUrl: 'https://localhost:3333/api',
          emailFrom: '',
          primaryColor: '#1E40AF',
          secondaryColor: '#3B82F6',
          allowUserRegistration: false,
          maxUsers: 5,
          maxCampaigns: 10,
          plan: 'free',
          status: 'pending',
        },
  });

  const onSubmit = async (values: z.infer<typeof tenantSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Prepare tenant data
      const tenantData = {
        name: values.name,
        displayName: values.displayName,
        domain: values.domain,
        settings: {
          gophishApiKey: values.gophishApiKey,
          gophishApiUrl: values.gophishApiUrl,
          emailFrom: values.emailFrom,
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          allowUserRegistration: values.allowUserRegistration,
          maxUsers: values.maxUsers,
          maxCampaigns: values.maxCampaigns,
        },
      };

      if (mode === 'create') {
        // Create new tenant
        await apiService.createTenant(tenantData as TenantCreateInput);
        toast.success('Tenant created successfully');
      } else if (mode === 'edit' && tenant) {
        // Update existing tenant
        const updateData: TenantUpdateInput = {
          displayName: values.displayName,
          domain: values.domain,
          settings: tenantData.settings,
          status: values.status,
          plan: values.plan,
        };
        
        await apiService.updateTenant(tenant.id, updateData);
        toast.success('Tenant updated successfully');
      }
      
      // Call success callback or navigate back
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/tenants');
      }
    } catch (error) {
      toast.error(mode === 'create' ? 'Failed to create tenant' : 'Failed to update tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue={initialTab || "basic"}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="api">API Configuration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Configure the core settings for this tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="tenant-name"
                          disabled={mode === 'edit'} // Tenant ID cannot be changed after creation
                        />
                      </FormControl>
                      <FormDescription>
                        A unique identifier for the tenant. Use lowercase letters, numbers, and hyphens only.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Acme Corporation" />
                      </FormControl>
                      <FormDescription>
                        The name that will be displayed to users
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="example.com" />
                      </FormControl>
                      <FormDescription>
                        Primary domain associated with this tenant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {mode === 'edit' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Current status of the tenant
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription Plan</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Subscription plan for this tenant
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Configuration Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure the GoPhish API settings for this tenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="gophishApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GoPhish API Key</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="API Key" />
                      </FormControl>
                      <FormDescription>
                        The API key used to authenticate with the GoPhish instance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gophishApiUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GoPhish API URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://localhost:3333/api" />
                      </FormControl>
                      <FormDescription>
                        The URL endpoint for the GoPhish API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Sender Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="no-reply@example.com" />
                      </FormControl>
                      <FormDescription>
                        Default email address used as the sender for campaigns
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    toast.info('This would test the GoPhish API connection');
                    // In a real implementation, you would call an API test endpoint here
                  }}
                >
                  Test Connection
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure additional tenant settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <div 
                            className="h-10 w-10 rounded-md border"
                            style={{ backgroundColor: field.value || '#1E40AF' }}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <div 
                            className="h-10 w-10 rounded-md border"
                            style={{ backgroundColor: field.value || '#3B82F6' }}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="allowUserRegistration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow User Registration</FormLabel>
                        <FormDescription>
                          Allow users to self-register to this tenant
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Users</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of users allowed in this tenant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxCampaigns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Campaigns</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of active campaigns allowed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tenants')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {mode === 'create' ? 'Create Tenant' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TenantForm; 