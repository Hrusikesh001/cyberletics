
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface NewUserFormProps {
  onSubmit: () => void;
}

const NewUserForm: React.FC<NewUserFormProps> = ({ onSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first-name">First Name</Label>
          <Input id="first-name" placeholder="e.g., John" />
        </div>
        <div>
          <Label htmlFor="last-name">Last Name</Label>
          <Input id="last-name" placeholder="e.g., Smith" />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" placeholder="e.g., john.smith@company.com" type="email" />
      </div>
      
      <div>
        <Label htmlFor="role">Role</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="send-welcome-email" />
          <Label htmlFor="send-welcome-email" className="font-normal">Send welcome email with login instructions</Label>
        </div>
      </div>
      
      <div className="border-t pt-4 flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={() => onSubmit()}>
          Cancel
        </Button>
        <Button type="submit">
          <Check className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>
    </form>
  );
};

export default NewUserForm;
