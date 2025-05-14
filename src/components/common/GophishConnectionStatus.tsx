import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import apiService from '@/lib/api';
import { ApiResponse } from '@/types/api';

interface GophishConnectionStatusProps {
  onRetry?: () => void;
  showSettings?: boolean;
}

interface GophishTestResponse {
  version: string;
}

const GophishConnectionStatus: React.FC<GophishConnectionStatusProps> = ({ 
  onRetry, 
  showSettings = true 
}) => {
  const navigate = useNavigate();

  // Test the Gophish connection
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['gophishConnectionTest'],
    queryFn: async () => {
      const response = await apiService.testGophishConnection();
      return response.data as ApiResponse<GophishTestResponse>;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    refetch();
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  if (isLoading) {
    return null;
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gophish Connection Error</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            Could not connect to the Gophish API. Please check your API settings and ensure the Gophish server is running.
          </p>
          <div className="flex space-x-4 mt-2">
            <Button size="sm" variant="destructive" onClick={handleRetry}>
              Retry Connection
            </Button>
            {showSettings && (
              <Button size="sm" variant="outline" onClick={goToSettings}>
                Check API Settings
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (data?.status === 'success') {
    return (
      <Alert className="mb-4">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>Connected to Gophish API</AlertTitle>
        <AlertDescription>
          Successfully connected to Gophish API (v{data.data?.version || 'Unknown'})
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default GophishConnectionStatus; 