import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Send, FileText, Users, Mail, BarChart, Settings, User, ChevronLeft, ChevronRight, Shield, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className={cn(
          "font-bold text-xl text-white transition-opacity duration-300",
          collapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          Sentrifense
        </div>
        <button 
          onClick={toggleCollapse}
          className={cn(
            "p-1 rounded text-white hover:bg-gray-700 transition-all ml-auto",
            collapsed && "mx-auto"
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
    </aside>
  );
};

export default Sidebar;
