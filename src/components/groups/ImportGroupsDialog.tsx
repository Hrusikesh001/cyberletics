
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ImportGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => void;
}

const ImportGroupsDialog: React.FC<ImportGroupsDialogProps> = ({
  open,
  onOpenChange,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template CSV content
    const csvContent = 'email,first_name,last_name,position\njohn.doe@example.com,John,Doe,Software Engineer\njane.smith@example.com,Jane,Smith,Product Manager';
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'group_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Template downloaded successfully');
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate processing the CSV file
      // In a real app, you'd parse the CSV here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockImportedData = [
        { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', position: 'Software Engineer' },
        { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', position: 'Product Manager' },
        { email: 'alex.johnson@example.com', firstName: 'Alex', lastName: 'Johnson', position: 'Designer' }
      ];
      
      onImport(mockImportedData);
      toast.success(`Imported ${mockImportedData.length} members successfully`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Error importing CSV file');
      console.error(error);
    } finally {
      setIsLoading(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Group Members</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing group member information
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              {file ? `Selected: ${file.name}` : 'No file selected'}
            </p>
          </div>
          
          <div className="p-4 bg-muted rounded-md">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">CSV Format Requirements</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>First row must contain headers: email, first_name, last_name, position (optional)</li>
              <li>Email addresses must be valid format</li>
              <li>UTF-8 encoding is recommended</li>
              <li>Maximum file size: 5MB</li>
              <li>Maximum 5,000 records per import</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isLoading}>
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportGroupsDialog;
