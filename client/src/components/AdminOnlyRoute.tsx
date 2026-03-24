import { useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

/**
 * Component that redirects staff users to /appointments
 * Only admin users can access the wrapped content
 */
export function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user is staff with limited access (accessLevel 'staff')
      const isStaff = (user as any)?.userType === 'staff' && (user as any)?.accessLevel === 'staff';
      
      if (isStaff) {
        // Redirect staff to appointments page
        setLocation('/appointments');
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  // Check if user is staff with limited access (accessLevel 'staff')
  const isStaff = (user as any)?.userType === 'staff' && (user as any)?.accessLevel === 'staff';
  
  if (isStaff) {
    // Show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Admin can access
  return <>{children}</>;
}

