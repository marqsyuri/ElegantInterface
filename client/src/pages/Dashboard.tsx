import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Users, Star, Clock, Phone, CheckCircle, TrendingUp, UserPlus, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Banner } from "@shared/schema";
import { useLocale } from "@/contexts/LocaleContext";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { formatCurrency, t } = useLocale();

  // This component should only render when user is authenticated
  // The App.tsx routing already handles redirection

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Fetch staff to get their photos and names
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
    retry: false,
  });

  // Use useMemo to ensure date is stable and doesn't change on every render
  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const { data: todayAppointments = [], isLoading: appointmentsLoading, error: appointmentsError } = useQuery({
    queryKey: ["/api/appointments", today],
    queryFn: async () => {
      try {
        // Use the same URL format as Appointments page
        const url = `/api/appointments/${today}`;
        console.log('🔍 Dashboard: Fetching today appointments from:', url, 'Date:', today);
        
        const response = await fetch(url, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Dashboard: API error response:', response.status, errorText);
          throw new Error(`Failed to fetch appointments: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Dashboard: API response received:', {
          date: today,
          dataLength: Array.isArray(data) ? data.length : 'not array',
          dataType: typeof data,
          data: Array.isArray(data) ? data.slice(0, 3).map((a: any) => ({
            id: a.id,
            date: a.appointmentDate,
            client: a.client?.name,
            status: a.status,
            staffId: a.staffId
          })) : data
        });
        
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('❌ Dashboard: Error fetching today appointments:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Group appointments by staff member
  const staffAppointmentsCount = useMemo(() => {
    console.log('🔍 Calculating staff appointments count:', {
      todayAppointmentsLength: Array.isArray(todayAppointments) ? todayAppointments.length : 'not array',
      staffLength: Array.isArray(staff) ? staff.length : 'not array',
      appointmentsWithStaffId: Array.isArray(todayAppointments) ? todayAppointments.filter((a: any) => a.staffId).length : 0,
      sampleAppointments: Array.isArray(todayAppointments) ? todayAppointments.slice(0, 3).map((a: any) => ({
        id: a.id,
        staffId: a.staffId,
        date: a.appointmentDate
      })) : [],
      sampleStaff: Array.isArray(staff) ? staff.slice(0, 3).map((s: any) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive
      })) : []
    });

    if (!Array.isArray(todayAppointments) || !Array.isArray(staff)) {
      console.log('⚠️ Missing data - returning empty array');
      return [];
    }

    // Create a map of staffId -> appointment count
    const countMap = new Map<number, number>();
    
    todayAppointments.forEach((apt: any) => {
      const staffId = apt.staffId;
      if (staffId) {
        countMap.set(staffId, (countMap.get(staffId) || 0) + 1);
      }
    });

    console.log('📊 Count map:', Array.from(countMap.entries()));

    // Create array with staff and their counts
    const result = staff
      .filter((s: any) => {
        const hasAppointments = countMap.has(s.id);
        const isActive = s.isActive !== false; // Consider undefined/null as active
        console.log(`Staff ${s.id} (${s.name}): isActive=${isActive}, hasAppointments=${hasAppointments}`);
        return isActive && hasAppointments;
      })
      .map((s: any) => ({
        ...s,
        appointmentCount: countMap.get(s.id) || 0,
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount); // Sort by most appointments

    console.log('👥 Staff appointments count result:', result);
    return result;
  }, [todayAppointments, staff]);

  // Debug useEffect
  useEffect(() => {
    console.log('📊 Dashboard appointments state:', {
      isLoading: appointmentsLoading,
      hasError: !!appointmentsError,
      error: appointmentsError,
      appointmentsCount: Array.isArray(todayAppointments) ? todayAppointments.length : 'not array',
      today: today,
      staffAppointmentsCount: staffAppointmentsCount.length,
      appointments: todayAppointments
    });
  }, [todayAppointments, appointmentsLoading, appointmentsError, today, staffAppointmentsCount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
        {/* Overview Header */}
        <div className="bg-white border border-border p-4 md:p-6 lg:p-8 mb-6 md:mb-8 mx-2 sm:mx-4 lg:mx-0 rounded-xl lg:rounded-none shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Estética Pro</h1>
              <p className="text-muted-foreground text-base md:text-lg">{t('client_management')}</p>
            </div>
            <NotificationBell className="!w-12 !h-12 sm:!w-14 sm:!h-14 text-white !bg-gradient-to-br !from-pink-500 !to-rose-500 shadow-lg hover:shadow-rose-400/40 border-none" />
          </div>

          {user?.dashboardBannerUrl && user.dashboardBannerUrl.trim() !== "" && (
            <div className="relative overflow-hidden rounded-2xl min-h-[120px] md:min-h-[160px] max-h-[220px]">
              <img
                src={user.dashboardBannerUrl}
                alt="Dashboard banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <div className="px-2 sm:px-4 md:px-6 lg:px-8 pb-8 space-y-4 md:space-y-6 lg:space-y-8">
          {/* Elegant Stats Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="beauty-card animate-fade-in">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('todays_appointments')}</p>
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
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('daily_revenue')}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                      {statsLoading ? "..." : formatCurrency(parseFloat((stats as any)?.dailyRevenue || "0"))}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <DollarSign className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="beauty-card animate-fade-in">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('total_clients')}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                      {statsLoading ? "..." : (stats as any)?.totalClients || 0}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-green-50 rounded-2xl border border-green-100">
                    <Users className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-green-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="beauty-card animate-fade-in">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{t('satisfaction_rate')}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">98%</p>
                  </div>
                  <div className="p-3 md:p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <Star className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Today's Schedule and Quick Actions */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="beauty-card border-t-2 border-b-2 border-green-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">{t('todays_schedule')}</h3>
                  <Button 
                    onClick={() => setLocation("/appointments")}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {t('view_all')}
                  </Button>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {appointmentsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center p-4 bg-accent/50 rounded-xl">
                            <div className="w-16 h-16 bg-muted rounded-full"></div>
                            <div className="ml-4 flex-1">
                              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-1/4"></div>
                            </div>
                            <div className="w-12 h-12 bg-muted rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : staffAppointmentsCount.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {staffAppointmentsCount.map((staffMember: any) => {
                        const getInitials = (name: string) => {
                          return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        };

                        return (
                          <div 
                            key={staffMember.id} 
                            className="flex items-center p-4 bg-gradient-to-br from-white to-accent/20 rounded-xl border border-accent/40 hover:border-primary/60 hover:shadow-md transition-all duration-200"
                          >
                            <Avatar className="w-16 h-16 border-2 border-primary/20">
                              <AvatarImage src={staffMember.profileImageUrl || staffMember.user?.profileImageUrl} />
                              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white text-lg font-semibold">
                                {getInitials(staffMember.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-base truncate" title={staffMember.name}>
                                {staffMember.name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                {staffMember.role}
                              </p>
                            </div>
                            <div className="ml-4 flex flex-col items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">
                                  {staffMember.appointmentCount}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                {staffMember.appointmentCount === 1 ? 'agendamento' : 'agendamentos'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('no_appointments_today')}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Data consultada: {today}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="beauty-card">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">{t('quick_actions')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <Button 
                    onClick={() => setLocation("/appointments")}
                    variant="secondary"
                    className="h-auto min-h-[80px] sm:min-h-[100px] p-3 sm:p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">{t('new_appointment')}</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation("/clients")}
                    variant="secondary"
                    className="h-auto min-h-[80px] sm:min-h-[100px] p-3 sm:p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">{t('add_client')}</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation("/financial")}
                    variant="secondary"
                    className="h-auto min-h-[80px] sm:min-h-[100px] p-3 sm:p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">{t('record_payment')}</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation("/communication")}
                    variant="secondary"
                    className="h-auto min-h-[80px] sm:min-h-[100px] p-3 sm:p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">{t('send_message')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Professional Services Overview */}
          <section className="beauty-card">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">{t('service_categories')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-lg sm:text-xl">✂️</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{t('hair_cut')}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{t('hair_cut_subtitle')}</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-lg sm:text-xl">🎨</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{t('hair_colour')}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{t('hair_colour_subtitle')}</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-lg sm:text-xl">💆</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{t('hair_treatment')}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{t('hair_treatment_subtitle')}</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-lg sm:text-xl">💨</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{t('blow_dry')}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{t('blow_dry_subtitle')}</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-lg sm:text-xl">🔗</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{t('extensions')}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{t('extensions_subtitle')}</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-card border border-border rounded-xl hover:bg-accent/20 transition-colors cursor-pointer">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-lg sm:text-xl">💅</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">{t('nail_care')}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{t('nail_care_subtitle')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Metrics */}
          <section className="beauty-card">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">{t('performance_overview')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-700" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">+24%</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('monthly_growth')}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">156</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('completed_treatments')}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Star className="w-6 h-6 sm:w-8 sm:h-8 text-green-700" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mb-1">4.9</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('average_rating')}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
    </PageLayout>
  );
}