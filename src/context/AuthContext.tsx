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
          // Create direct axios call since we don't have an endpoint in apiService yet
          const api = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Fetch current user data
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setTenants(response.data.tenants || []);
          
          // Set current tenant if it exists in localStorage
          const savedTenantId = localStorage.getItem('current_tenant_id');
          if (savedTenantId && response.data.tenants) {
            const tenant = response.data.tenants.find((t: Tenant) => t.id === savedTenantId);
            if (tenant) {
              setCurrentTenant(tenant);
            } else if (response.data.tenants.length > 0) {
              // Default to first tenant if saved tenant not found
              setCurrentTenant(response.data.tenants[0]);
              localStorage.setItem('current_tenant_id', response.data.tenants[0].id);
            }
          } else if (response.data.tenants && response.data.tenants.length > 0) {
            // No saved tenant, default to first one
            setCurrentTenant(response.data.tenants[0]);
            localStorage.setItem('current_tenant_id', response.data.tenants[0].id);
          }
          
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid or expired
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
      // Create direct axios call since we don't have an endpoint in apiService yet
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const response = await api.post('/auth/login', { email, password });
      const { token, user, tenants } = response.data;
      
      localStorage.setItem('auth_token', token);
      setUser(user);
      setTenants(tenants || []);
      setIsAuthenticated(true);
      
      // Set default tenant
      if (tenants && tenants.length > 0) {
        setCurrentTenant(tenants[0]);
        localStorage.setItem('current_tenant_id', tenants[0].id);
      }
      
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

  const value = {
    user,
    tenants,
    currentTenant,
    isAuthenticated,
    isLoading,
    login,
    logout,
    selectTenant
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