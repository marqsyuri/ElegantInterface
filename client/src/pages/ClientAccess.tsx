import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, MessageCircle, ArrowLeft, LogOut, Calendar, Clock, User, DollarSign, Scissors, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CompanyInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicWhatsapp?: string;
  profileImageUrl?: string;
  heroImageUrl?: string;
  id: number;
}

interface ClientInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  salonId: number;
  loyaltyPoints: number;
  lastLogin: string;
}

interface Appointment {
  id: number;
  appointmentDate: string;
  status: string;
  notes?: string;
  totalPrice: string;
  totalDuration: number;
  procedureCount: number;
  staffId?: number;
  createdAt: string;
  staff?: { id: number; name: string };
  procedures: Array<{
    id: number;
    procedureName: string;
    procedureCategory: string;
    price: string;
    duration: number;
    order: number;
  }>;
}

type ViewMode = "home" | "login" | "register" | "dashboard";

export default function ClientAccess() {
  const { publicLink } = useParams<{ publicLink: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

  // Fetch company info
  const { data: company, isLoading: companyLoading } = useQuery<CompanyInfo>({
    queryKey: [`/api/public/company/${publicLink}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/company/${publicLink}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
    enabled: !!publicLink,
    retry: false,
  });

  // Check if client is logged in
  const { data: client, isLoading: clientLoading, refetch: refetchClient } = useQuery<ClientInfo>({
    queryKey: ["/api/client/me"],
    queryFn: async () => {
      const res = await fetch('/api/client/me', { credentials: 'include' });
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    },
    retry: false,
    enabled: !!publicLink,
  });

  // Fetch appointments when in dashboard mode and client is logged in
  const { data: appointments = [], refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/client/appointments"],
    queryFn: async () => {
      const res = await fetch('/api/client/appointments', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    },
    enabled: viewMode === "dashboard" && !!client,
    retry: false,
  });

  // Auto-redirect to dashboard if logged in
  useEffect(() => {
    if (client && viewMode === "home") {
      setViewMode("dashboard");
    }
  }, [client, viewMode]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch(`/api/client/login/${publicLink}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }
      return res.json();
    },
    onSuccess: () => {
      refetchClient();
      setViewMode("dashboard");
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; password: string }) => {
      const res = await fetch(`/api/client/register/${publicLink}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account created",
        description: "Redirecting to login...",
      });
      setTimeout(() => {
        setViewMode("login");
        setRegisterForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/client/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Logout failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/client/me"], null);
      setViewMode("home");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await fetch(`/api/client/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to cancel appointment');
      }
      return res.json();
    },
    onSuccess: () => {
      refetchAppointments();
      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate({
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
    });
  };

  const handleCancelAppointment = (id: number) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointmentMutation.mutate(id);
    }
  };

  // Check password match
  useEffect(() => {
    if (registerForm.confirmPassword) {
      setPasswordMatch(registerForm.password === registerForm.confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [registerForm.password, registerForm.confirmPassword]);

  if (companyLoading || clientLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-slate-600 mb-4">Company not found or link is invalid.</p>
          <p className="text-sm text-slate-500">Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => new Date(apt.appointmentDate) >= now);
  const pastAppointments = appointments.filter(apt => new Date(apt.appointmentDate) < now);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
      confirmed: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle },
      scheduled: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
      completed: { bg: "bg-slate-100", text: "text-slate-700", icon: CheckCircle },
      cancelled: { bg: "bg-red-100", text: "text-red-700", icon: X },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section with Background Image */}
      {company.heroImageUrl && (
        <div className="relative h-64 bg-slate-200 overflow-hidden">
          <img 
            src={company.heroImageUrl} 
            alt={company.clinicName || 'Salon'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full max-w-2xl mx-auto px-4 pb-6 text-white">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                {company.clinicName || 'Beauty Salon'}
              </h1>
              {company.clinicAddress && (
                <div className="flex items-center text-white/90">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{company.clinicAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`${company.heroImageUrl ? '' : 'bg-gradient-to-r from-pink-600 to-rose-600'} text-white`}>
        <div className="max-w-2xl mx-auto px-4 py-6 relative">
          {viewMode !== "home" && (
            <button
              onClick={() => {
                if (client) {
                  setViewMode("dashboard");
                } else {
                  setViewMode("home");
                }
              }}
              className="absolute left-4 top-6 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          {viewMode === "dashboard" && client && (
            <button
              onClick={() => logoutMutation.mutate()}
              className="absolute right-4 top-6 bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4 inline mr-1" />
              Logout
            </button>
          )}

          <div className="text-center">
            {!company.heroImageUrl && (
              <>
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {company.clinicName || 'Beauty Salon'}
                </h1>
                {company.clinicAddress && (
                  <div className="flex items-center justify-center text-white/90 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{company.clinicAddress}</span>
                  </div>
                )}
              </>
            )}
            
            {viewMode === "home" && (
              <p className="mt-4 text-white/90">Welcome to our booking portal</p>
            )}
            {viewMode === "login" && (
              <>
                <h2 className="text-2xl font-semibold mt-2">Welcome Back</h2>
                <p className="text-sm text-white/90 mt-1">Login to manage your appointments</p>
              </>
            )}
            {viewMode === "register" && (
              <>
                <h2 className="text-2xl font-semibold mt-2">Create Account</h2>
                <p className="text-sm text-white/90 mt-1">Join us and manage your appointments easily</p>
              </>
            )}
            {viewMode === "dashboard" && client && (
              <>
                <h2 className="text-2xl font-semibold mt-2">My Appointments</h2>
                <p className="text-sm text-white/90 mt-1">Welcome back, {client.name}!</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Home View */}
        {viewMode === "home" && (
          <>
            <Card className="mb-4">
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-medium text-slate-900 mb-4">
                  Book Your Appointment
                </h2>
                <p className="text-slate-600 mb-6">
                  Select from our professional beauty services and choose your preferred time.
                </p>
                
                <Link href={`/client/${publicLink}/booking`}>
                  <Button className="w-full py-3 text-lg font-medium bg-pink-600 hover:bg-pink-700">
                    Select Services
                  </Button>
                </Link>

                {!client && (
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setViewMode("login")}
                    >
                      Login to My Account
                    </Button>
                    <p className="text-sm text-slate-500">
                      Don't have an account?{" "}
                      <button
                        onClick={() => setViewMode("register")}
                        className="text-pink-600 hover:text-pink-700 font-medium"
                      >
                        Register
                      </button>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            {(company.clinicPhone || company.clinicWhatsapp) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-slate-900 mb-3">Contact Us</h3>
                  <div className="space-y-2">
                    {company.clinicPhone && (
                      <div className="flex items-center text-slate-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <a 
                          href={`tel:${company.clinicPhone}`}
                          className="hover:text-slate-900"
                        >
                          {company.clinicPhone}
                        </a>
                      </div>
                    )}
                    {company.clinicWhatsapp && (
                      <div className="flex items-center text-slate-600">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <a 
                          href={`https://wa.me/${company.clinicWhatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-slate-900"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Login View */}
        {viewMode === "login" && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    placeholder="Enter your password"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-3 text-lg font-semibold bg-pink-600 hover:bg-pink-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => setViewMode("register")}
                  className="text-pink-600 hover:text-pink-700 font-semibold"
                >
                  Register
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Register View */}
        {viewMode === "register" && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="+64 21 123 4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Confirm your password"
                  />
                  {passwordMatch !== null && (
                    <p className={`text-xs ${passwordMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-3 text-lg font-semibold bg-pink-600 hover:bg-pink-700"
                  disabled={registerMutation.isPending || passwordMatch === false}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => setViewMode("login")}
                  className="text-pink-600 hover:text-pink-700 font-semibold"
                >
                  Login
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard View */}
        {viewMode === "dashboard" && client && (
          <div className="space-y-6">
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No appointments yet</h3>
                  <p className="text-slate-500 mb-6">Book your first appointment to get started!</p>
                  <Link href={`/client/${publicLink}/booking`}>
                    <Button className="bg-pink-600 hover:bg-pink-700">
                      Book New Appointment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {upcomingAppointments.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Upcoming Appointments</h2>
                    <div className="space-y-4">
                      {upcomingAppointments.map((apt) => {
                        const date = new Date(apt.appointmentDate);
                        const canCancel = apt.status !== 'cancelled' && apt.status !== 'completed';
                        
                        return (
                          <Card key={apt.id}>
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="text-lg font-semibold text-slate-900">
                                    {format(date, 'EEEE, MMMM d, yyyy')}
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {format(date, 'h:mm a')} ({apt.totalDuration} min)
                                    </div>
                                  </div>
                                </div>
                                {getStatusBadge(apt.status)}
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                {apt.staff && (
                                  <div className="flex items-center text-sm text-slate-600">
                                    <User className="w-4 h-4 mr-2 text-pink-600" />
                                    {apt.staff.name}
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-slate-600">
                                  <DollarSign className="w-4 h-4 mr-2 text-pink-600" />
                                  NZ${parseFloat(apt.totalPrice).toFixed(2)}
                                </div>
                                {apt.procedures.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                      <Scissors className="w-4 h-4 mr-2 text-pink-600" />
                                      {apt.procedureCount} service(s):
                                    </div>
                                    <div className="pl-6 space-y-1">
                                      {apt.procedures.map((proc) => (
                                        <div key={proc.id} className="text-sm text-slate-600">
                                          • {proc.procedureName} ({proc.duration} min - NZ${parseFloat(proc.price).toFixed(2)})
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {canCancel && (
                                <Button
                                  variant="outline"
                                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleCancelAppointment(apt.id)}
                                  disabled={cancelAppointmentMutation.isPending}
                                >
                                  Cancel Appointment
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pastAppointments.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Past Appointments</h2>
                    <div className="space-y-4">
                      {pastAppointments.map((apt) => {
                        const date = new Date(apt.appointmentDate);
                        
                        return (
                          <Card key={apt.id}>
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="text-lg font-semibold text-slate-900">
                                    {format(date, 'EEEE, MMMM d, yyyy')}
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {format(date, 'h:mm a')} ({apt.totalDuration} min)
                                    </div>
                                  </div>
                                </div>
                                {getStatusBadge(apt.status)}
                              </div>
                              
                              <div className="space-y-2">
                                {apt.staff && (
                                  <div className="flex items-center text-sm text-slate-600">
                                    <User className="w-4 h-4 mr-2 text-pink-600" />
                                    {apt.staff.name}
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-slate-600">
                                  <DollarSign className="w-4 h-4 mr-2 text-pink-600" />
                                  NZ${parseFloat(apt.totalPrice).toFixed(2)}
                                </div>
                                {apt.procedures.length > 0 && (
                                  <div className="mt-3">
                                    <div className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                      <Scissors className="w-4 h-4 mr-2 text-pink-600" />
                                      {apt.procedureCount} service(s):
                                    </div>
                                    <div className="pl-6 space-y-1">
                                      {apt.procedures.map((proc) => (
                                        <div key={proc.id} className="text-sm text-slate-600">
                                          • {proc.procedureName} ({proc.duration} min - NZ${parseFloat(proc.price).toFixed(2)})
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Book New Appointment Button */}
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
                  <Link href={`/client/${publicLink}/booking`}>
                    <Button className="w-full py-4 text-lg font-semibold bg-pink-600 hover:bg-pink-700 shadow-lg">
                      Book New Appointment
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
