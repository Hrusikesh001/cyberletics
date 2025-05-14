// Generic API response interface
export interface ApiResponse<T> {
  status: 'success' | 'error' | 'partial_success';
  message?: string;
  data: T;
}

// Campaign interfaces
export interface CampaignTemplate {
  id: string;
  name: string;
}

export interface CampaignPage {
  id: string;
  name: string;
}

export interface CampaignSmtp {
  id: string;
  name: string;
}

export interface CampaignStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  submitted: number;
  reported: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  created_date: string;
  launch_date: string;
  send_by_date?: string;
  completed_date?: string;
  template: CampaignTemplate;
  page: CampaignPage;
  smtp: CampaignSmtp;
  url: string;
  stats: CampaignStats;
}

export interface CampaignListResponse {
  data: Campaign[];
}

// Campaign Result interfaces
export interface CampaignResult {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  status: string;
  ip?: string;
  latitude?: number;
  longitude?: number;
  sendDate?: string;
  openDate?: string;
  clickDate?: string;
  submitDate?: string;
  reportDate?: string;
}

export interface CampaignResultsResponse {
  data: CampaignResult[];
}

// SMTP Profile interfaces
export interface SmtpProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  from_address: string;
  ignore_cert_errors: boolean;
  headers?: Record<string, string>;
  is_default?: boolean;
}

export interface SmtpProfilesResponse {
  data: SmtpProfile[];
}

// Template interfaces
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  text: string;
  html: string;
  modified_date: string;
  attachments?: any[];
}

export interface TemplatesResponse {
  data: EmailTemplate[];
}

// Landing Page interfaces
export interface LandingPage {
  id: string;
  name: string;
  html: string;
  modified_date: string;
  capture_credentials: boolean;
  capture_passwords: boolean;
  redirect_url?: string;
}

export interface LandingPagesResponse {
  data: LandingPage[];
}

// User Group interfaces
export interface TargetUser {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
}

export interface UserGroup {
  id: string;
  name: string;
  targets: TargetUser[];
  modified_date: string;
}

export interface UserGroupsResponse {
  data: UserGroup[];
}

// Webhook Event interfaces
export interface WebhookEvent {
  event: 'email_opened' | 'link_clicked' | 'form_submitted' | 'email_reported';
  email: string;
  campaignId: string;
  campaignName?: string;
  userId?: string;
  details?: {
    message?: string;
    payload?: any;
  };
  ip?: string;
  userAgent?: string;
  timestamp: Date | string;
}

export interface WebhookEventsPaginationInfo {
  total: number;
  offset: number;
  limit: number;
}

export interface WebhookEventsResponse {
  events: WebhookEvent[];
  pagination: WebhookEventsPaginationInfo;
}

// Status type for the status badge component
export type StatusType = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'canceled'
  | 'sending'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'submitted'
  | 'reported'; 