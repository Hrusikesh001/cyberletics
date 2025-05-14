import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import apiService from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Tenant } from '@/types/tenant';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';

const TenantsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'pending'>('active');

  // Load tenants
  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await apiService.getTenants();
      return response.data as Tenant[];
    },
  });

  // Filter tenants based on search term
  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedTenant) return;
    
    try {
      await apiService.updateTenantStatus(selectedTenant.id, newStatus);
      toast.success(`Tenant status updated to ${newStatus}`);
      refetch();
      setShowStatusDialog(false);
    } catch (error) {
      toast.error('Failed to update tenant status');
    }
  };

  // Handle tenant deletion
  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    
    try {
      await apiService.deleteTenant(selectedTenant.id);
      toast.success('Tenant deleted successfully');
      refetch();
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete tenant');
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render plan badge
  const renderPlanBadge = (plan: string) => {
    switch (plan) {
      case 'free':
        return <Badge>Free</Badge>;
      case 'basic':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Basic</Badge>;
      case 'professional':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Professional</Badge>;
      case 'enterprise':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Enterprise</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Tenant Management"
        description="Manage organization tenants and their settings"
      />

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => navigate('/tenants/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Tenant
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center p-6 border rounded-lg">
          <p className="text-muted-foreground">No tenants found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.displayName}</TableCell>
                  <TableCell>{tenant.domain || '-'}</TableCell>
                  <TableCell>{renderStatusBadge(tenant.status)}</TableCell>
                  <TableCell>{renderPlanBadge(tenant.plan)}</TableCell>
                  <TableCell>{format(new Date(tenant.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/tenants/${tenant.id}`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          View Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/tenants/${tenant.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Tenant
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/tenants/${tenant.id}/users`)}>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Users
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setNewStatus(tenant.status === 'active' ? 'suspended' : 'active');
                            setShowStatusDialog(true);
                          }}
                        >
                          {tenant.status === 'active' ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Suspend Tenant
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate Tenant
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Tenant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === 'active' ? 'Activate Tenant' : 'Suspend Tenant'}
            </DialogTitle>
            <DialogDescription>
              {newStatus === 'active'
                ? 'This will allow users to access this tenant.'
                : 'This will prevent all users from accessing this tenant until reactivated.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              {newStatus === 'active' ? 'Activate' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tenant
              and remove all associated data, including campaigns, templates, and user associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTenant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TenantsList; 