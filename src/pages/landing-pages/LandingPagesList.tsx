import React, { useState } from 'react';
import { FileCode, Plus, Edit, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import LandingPageForm from '@/components/landing-pages/LandingPageForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';
import { ApiResponse, LandingPage, LandingPagesResponse } from '@/types/api';
import { formatDate } from '@/lib/utils';

const LandingPagesList: React.FC = () => {
  const [isNewPageOpen, setIsNewPageOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null);
  const queryClient = useQueryClient();

  // Fetch landing pages from API
  const { data: pagesData, isLoading, isError } = useQuery({
    queryKey: ['landingPages'],
    queryFn: async () => {
      const response = await apiService.getLandingPages();
      return response.data as ApiResponse<LandingPagesResponse>;
    }
  });

  // Delete landing page mutation
  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.deleteLandingPage(id);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Landing page deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      setIsDeleteDialogOpen(false);
      setSelectedPage(null);
    },
    onError: (error) => {
      toast.error('Failed to delete landing page', { 
        description: error instanceof Error ? error.message : 'An error occurred' 
      });
    }
  });

  const handleEditPage = (page: LandingPage) => {
    setSelectedPage(page);
    setIsNewPageOpen(true);
  };

  const handleDeletePage = (page: LandingPage) => {
    setSelectedPage(page);
    setIsDeleteDialogOpen(true);
  };

  const handlePreviewPage = (page: LandingPage) => {
    setSelectedPage(page);
    setIsPreviewOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPage) {
      deletePage.mutate(selectedPage.id);
    }
  };

  const handleDialogClose = () => {
    setIsNewPageOpen(false);
    setSelectedPage(null);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader 
          title="Landing Pages" 
          description="Manage landing pages for your phishing campaigns."
        />
        <Card className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading landing pages...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader 
          title="Landing Pages" 
          description="Manage landing pages for your phishing campaigns."
        />
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load landing pages. Please check your connection to the Gophish API.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const landingPages: LandingPage[] = pagesData?.data?.data || [];

  return (
    <div>
      <PageHeader 
        title="Landing Pages" 
        description="Manage landing pages for your phishing campaigns."
        actions={
          <Button onClick={() => {
            setSelectedPage(null);
            setIsNewPageOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Landing Page
          </Button>
        }
      />
      
      {landingPages.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-4">No landing pages found</p>
            <Button onClick={() => setIsNewPageOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Landing Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="text-center">Capture Credentials</TableHead>
                <TableHead className="text-center">Capture Passwords</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {landingPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell>{formatDate(page.modified_date, true)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={page.capture_credentials ? "default" : "secondary"}>
                      {page.capture_credentials ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={page.capture_passwords ? "default" : "secondary"}>
                      {page.capture_passwords ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">Open menu</span>
                          <FileCode className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreviewPage(page)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Preview</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPage(page)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePage(page)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
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

      {/* New/Edit Landing Page Dialog */}
      <Dialog open={isNewPageOpen} onOpenChange={setIsNewPageOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPage ? 'Edit Landing Page' : 'Create New Landing Page'}
            </DialogTitle>
            <DialogDescription>
              Design a landing page for credential harvesting.
            </DialogDescription>
          </DialogHeader>
          <LandingPageForm 
            existingPage={selectedPage || undefined}
            onSubmit={handleDialogClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Preview Landing Page Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Page Preview: {selectedPage?.name}</DialogTitle>
            <DialogDescription>
              {selectedPage?.capture_credentials 
                ? 'This page will capture credentials' 
                : 'This page will only track visits'}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-200 text-xs p-2 border-b flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center">{selectedPage?.redirect_url || 'example.com'}</div>
              <div className="w-4"></div>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto bg-white">
              {selectedPage && (
                <div dangerouslySetInnerHTML={{ __html: selectedPage.html }} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Landing Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this landing page? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deletePage.isPending}
            >
              {deletePage.isPending ? (
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

export default LandingPagesList; 