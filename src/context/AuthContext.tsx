import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '@/lib/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  selectTenant: (tenantId: string) => void;
  register: (email: string, password: string, tenantName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Initialize auth state from JWT
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const api = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          // Fetch current user and tenant data
          const response = await api.get<{ user: any; tenant: any }>('/auth/me');
          setUser(response.data.user);
          setTenants([response.data.tenant]);
          // Set current tenant if it exists in localStorage
          const savedTenantId = localStorage.getItem('current_tenant_id');
          if (savedTenantId && response.data.tenant) {
            if (response.data.tenant.id === savedTenantId) {
              setCurrentTenant(response.data.tenant);
            } else {
              setCurrentTenant(response.data.tenant);
              localStorage.setItem('current_tenant_id', response.data.tenant.id);
            }
          } else if (response.data.tenant) {
            setCurrentTenant(response.data.tenant);
            localStorage.setItem('current_tenant_id', response.data.tenant.id);
          }
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_tenant_id');
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const response = await api.post<{ token: string; user: any; tenant: any }>(
        '/auth/login',
        { email, password }
      );
      const { token, user, tenant } = response.data;
      localStorage.setItem('auth_token', token);
      setUser(user);
      setTenants([tenant]);
      setIsAuthenticated(true);
      setCurrentTenant(tenant);
      localStorage.setItem('current_tenant_id', tenant.id);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_tenant_id');
    setUser(null);
    setTenants([]);
    setCurrentTenant(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const selectTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      localStorage.setItem('current_tenant_id', tenantId);
      // Refresh data for the new tenant
      window.location.reload();
    }
  };

  const register = async (email: string, password: string, tenantName: string) => {
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const response = await api.post<{ token: string; user: any; tenant: any }>(
        '/auth/register-tenant',
        { email, password, tenantName }
      );
      const { token, user, tenant } = response.data;
      localStorage.setItem('auth_token', token);
      setUser(user);
      setTenants([tenant]);
      setCurrentTenant(tenant);
      setIsAuthenticated(true);
      localStorage.setItem('current_tenant_id', tenant.id);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      throw error;
    }
  };

  const value = {
    user,
    tenants,
    currentTenant,
    isAuthenticated,
    isLoading,
    login,
    logout,
    selectTenant,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 