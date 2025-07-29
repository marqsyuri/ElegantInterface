import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Users, Star, Clock, Phone, CheckCircle, TrendingUp, UserPlus, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  const today = new Date().toISOString().split('T')[0];
  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", "today"],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return response.json();
    },
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <PageLayout>
        {/* Beautiful Header */}
        <div className="bg-white border border-border p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8 mx-2 sm:mx-4 lg:mx-0 rounded-xl lg:rounded-none shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Estética Pro</h1>
            <p className="text-muted-foreground text-base md:text-lg">Your professional beauty management system</p>
          </div>
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
                  <div className="p-3 md:p-4 bg-green-50 rounded-2xl border border-green-100">
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
                      NZ${statsLoading ? "..." : parseFloat((stats as any)?.dailyRevenue || "0").toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
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
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
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
                  <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
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
                  <Button 
                    onClick={() => setLocation("/appointments")}
                    className="rounded-btn bg-green-50 border border-green-200 hover:bg-green-100 text-green-700"
                  >
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
                        <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-green-700" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-foreground">
                            {new Date(appointment.appointmentDate).toLocaleTimeString('en-NZ', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">{appointment.service?.name || "Service"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{appointment.client?.name || "Client"}</p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 border border-green-100 text-green-700">
                            {appointment.status || "scheduled"}
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
                  <Button className="rounded-btn h-20 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 flex flex-col items-center justify-center space-y-2">
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm font-medium">New Appointment</span>
                  </Button>
                  <Button className="rounded-btn h-20 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-700 flex flex-col items-center justify-center space-y-2">
                    <Users className="w-6 h-6" />
                    <span className="text-sm font-medium">Add Client</span>
                  </Button>
                  <Button className="rounded-btn h-20 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 flex flex-col items-center justify-center space-y-2">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-sm font-medium">Record Payment</span>
                  </Button>
                  <Button className="rounded-btn h-20 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-700 flex flex-col items-center justify-center space-y-2">
                    <Phone className="w-6 h-6" />
                    <span className="text-sm font-medium">Send Message</span>
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
                <div className="text-center p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">✂️</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Hair Cut</p>
                  <p className="text-xs text-muted-foreground">Men & Women</p>
                </div>
                <div className="text-center p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🎨</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Hair Colour</p>
                  <p className="text-xs text-muted-foreground">& Dye</p>
                </div>
                <div className="text-center p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💆</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Hair Treatment</p>
                  <p className="text-xs text-muted-foreground">& Care</p>
                </div>
                <div className="text-center p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">💨</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Blow Dry</p>
                  <p className="text-xs text-muted-foreground">& Styling</p>
                </div>
                <div className="text-center p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🔗</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">Extensions</p>
                  <p className="text-xs text-muted-foreground">Hair & Lash</p>
                </div>
                <div className="text-center p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
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
                  <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-700" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">+24%</p>
                  <p className="text-sm text-muted-foreground">Monthly Growth</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">156</p>
                  <p className="text-sm text-muted-foreground">Completed Treatments</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-green-700" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">4.9</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </div>
          </section>
        </div>
    </PageLayout>
  );
}