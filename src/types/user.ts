// User types for the frontend application
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super-admin' | 'admin' | 'user';
  tenants: UserTenant[];
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserTenant {
  tenantId: string;
  tenantName?: string;
  role: 'admin' | 'user';
}

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  role?: 'super-admin' | 'admin' | 'user';
  tenantId?: string;
  tenantRole?: 'admin' | 'user';
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  role?: 'super-admin' | 'admin' | 'user';
  isActive?: boolean;
}

export interface UserPasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export interface UserPasswordResetInput {
  token: string;
  newPassword: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    superAdmin: number;
    admin: number;
    user: number;
  };
} 