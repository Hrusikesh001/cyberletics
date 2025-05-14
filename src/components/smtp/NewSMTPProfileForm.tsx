import React, { useState } from 'react';
import { Check, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';
import { SmtpProfile } from '@/types/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NewSMTPProfileFormProps {
  onSubmit: () => void;
  existingProfile?: SmtpProfile;
}

const NewSMTPProfileForm: React.FC<NewSMTPProfileFormProps> = ({ 
  onSubmit, 
  existingProfile 
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!existingProfile;

  // Form state
  const [formData, setFormData] = useState<Partial<SmtpProfile>>({
    name: existingProfile?.name || '',
    host: existingProfile?.host || '',
    port: existingProfile?.port || 587,
    username: existingProfile?.username || '',
    password: '',
    from_address: existingProfile?.from_address || '',
    ignore_cert_errors: existingProfile?.ignore_cert_errors || false,
    headers: existingProfile?.headers || {}
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Testing connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<SmtpProfile>) => {
      if (isEditing && existingProfile?.id) {
        return apiService.updateSmtpProfile(existingProfile.id, data);
      } else {
        return apiService.createSmtpProfile(data);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing ? 'SMTP profile updated successfully' : 'SMTP profile created successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['smtpProfiles'] });
      onSubmit();
    },
    onError: (error) => {
      toast.error('Failed to save SMTP profile', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: Partial<SmtpProfile>) => {
      setIsTesting(true);
      setTestResult(null);
      try {
        const response = await apiService.testSmtpConnection(data);
        return response.data;
      } finally {
        setIsTesting(false);
      }
    },
    onSuccess: (data) => {
      setTestResult({
        success: true,
        message: data.message || 'Connection successful!'
      });
    },
    onError: (error) => {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      });
    }
  });

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | 
    { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Profile name is required';
    }
    
    if (!formData.host?.trim()) {
      newErrors.host = 'SMTP host is required';
    }
    
    if (!formData.port || formData.port <= 0) {
      newErrors.port = 'Valid port number is required';
    }
    
    if (!formData.from_address?.trim()) {
      newErrors.from_address = 'From email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.from_address)) {
      newErrors.from_address = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Only include password if it's provided or we're creating a new profile
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.password && isEditing) {
        delete dataToSubmit.password;
      }
      
      saveMutation.mutate(dataToSubmit);
    }
  };

  // Handle test connection
  const handleTestConnection = () => {
    if (validateForm()) {
      testConnectionMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Profile Name</Label>
        <Input 
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          placeholder="e.g., Corporate SMTP"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="host">SMTP Host</Label>
          <Input 
            id="host"
            name="host"
            value={formData.host || ''}
            onChange={handleChange}
            placeholder="e.g., smtp.company.com"
            className={errors.host ? 'border-destructive' : ''}
          />
          {errors.host && <p className="text-destructive text-sm mt-1">{errors.host}</p>}
        </div>
        <div>
          <Label htmlFor="port">SMTP Port</Label>
          <Input 
            id="port"
            name="port"
            value={formData.port || ''}
            onChange={(e) => handleChange({
              target: { name: 'port', value: parseInt(e.target.value) || '' }
            })}
            placeholder="e.g., 587"
            type="number"
            className={errors.port ? 'border-destructive' : ''}
          />
          {errors.port && <p className="text-destructive text-sm mt-1">{errors.port}</p>}
        </div>
      </div>
      
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="use-auth" 
            checked={!!(formData.username || formData.password)}
            onCheckedChange={(checked) => {
              if (!checked) {
                setFormData(prev => ({
                  ...prev,
                  username: '',
                  password: ''
                }));
              }
            }}
          />
          <Label htmlFor="use-auth" className="font-normal">Use authentication</Label>
        </div>
        
        {(formData.username || formData.password) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                name="username"
                value={formData.username || ''}
                onChange={handleChange}
                placeholder="e.g., user@domain.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                type="password"
                placeholder={isEditing ? '••••••••• (unchanged)' : 'SMTP password'}
              />
              {isEditing && (
                <p className="text-muted-foreground text-xs mt-1">
                  Leave blank to keep current password
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="from_address">From Email</Label>
          <Input 
            id="from_address"
            name="from_address"
            value={formData.from_address || ''}
            onChange={handleChange}
            placeholder="e.g., security@company.com"
            className={errors.from_address ? 'border-destructive' : ''}
          />
          {errors.from_address && <p className="text-destructive text-sm mt-1">{errors.from_address}</p>}
        </div>
        <div>
          <Label htmlFor="from_name">From Name (optional)</Label>
          <Input 
            id="from_name"
            name="from_name"
            value={formData.headers?.['From-Name'] || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              headers: {
                ...prev.headers,
                'From-Name': e.target.value
              }
            }))}
            placeholder="e.g., IT Security Team"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="ignore_cert_errors"
            checked={formData.ignore_cert_errors}
            onCheckedChange={(checked) => 
              handleCheckboxChange('ignore_cert_errors', !!checked)
            }
          />
          <Label htmlFor="ignore_cert_errors" className="font-normal">
            Ignore SSL certificate errors (not recommended for production)
          </Label>
        </div>
      </div>
      
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <AlertDescription>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="border-t pt-4 flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          className="flex items-center"
          onClick={handleTestConnection}
          disabled={isTesting || saveMutation.isPending}
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Test Connection
        </Button>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onSubmit}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Update Profile' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default NewSMTPProfileForm;
