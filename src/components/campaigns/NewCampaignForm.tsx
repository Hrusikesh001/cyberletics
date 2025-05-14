
import React, { useState } from 'react';
import { Check, ChevronDown, Calendar, Clock } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

interface NewCampaignFormProps {
  onSubmit: () => void;
}

// Mock data
const templates = [
  { id: 1, name: 'IT Security Policy Update' },
  { id: 2, name: 'Finance Department Update' },
  { id: 3, name: 'HR Document Review Request' },
  { id: 4, name: 'IT System Maintenance Notice' },
];

const landingPages = [
  { id: 1, name: 'Credential Harvest - Office 365' },
  { id: 2, name: 'Credential Harvest - Google' },
  { id: 3, name: 'Awareness Training Page' },
  { id: 4, name: 'Policy Acknowledgment Form' },
];

const smtpProfiles = [
  { id: 1, name: 'Corporate SMTP Relay' },
  { id: 2, name: 'External SMTP Service' },
  { id: 3, name: 'Gmail Relay' },
];

const targetGroups = [
  { id: 1, name: 'All Employees', count: 842 },
  { id: 2, name: 'Finance Department', count: 45 },
  { id: 3, name: 'IT Department', count: 28 },
  { id: 4, name: 'Executive Team', count: 12 },
];

const NewCampaignForm: React.FC<NewCampaignFormProps> = ({ onSubmit }) => {
  const [activeTab, setActiveTab] = useState('basics');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basics" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input id="campaign-name" placeholder="e.g., Q2 Security Awareness" />
            </div>
            
            <div>
              <Label htmlFor="landing-page">Landing Page</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a landing page" />
                </SelectTrigger>
                <SelectContent>
                  {landingPages.map(page => (
                    <SelectItem key={page.id} value={page.id.toString()}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="smtp-profile">SMTP Profile</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an SMTP profile" />
                </SelectTrigger>
                <SelectContent>
                  {smtpProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id.toString()}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="template" className="space-y-4 pt-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="email-template">Email Template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an email template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted/30 border rounded-md p-4">
              <h3 className="text-sm font-semibold">Preview</h3>
              <div className="mt-2 p-4 bg-card rounded-md">
                <p className="text-sm text-muted-foreground">
                  Template preview will appear here after selection.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="targets" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-group">Target Group</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a target group" />
                </SelectTrigger>
                <SelectContent>
                  {targetGroups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name} ({group.count} users)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="border rounded-md p-4 bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox id="exclude-previously-phished" />
                <Label 
                  htmlFor="exclude-previously-phished" 
                  className="text-sm font-normal"
                >
                  Exclude users who fell for previous campaigns
                </Label>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4 pt-4">
          <div className="grid gap-4">
            <div>
              <Label>Launch Options</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="launch-immediate" 
                    name="launch-time" 
                    value="immediate"
                    defaultChecked 
                  />
                  <Label htmlFor="launch-immediate" className="font-normal">Launch immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="launch-scheduled" 
                    name="launch-time" 
                    value="scheduled" 
                  />
                  <Label htmlFor="launch-scheduled" className="font-normal">Schedule for later</Label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="launch-date">Launch Date</Label>
                <div className="relative mt-1">
                  <Input id="launch-date" placeholder="YYYY-MM-DD" disabled />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="launch-time">Launch Time</Label>
                <div className="relative mt-1">
                  <Input id="launch-time" placeholder="HH:MM" disabled />
                  <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => onSubmit()}>
          Cancel
        </Button>
        <div className="flex space-x-2">
          {activeTab !== 'basics' && (
            <Button 
              variant="outline" 
              type="button"
              onClick={() => {
                const tabs = ['basics', 'template', 'targets', 'schedule'];
                const currentIndex = tabs.indexOf(activeTab);
                setActiveTab(tabs[currentIndex - 1]);
              }}
            >
              Previous
            </Button>
          )}
          {activeTab !== 'schedule' ? (
            <Button 
              type="button"
              onClick={() => {
                const tabs = ['basics', 'template', 'targets', 'schedule'];
                const currentIndex = tabs.indexOf(activeTab);
                setActiveTab(tabs[currentIndex + 1]);
              }}
            >
              Next
            </Button>
          ) : (
            <Button type="submit">
              <Check className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default NewCampaignForm;
