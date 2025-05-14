import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'scheduled' 
  | 'success' 
  | 'error' 
  | 'active' 
  | 'inactive'
  | 'in_progress'
  | 'canceled'
  | 'sending'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'submitted'
  | 'reported';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, children }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'running':
      case 'in_progress':
        return 'status-badge-running';
      case 'completed':
      case 'success':
      case 'active':
        return 'status-badge-completed';
      case 'failed':
      case 'error':
      case 'inactive':
      case 'canceled':
        return 'status-badge-failed';
      case 'scheduled':
        return 'bg-cyber-warning/20 text-cyber-warning';
      case 'sent':
        return 'bg-blue-500/20 text-blue-500';
      case 'opened':
        return 'bg-amber-500/20 text-amber-500';
      case 'clicked':
        return 'bg-orange-500/20 text-orange-500';
      case 'submitted':
        return 'bg-green-500/20 text-green-500';
      case 'reported':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <span className={cn("status-badge", getStatusClasses(), className)}>
      {(status === 'running' || status === 'in_progress') && <span className="pulse-dot mr-1"></span>}
      {children || (status.charAt(0).toUpperCase() + status.slice(1))}
    </span>
  );
};
