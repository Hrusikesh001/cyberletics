import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "./components/layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CampaignsList from "./pages/campaigns/CampaignsList";
import CampaignDetail from "./pages/campaigns/CampaignDetail";
import TemplatesList from "./pages/templates/TemplatesList";
import LandingPagesList from "./pages/landing-pages/LandingPagesList";
import GroupsList from "./pages/groups/GroupsList";
import SMTPProfilesList from "./pages/smtp/SMTPProfilesList";
import UsersList from "./pages/users/UsersList";
import ReportsPage from "./pages/reports/ReportsPage";
import WebhooksPage from "./pages/webhooks/WebhooksPage";
import SettingsPage from "./pages/settings/SettingsPage";
import LoginPage from "./pages/auth/LoginPage";
import AuthCheck from "./components/auth/AuthCheck";
import { initSocket, disconnectSocket } from "@/lib/socket";
import { AuthProvider } from "@/context/AuthContext";

// Tenant management
import TenantsList from "./pages/tenants/TenantsList";
import TenantDetail from "./pages/tenants/TenantDetail";
import TenantUsers from "./pages/tenants/TenantUsers";
import NewTenant from "./pages/tenants/NewTenant";
import EditTenant from "./pages/tenants/EditTenant";

// User management
import UserDetail from "./pages/users/UserDetail";
import UserEdit from "./pages/users/UserEdit";

// Training modules
import TrainingReportsPage from "./pages/training/TrainingReportsPage";

// Create React Query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Socket connection manager component
const SocketManager = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Initialize socket when component mounts
    initSocket();
    
    // Disconnect socket when component unmounts
    return () => {
      disconnectSocket();
    };
  }, []);
  
  return null;
};

// Need to define the app routes separately from the AuthProvider
// because AuthProvider uses useNavigate which must be inside Router
const AppRoutes = () => (
  <>
    <SocketManager />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AuthCheck><MainLayout><Dashboard /></MainLayout></AuthCheck>} />
      
      {/* Campaigns */}
      <Route path="/campaigns" element={<AuthCheck><MainLayout><CampaignsList /></MainLayout></AuthCheck>} />
      <Route path="/campaigns/:id" element={<AuthCheck><MainLayout><CampaignDetail /></MainLayout></AuthCheck>} />
      
      {/* Templates and Resources */}
      <Route path="/templates" element={<AuthCheck><MainLayout><TemplatesList /></MainLayout></AuthCheck>} />
      <Route path="/landing-pages" element={<AuthCheck><MainLayout><LandingPagesList /></MainLayout></AuthCheck>} />
      <Route path="/groups" element={<AuthCheck><MainLayout><GroupsList /></MainLayout></AuthCheck>} />
      <Route path="/smtp-profiles" element={<AuthCheck><MainLayout><SMTPProfilesList /></MainLayout></AuthCheck>} />
      
      {/* Admin */}
      <Route path="/users" element={<AuthCheck><MainLayout><UsersList /></MainLayout></AuthCheck>} />
      <Route path="/users/:id" element={<AuthCheck><MainLayout><UserDetail /></MainLayout></AuthCheck>} />
      <Route path="/users/:id/edit" element={<AuthCheck><MainLayout><UserEdit /></MainLayout></AuthCheck>} />
      
      {/* Tenant Management */}
      <Route path="/tenants" element={<AuthCheck><MainLayout><TenantsList /></MainLayout></AuthCheck>} />
      <Route path="/tenants/new" element={<AuthCheck><MainLayout><NewTenant /></MainLayout></AuthCheck>} />
      <Route path="/tenants/:id" element={<AuthCheck><MainLayout><TenantDetail /></MainLayout></AuthCheck>} />
      <Route path="/tenants/:id/edit" element={<AuthCheck><MainLayout><EditTenant /></MainLayout></AuthCheck>} />
      <Route path="/tenants/:id/users" element={<AuthCheck><MainLayout><TenantUsers /></MainLayout></AuthCheck>} />
      
      {/* Training */}
      <Route path="/training/reports" element={<AuthCheck><MainLayout><TrainingReportsPage /></MainLayout></AuthCheck>} />
      
      {/* Reports and Analytics */}
      <Route path="/reports" element={<AuthCheck><MainLayout><ReportsPage /></MainLayout></AuthCheck>} />
      <Route path="/webhooks" element={<AuthCheck><MainLayout><WebhooksPage /></MainLayout></AuthCheck>} />
      
      {/* Settings */}
      <Route path="/settings" element={<AuthCheck><MainLayout><SettingsPage /></MainLayout></AuthCheck>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
