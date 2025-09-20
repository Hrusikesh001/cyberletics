import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import ThemeSwitcher from './ThemeSwitcher';
import { useNavigate } from 'react-router-dom';

// Extend Tenant type for branding
interface TenantWithBranding {
  id: string;
  name: string;
  branding?: {
    logo?: string;
    color?: string;
  };
}

const Header: React.FC = () => {
  const { user, tenants, currentTenant, selectTenant, logout } = useAuth();
  const navigate = useNavigate();
  const tenant: TenantWithBranding | null = currentTenant;

  if (!user || !currentTenant) {
    return null;
  }

  return (
    <header className="border-b px-4 py-3 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={tenant?.branding?.logo || "/cyberletics-logo.png"}
            alt={(tenant?.name || "") + " Logo"}
            className="h-8 w-auto"
            style={{ maxWidth: 40 }}
          />
          <span className="font-semibold text-lg">{tenant?.name}</span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Tenant Selector */}
          {tenants.length > 1 && (
            <div className="min-w-[180px]">
              <Select 
                value={currentTenant.id} 
                onValueChange={selectTenant}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Theme Switcher */}
          <ThemeSwitcher />
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="flex items-center justify-center rounded-full bg-muted h-8 w-8">
                  <User className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">Role: {user.role}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header; 