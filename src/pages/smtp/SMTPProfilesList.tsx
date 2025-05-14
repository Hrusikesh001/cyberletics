import React, { useState } from 'react';
import { Mail, Plus, Edit, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import NewSMTPProfileForm from '@/components/smtp/NewSMTPProfileForm';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';
import { ApiResponse, SmtpProfile, SmtpProfilesResponse } from '@/types/api';
import GophishConnectionStatus from '@/components/common/GophishConnectionStatus';

const SMTPProfilesList: React.FC = () => {
  const [isNewProfileOpen, setIsNewProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SmtpProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch SMTP profiles from API
  const { data: profilesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['smtpProfiles'],
    queryFn: async () => {
      const response = await apiService.getSmtpProfiles();
      return response.data as ApiResponse<SmtpProfilesResponse>;
    }
  });

  // Delete SMTP profile mutation
  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.deleteSmtpProfile(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('SMTP profile deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['smtpProfiles'] });
      setIsDeleteDialogOpen(false);
      setSelectedProfile(null);
    },
    onError: (error) => {
      toast.error('Failed to delete SMTP profile', { 
        description: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  });

  // Set profile as default mutation
  const setAsDefault = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.updateSmtpProfile(id, { is_default: true });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Default SMTP profile updated');
      queryClient.invalidateQueries({ queryKey: ['smtpProfiles'] });
    },
    onError: (error) => {
      toast.error('Failed to update default SMTP profile', { 
        description: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  });

  const handleEditProfile = (profile: SmtpProfile) => {
    setSelectedProfile(profile);
    setIsNewProfileOpen(true);
  };

  const handleDeleteProfile = (profile: SmtpProfile) => {
    setSelectedProfile(profile);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProfile) {
      deleteProfile.mutate(selectedProfile.id);
    }
  };

  const handleDialogClose = () => {
    setIsNewProfileOpen(false);
    setSelectedProfile(null);
  };

  const handleSetDefault = (id: string) => {
    setAsDefault.mutate(id);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader 
          title="SMTP Profiles" 
          description="Manage SMTP profiles for sending phishing emails."
        />
        <Card className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading SMTP profiles...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader 
          title="SMTP Profiles" 
          description="Manage SMTP profiles for sending phishing emails."
        />

        <GophishConnectionStatus onRetry={refetch} />

        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load SMTP profiles. Please check your connection to the Gophish API.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profiles: SmtpProfile[] = profilesData?.data?.data || [];

  return (
    <div>
      <PageHeader 
        title="SMTP Profiles" 
        description="Manage SMTP profiles for sending phishing emails."
        actions={
          <Button onClick={() => {
            setSelectedProfile(null);
            setIsNewProfileOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New SMTP Profile
          </Button>
        }
      />
      
      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-4">No SMTP profiles found</p>
            <Button onClick={() => setIsNewProfileOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First SMTP Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>From Email</TableHead>
                <TableHead className="text-center">Port</TableHead>
                <TableHead className="text-center">SSL/TLS</TableHead>
                <TableHead className="text-center">Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell>{profile.host}</TableCell>
                  <TableCell>{profile.from_address}</TableCell>
                  <TableCell className="text-center">{profile.port}</TableCell>
                  <TableCell className="text-center">
                    {profile.ignore_cert_errors ? (
                      <Badge variant="secondary">Disabled</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-cyber-success/10 text-cyber-success border-cyber-success/20">
                        Enabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {profile.is_default && <Check className="h-4 w-4 mx-auto text-cyber-success" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">Open menu</span>
                          <Mail className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProfile(profile)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Profile</span>
                        </DropdownMenuItem>
                        {!profile.is_default && (
                          <DropdownMenuItem onClick={() => handleSetDefault(profile.id)}>
                            <Check className="mr-2 h-4 w-4" />
                            <span>Set as Default</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProfile(profile)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Profile</span>
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

      {/* New/Edit SMTP Profile Dialog */}
      <Dialog open={isNewProfileOpen} onOpenChange={setIsNewProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProfile ? 'Edit SMTP Profile' : 'Create New SMTP Profile'}
            </DialogTitle>
            <DialogDescription>
              Configure your SMTP server settings for sending phishing emails.
            </DialogDescription>
          </DialogHeader>
          <NewSMTPProfileForm 
            existingProfile={selectedProfile || undefined}
            onSubmit={handleDialogClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SMTP Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this SMTP profile? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteProfile.isPending}
            >
              {deleteProfile.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SMTPProfilesList;
