import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { LocaleProvider } from "@/contexts/LocaleContext";

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

import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

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
          <Route path="/" component={Dashboard} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/clients" component={Clients} />
          <Route path="/clinical" component={Clinical} />
          <Route path="/financial" component={Financial} />
          <Route path="/communication" component={Communication} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/materials" component={Materials} />
          <Route path="/products" component={Products} />
          <Route path="/procedures" component={Procedures} />
          <Route path="/loyalty" component={Loyalty} />
          <Route path="/packages" component={Packages} />
          <Route path="/staff" component={Staff} />
          <Route path="/marketing" component={Marketing} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/payslip" component={Payslip} />
          <Route path="/settings" component={Settings} />
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
