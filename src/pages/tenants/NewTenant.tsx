import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TenantForm from '@/components/tenants/TenantForm';
import { Button } from '@/components/ui/button';

const NewTenant = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create New Tenant</h1>
          <p className="text-sm text-muted-foreground">
            Set up a new organization in the platform
          </p>
        </div>
      </div>

      <TenantForm mode="create" />
    </div>
  );
};

export default NewTenant; 