import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Users, Star, Clock, Phone, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorised",
        description: "You need to log in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", { date: new Date().toISOString().split('T')[0] }],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen salon-gradient">
      <Sidebar />
      
      {/* Mobile top padding to account for mobile menu button */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {/* Beautiful Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-yellow-400 p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8 mx-2 sm:mx-4 lg:mx-0 rounded-xl lg:rounded-none">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Estética Pro</h1>
            <p className="text-primary-foreground/90 text-base md:text-lg">Your professional beauty management system</p>
          </div>
          <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-yellow-300/30 rounded-full -translate-y-4 md:-translate-y-8 translate-x-4 md:translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-16 md:w-24 h-16 md:h-24 bg-green-400/20 rounded-full translate-y-2 md:translate-y-4 -translate-x-2 md:-translate-x-4"></div>
        </div>
        
        <div className="px-2 sm:px-4 md:px-6 lg:px-8 pb-8 space-y-4 md:space-y-6 lg:space-y-8">
          {/* Elegant Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="beauty-card animate-fade-in">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Today's Appointments</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                      {statsLoading ? "..." : (stats as any)?.todayAppointments || 0}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl">
                    <Calendar className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-green-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="beauty-card animate-fade-in">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Daily Revenue</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                      NZ${statsLoading ? "..." : (stats as any)?.dailyRevenue || 0}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl">
                    <DollarSign className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="beauty-card animate-fade-in">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Clients</p>
                    <p className="text-3xl font-bold text-foreground">
                      {statsLoading ? "..." : (stats as any)?.totalClients || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl">
                    <Users className="w-8 h-8 text-green-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="beauty-card animate-fade-in">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Satisfaction Rate</p>
                    <p className="text-3xl font-bold text-foreground">98%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl">
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Today's Schedule and Quick Actions */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="beauty-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Today's Schedule</h3>
                  <Button className="rounded-btn bg-green-700 hover:bg-green-800 text-white">
                    View All
                  </Button>
                </div>
                <div className="space-y-4">
                  {appointmentsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center p-4 bg-accent/50 rounded-xl">
                            <div className="w-12 h-12 bg-muted rounded-full"></div>
                            <div className="ml-4 flex-1">
                              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : todayAppointments && (todayAppointments as any[]).length > 0 ? (
                    (todayAppointments as any[]).slice(0, 3).map((appointment, index) => (
                      <div key={index} className="flex items-center p-4 bg-accent/30 rounded-xl border border-accent/40 hover:bg-accent/40 transition-colors">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-green-700" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-foreground">{appointment.time || "10:00 AM"}</p>
                          <p className="text-sm text-muted-foreground">{appointment.service || "Facial Treatment"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{appointment.clientName || "Client"}</p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            Confirmed
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No appointments scheduled for today</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="beauty-card">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="rounded-btn h-20 bg-green-700 hover:bg-green-800 text-white flex flex-col items-center justify-center space-y-2">
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm">New Appointment</span>
                  </Button>
                  <Button className="rounded-btn h-20 bg-yellow-500 hover:bg-yellow-600 text-black flex flex-col items-center justify-center space-y-2">
                    <Users className="w-6 h-6" />
                    <span className="text-sm">Add Client</span>
                  </Button>
                  <Button className="rounded-btn h-20 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center justify-center space-y-2">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-sm">Record Payment</span>
                  </Button>
                  <Button className="rounded-btn h-20 bg-yellow-400 hover:bg-yellow-500 text-black flex flex-col items-center justify-center space-y-2">
                    <Phone className="w-6 h-6" />
                    <span className="text-sm">Send Message</span>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Professional Services Overview */}
          <section className="beauty-card">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Service Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-accent/30 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">✂️</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Hair Cut</p>
                  <p className="text-xs text-muted-foreground">Men & Women</p>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🎨</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Hair Colour</p>
                  <p className="text-xs text-muted-foreground">& Dye</p>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💆</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Hair Treatment</p>
                  <p className="text-xs text-muted-foreground">& Care</p>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💨</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Blow Dry</p>
                  <p className="text-xs text-muted-foreground">& Styling</p>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🔗</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Extensions</p>
                  <p className="text-xs text-muted-foreground">Hair & Lash</p>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💅</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Nail Care</p>
                  <p className="text-xs text-muted-foreground">Mani & Pedi</p>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Metrics */}
          <section className="beauty-card">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">+24%</p>
                  <p className="text-sm text-muted-foreground">Monthly Growth</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-secondary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">156</p>
                  <p className="text-sm text-muted-foreground">Completed Treatments</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">4.9</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}