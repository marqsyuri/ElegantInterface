import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { SidebarProvider } from "@/contexts/SidebarContext";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import Clients from "@/pages/Clients";
import Clinical from "@/pages/Clinical";
import Financial from "@/pages/Financial";
import Communication from "@/pages/Communication";
import Materials from "@/pages/Materials";
import Procedures from "@/pages/Procedures";
import Loyalty from "@/pages/Loyalty";
import Settings from "@/pages/Settings";
import Staff from "@/pages/Staff";
import Marketing from "@/pages/Marketing";
import Analytics from "@/pages/Analytics";
import ClientAccess from "@/pages/ClientAccess";
import ClientBooking from "@/pages/ClientBooking";

import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public client access routes - no authentication required */}
      <Route path="/client/:publicLink" component={ClientAccess} />
      <Route path="/client/:publicLink/booking" component={ClientBooking} />
      
      {isLoading || !user ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/clients" component={Clients} />
          <Route path="/clinical" component={Clinical} />
          <Route path="/financial" component={Financial} />
          <Route path="/communication" component={Communication} />
          <Route path="/materials" component={Materials} />
          <Route path="/procedures" component={Procedures} />
          <Route path="/loyalty" component={Loyalty} />
          <Route path="/staff" component={Staff} />
          <Route path="/marketing" component={Marketing} />
          <Route path="/analytics" component={Analytics} />

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
        <TooltipProvider>
          <SidebarProvider>
            <Toaster />
            <Router />
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
