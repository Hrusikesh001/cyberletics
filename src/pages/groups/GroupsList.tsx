
import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Eye, Upload } from 'lucide-react';
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
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import NewGroupForm from '@/components/groups/NewGroupForm';
import ImportGroupsDialog from '@/components/groups/ImportGroupsDialog';
import { toast } from 'sonner';

// Mock data for groups
const mockGroups = [
  { 
    id: 1, 
    name: 'All Employees', 
    memberCount: 842,
    createdAt: '2023-02-15',
    lastModified: '2023-04-02',
    usedInCampaigns: 5
  },
  { 
    id: 2, 
    name: 'Finance Department', 
    memberCount: 45,
    createdAt: '2023-02-28',
    lastModified: '2023-03-10',
    usedInCampaigns: 2
  },
  { 
    id: 3, 
    name: 'IT Department', 
    memberCount: 28,
    createdAt: '2023-01-20',
    lastModified: '2023-03-15',
    usedInCampaigns: 3
  },
  { 
    id: 4, 
    name: 'Executive Team', 
    memberCount: 12,
    createdAt: '2023-03-05',
    lastModified: '2023-03-05',
    usedInCampaigns: 1
  },
];

const GroupsList: React.FC = () => {
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImportData = (data: any[]) => {
    console.log('Imported data:', data);
    toast.success(`Successfully imported ${data.length} group members`);
  };

  return (
    <div>
      <PageHeader 
        title="Target Groups" 
        description="Manage recipient groups for your phishing campaigns."
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => setIsNewGroupOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
          </div>
        }
      />
      
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-center">Used In Campaigns</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell className="text-center">{group.memberCount}</TableCell>
                <TableCell>{group.createdAt}</TableCell>
                <TableCell>{group.lastModified}</TableCell>
                <TableCell className="text-center">{group.usedInCampaigns}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Open menu</span>
                        <Users className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Members</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Group</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Group</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a new group of recipients for your phishing campaigns.
            </DialogDescription>
          </DialogHeader>
          <NewGroupForm onSubmit={() => setIsNewGroupOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <ImportGroupsDialog 
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImportData}
      />
    </div>
  );
};

export default GroupsList;
