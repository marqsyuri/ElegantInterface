import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { AdminOnlyRoute } from "@/components/AdminOnlyRoute";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import Clients from "@/pages/Clients";
import Clinical from "@/pages/Clinical";
import Financial from "@/pages/Financial";
import Communication from "@/pages/Communication";
import Campaigns from "@/pages/Campaigns";
import Materials from "@/pages/Materials";
import Products from "@/pages/Products";
import Procedures from "@/pages/Procedures";
import Loyalty from "@/pages/Loyalty";
import Settings from "@/pages/Settings";
import Staff from "@/pages/Staff";
import Marketing from "@/pages/Marketing";
import Analytics from "@/pages/Analytics";
import ClientAccess from "@/pages/ClientAccess";
import ClientBooking from "@/pages/ClientBooking";
import Packages from "@/pages/Packages";
import Payslip from "@/pages/Payslip";
import Sales from "@/pages/Sales";
import Vouchers from "@/pages/Vouchers";
import Reports from "@/pages/Reports";
import FinancialDashboard from "@/pages/FinancialDashboard";

import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // FORÇA: Verificar se é staff e redirecionar para /appointments
  useEffect(() => {
    if (!isLoading && user) {
      const userType = (user as any)?.userType;
      const accessLevel = (user as any)?.accessLevel;
      const hasName = !!(user as any)?.name;
      const hasFirstName = !!(user as any)?.firstName;
      
      // Verificar se é staff: userType === 'staff' OU tem name sem firstName
      const isStaff = (userType === 'staff' && accessLevel === 'staff') || 
                      (hasName && !hasFirstName);
      
      
      // Se for staff, redirecionar para /appointments se não estiver lá
      if (isStaff && location !== '/appointments') {
        setLocation('/appointments');
      }
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <Switch>
      {/* Public client access routes - no authentication required */}
      {/* More specific route first */}
      <Route path="/client/:publicLink/booking" component={ClientBooking} />
      <Route path="/client/:publicLink" component={ClientAccess} />
      
      {isLoading ? (
        <Route path="/">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <p>Carregando...</p>
            </div>
          </div>
        </Route>
      ) : !user ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Appointments - accessible by both admin and staff */}
          <Route path="/appointments" component={Appointments} />
          
          {/* Dashboard - only for admin, staff redirected to appointments */}
          <Route path="/" component={Dashboard} />
          
          {/* Admin-only routes - redirect staff to appointments */}
          <Route path="/clients" component={() => <AdminOnlyRoute><Clients /></AdminOnlyRoute>} />
          <Route path="/clinical" component={() => <AdminOnlyRoute><Clinical /></AdminOnlyRoute>} />
          <Route path="/financial" component={() => <AdminOnlyRoute><Financial /></AdminOnlyRoute>} />
          <Route path="/communication" component={() => <AdminOnlyRoute><Communication /></AdminOnlyRoute>} />
          <Route path="/campaigns" component={() => <AdminOnlyRoute><Campaigns /></AdminOnlyRoute>} />
          <Route path="/materials" component={() => <AdminOnlyRoute><Materials /></AdminOnlyRoute>} />
          <Route path="/products" component={() => <AdminOnlyRoute><Products /></AdminOnlyRoute>} />
          <Route path="/procedures" component={() => <AdminOnlyRoute><Procedures /></AdminOnlyRoute>} />
          <Route path="/loyalty" component={() => <AdminOnlyRoute><Loyalty /></AdminOnlyRoute>} />
          <Route path="/packages" component={() => <AdminOnlyRoute><Packages /></AdminOnlyRoute>} />
          <Route path="/staff" component={() => <AdminOnlyRoute><Staff /></AdminOnlyRoute>} />
          <Route path="/marketing" component={() => <AdminOnlyRoute><Marketing /></AdminOnlyRoute>} />
          <Route path="/analytics" component={() => <AdminOnlyRoute><Analytics /></AdminOnlyRoute>} />
          <Route path="/payslip" component={() => <AdminOnlyRoute><Payslip /></AdminOnlyRoute>} />
          <Route path="/sales" component={() => <AdminOnlyRoute><Sales /></AdminOnlyRoute>} />
          <Route path="/vouchers" component={() => <AdminOnlyRoute><Vouchers /></AdminOnlyRoute>} />
          <Route path="/reports" component={() => <AdminOnlyRoute><Reports /></AdminOnlyRoute>} />
          <Route path="/financial-dashboard" component={() => <AdminOnlyRoute><FinancialDashboard /></AdminOnlyRoute>} />
          <Route path="/settings" component={() => <AdminOnlyRoute><Settings /></AdminOnlyRoute>} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>
          <TooltipProvider>
            <SidebarProvider>
              <Toaster />
              <Router />
            </SidebarProvider>
          </TooltipProvider>
        </LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
