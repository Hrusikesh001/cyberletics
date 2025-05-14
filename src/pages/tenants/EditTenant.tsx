import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import TenantForm from '@/components/tenants/TenantForm';
import { Button } from '@/components/ui/button';
import apiService from '@/lib/api';
import { Tenant } from '@/types/tenant';

const EditTenant = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');

  // Fetch tenant details
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const response = await apiService.getTenant(id!);
      return response.data as Tenant;
    },
  });

  // Handle successful update
  const handleSuccess = () => {
    navigate(`/tenants/${id}`);
  };

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
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/tenants/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Edit Tenant</h1>
          <p className="text-sm text-muted-foreground">
            Update settings for {tenant.displayName}
          </p>
        </div>
      </div>

      <TenantForm 
        mode="edit" 
        tenant={tenant} 
        onSuccess={handleSuccess}
        initialTab={initialTab || undefined}
      />
    </div>
  );
};

export default EditTenant; 