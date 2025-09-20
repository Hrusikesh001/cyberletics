import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Send, FileText, Users, Mail, BarChart, Settings, User, ChevronLeft, ChevronRight, Shield, GraduationCap, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Send
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: FileText
  },
  {
    name: 'Landing Pages',
    href: '/landing-pages',
    icon: Shield
  },
  {
    name: 'Groups',
    href: '/groups',
    icon: Users
  },
  {
    name: 'SMTP Profiles',
    href: '/smtp-profiles',
    icon: Mail
  },
  {
    name: 'Users',
    href: '/users',
    icon: User
  },
  {
    name: 'Training',
    href: '/training',
    icon: GraduationCap,
    submenu: [
      {
        name: 'Reports',
        href: '/training/reports'
      }
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  }
];

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <aside className={cn(
      "bg-gray-900 text-white transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex items-center p-4">
        {/* Logo */}
        <div className={cn(
          "flex items-center flex-1", // Allow flex-1 to take space
          collapsed ? "justify-center" : "" // Center item when collapsed
        )}>
          <img
            src="/cyberletics-logo.png"
            alt="Cyberletics Logo"
            className={cn(
              "h-8 w-auto",
              collapsed ? "" : "mr-2" // No margin when collapsed, add margin when expanded
            )}
            style={{ maxWidth: 32 }}
          />
        </div>
        {/* Collapse button */}
        <button 
          onClick={toggleCollapse}
          className={cn(
            "p-1 rounded text-white hover:bg-gray-700 transition-all",
            collapsed ? "mx-auto" : "ml-auto" // Center button when collapsed, move to right when expanded
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.submenu && item.submenu.some(subItem => location.pathname === subItem.href));
            
            return (
              <li key={item.name} className="mb-1">
                {item.submenu ? (
                  <div>
                    <div className={cn(
                      "flex items-center px-4 py-2 cursor-pointer",
                      isActive ? "bg-gray-800" : "hover:bg-gray-800"
                    )}>
                      <item.icon size={20} className="mr-3" />
                      <span className={cn(
                        "text-sm font-medium transition-opacity duration-300",
                        collapsed ? "opacity-0 hidden" : "opacity-100"
                      )}>
                        {item.name}
                      </span>
                    </div>
                    {!collapsed && (
                      <ul className="pl-10 py-1">
                        {item.submenu.map(subItem => {
                          const isSubActive = location.pathname === subItem.href;
                          return (
                            <li key={subItem.name}>
                              <Link
                                to={subItem.href}
                                className={cn(
                                  "text-sm block py-1.5 px-2 rounded",
                                  isSubActive ? "bg-gray-700" : "hover:bg-gray-700"
                                )}
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-4 py-2",
                      isActive ? "bg-gray-800" : "hover:bg-gray-800"
                    )}
                  >
                    <item.icon size={20} className="mr-3" />
                    <span className={cn(
                      "text-sm font-medium transition-opacity duration-300",
                      collapsed ? "opacity-0 hidden" : "opacity-100"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className={cn(
            "flex items-center w-full px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 rounded transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={20} className={cn("mr-3", collapsed && "mr-0")} />
          <span className={cn(
            "transition-opacity duration-300",
            collapsed ? "opacity-0 hidden" : "opacity-100"
          )}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
