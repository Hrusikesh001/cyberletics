
import React, { useState } from 'react';
import { Check, Upload, Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface NewGroupFormProps {
  onSubmit: () => void;
}

// Mock data for members
const mockMembers = [
  { id: 1, email: 'john.smith@company.com', firstName: 'John', lastName: 'Smith', position: 'Software Engineer' },
  { id: 2, email: 'jane.doe@company.com', firstName: 'Jane', lastName: 'Doe', position: 'Product Manager' },
  { id: 3, email: 'michael.brown@company.com', firstName: 'Michael', lastName: 'Brown', position: 'UX Designer' },
];

const NewGroupForm: React.FC<NewGroupFormProps> = ({ onSubmit }) => {
  const [activeTab, setActiveTab] = useState('manual');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="group-name">Group Name</Label>
        <Input id="group-name" placeholder="e.g., Marketing Department" />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="manual">Add Manually</TabsTrigger>
          <TabsTrigger value="import">Import from CSV</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="John" />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Smith" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" placeholder="john.smith@company.com" type="email" />
            </div>
            <div>
              <Label htmlFor="position">Position (Optional)</Label>
              <Input id="position" placeholder="e.g., Software Engineer" />
            </div>
            
            <Button type="button" size="sm" className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden mt-4">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.firstName}</TableCell>
                    <TableCell>{member.lastName}</TableCell>
                    <TableCell>{member.position}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4 pt-4">
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Drop your CSV file here</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                or click to browse files from your computer
              </p>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-md">
            <h4 className="text-sm font-medium mb-2">CSV Format Requirements</h4>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>First row must contain headers: email, first_name, last_name, position (optional)</li>
              <li>Email addresses must be valid format</li>
              <li>UTF-8 encoding is recommended</li>
              <li>Maximum file size: 5MB</li>
              <li>Maximum 5,000 records per import</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={() => onSubmit()}>
          Cancel
        </Button>
        <Button type="submit">
          <Check className="mr-2 h-4 w-4" />
          Save Group
        </Button>
      </div>
    </form>
  );
};

export default NewGroupForm;
