import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, MessageCircle, LogOut, Clock, User, Bell, Upload, Users, Trash2, Edit, Image, Monitor, Smartphone, Plug, Plus, FileJson, Play, Timer, AlertCircle, ImageIcon, Gift, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema, insertBusinessHoursSchema, insertStaffSchema, insertLoyaltySettingsSchema, type BusinessHours, type Staff, type LoyaltySettings } from "@shared/schema";
import { PublicLinkManager } from "@/components/PublicLinkManager";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { LANGUAGES, CURRENCIES } from "@/lib/currency";
import { useLocale } from "@/contexts/LocaleContext";
// Removed ObjectUploader imports - using custom upload implementation

const userFormSchema = insertUserSchema.partial().pick({
  email: true,
  firstName: true,
  lastName: true,
  professionalRegistration: true,
  specialties: true,
  clinicName: true,
  clinicCnpj: true,
  clinicAddress: true,
  clinicPhone: true,
  clinicWhatsapp: true,
  reminderStartTime: true,
  reminderEndTime: true,
  language: true,
  currency: true,
}).extend({
  inactivityDays: z.coerce.number().min(1).max(365).optional(),
  reminderHours: z.coerce.number().min(1).max(72).optional(),
});
type UserFormData = z.infer<typeof userFormSchema>;

const businessHoursFormSchema = z.array(z.object({
  dayOfWeek: z.string(),
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
}));
type BusinessHoursFormData = z.infer<typeof businessHoursFormSchema>;

const daysOfWeek = [
  { value: 'monday', label: '' }, // Will be translated using t() in component
  { value: 'tuesday', label: '' },
  { value: 'wednesday', label: '' },
  { value: 'thursday', label: '' },
  { value: 'friday', label: '' },
  { value: 'saturday', label: '' },
  { value: 'sunday', label: '' },
];

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour < 12 ? 'AM' : 'PM';
  return {
    value: time,
    label: `${displayHour}:${minute} ${period}`
  };
});

export default function Settings() {
  const { t } = useLocale();
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");

  const { user, logoutMutation } = useAuth();
  
  // Debug: Log user role
  useEffect(() => {
  }, [user]);

  useEffect(() => {
    if (user?.heroImageUrl) {
      setHeroImageUrl(user.heroImageUrl);
    }
  }, [user?.heroImageUrl]);
  const { toast } = useToast();
  const { isExpanded } = useSidebar();
  const queryClient = useQueryClient();

  // Banner Section Component (only for admin)
  function BannerSection() {
    const [loginBannerUrl, setLoginBannerUrl] = useState<string>("");
    const [dashboardBannerUrl, setDashboardBannerUrl] = useState<string>("");
    const { user } = useAuth();

    // Load user data to get current banner URLs
    useEffect(() => {
      if (user) {
        setLoginBannerUrl(user.loginBannerUrl || "");
        setDashboardBannerUrl(user.dashboardBannerUrl || "");
      }
    }, [user]);

    const saveBannersMutation = useMutation({
      mutationFn: async (data: { loginBannerUrl?: string; dashboardBannerUrl?: string }) => {
        try {
          const response = await apiRequest('PUT', '/api/user/profile', data);
          
          // Check content-type before parsing JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("❌ Non-JSON response:", text.substring(0, 200));
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
          }
          
          // Parse JSON response
          const result = await response.json();
          return result;
        } catch (error: any) {
          console.error("❌ Error in mutationFn:", error);
          // If error message contains HTML, extract a cleaner message
          if (error?.message?.includes('<!DOCTYPE') || error?.message?.includes('<html')) {
            throw new Error("Server returned HTML instead of JSON. Please check the server logs.");
          }
          throw error;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/public/login-banner"] });
        toast({
          title: "Success",
          description: "Banner settings saved successfully",
        });
      },
      onError: (error: any) => {
        console.error("❌ Mutation error:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to save banner settings",
          variant: "destructive",
        });
      },
    });

    const handleSaveLoginBanner = () => {
      if (!loginBannerUrl.trim() || (!loginBannerUrl.startsWith('http://') && !loginBannerUrl.startsWith('https://') && !loginBannerUrl.startsWith('data:'))) {
        toast({
          title: "Error",
          description: t("valid_image_url_required"),
          variant: "destructive",
        });
        return;
      }

      saveBannersMutation.mutate({ loginBannerUrl: loginBannerUrl.trim() });
    };

    const handleSaveDashboardBanner = () => {
      if (!dashboardBannerUrl.trim() || (!dashboardBannerUrl.startsWith('http://') && !dashboardBannerUrl.startsWith('https://') && !dashboardBannerUrl.startsWith('data:'))) {
        toast({
          title: "Error",
          description: t("valid_image_url_required"),
          variant: "destructive",
        });
        return;
      }

      saveBannersMutation.mutate({ dashboardBannerUrl: dashboardBannerUrl.trim() });
    };

    return (
      <div className="space-y-8">
        {/* Login Banner Section */}
        <Card className="shadow-none border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">{t("login_screen_banner")}</CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              Configure the background banner image for the login screen. Enter a direct image URL.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login-banner-url" className="text-sm font-medium mb-2 block">
                Banner Image URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="login-banner-url"
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={loginBannerUrl}
                  onChange={(e) => setLoginBannerUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveLoginBanner}
                  disabled={saveBannersMutation.isPending}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600"
                >
                  {saveBannersMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
              {loginBannerUrl && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={loginBannerUrl}
                      alt="Login banner preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400">Invalid image URL</div>';
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Banner Section */}
        <Card className="shadow-none border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">{t("dashboard_banner")}</CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              Configure the banner image for the dashboard. Enter a direct image URL.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dashboard-banner-url" className="text-sm font-medium mb-2 block">
                Banner Image URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="dashboard-banner-url"
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={dashboardBannerUrl}
                  onChange={(e) => setDashboardBannerUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveDashboardBanner}
                  disabled={saveBannersMutation.isPending}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600"
                >
                  {saveBannersMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
              {dashboardBannerUrl && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={dashboardBannerUrl}
                      alt="Dashboard banner preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400">Invalid image URL</div>';
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Team Members Section Component
  function TeamMembersSection() {
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const { data: staff = [], isLoading: staffLoading } = useQuery({
      queryKey: ['/api/staff'],
    });

    const staffFormSchema = z.object({
      name: z.string().min(1, "Name is required"),
      role: z.string().min(1, "Role is required"),
      email: z.string().optional(),
      phone: z.string().optional(),
      irdNumber: z.string().optional(),
      specialties: z.string().optional(),
      commissionRate: z.number().min(0).max(100),
      hourlyPayment: z.boolean(),
      isActive: z.boolean(),
    });
    type StaffFormData = z.infer<typeof staffFormSchema>;

    const editForm = useForm<StaffFormData>({
      resolver: zodResolver(staffFormSchema),
      defaultValues: {
        name: "",
        role: "",
        email: "",
        phone: "",
        irdNumber: "",
        specialties: "",
        commissionRate: 0,
        hourlyPayment: false,
        isActive: true,
      },
    });

    const updateStaffMutation = useMutation({
      mutationFn: async ({ id, data }: { id: number; data: StaffFormData }) => {
        await apiRequest('PUT', `/api/staff/${id}`, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
        setEditingStaff(null);
        toast({
          title: "Success",
          description: t("staff_member_updated"),
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error", 
          description: `${t("failed_update_staff")}: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    const deleteStaffMutation = useMutation({
      mutationFn: async (staffId: number) => {
        await apiRequest('DELETE', `/api/staff/${staffId}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
        toast({
          title: "Success",
          description: t("staff_member_removed"),
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error", 
          description: `${t("failed_remove_staff")}: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    const handleRemoveStaff = (staffMember: Staff) => {
      if (confirm(`${t("confirm_remove_staff_member")} ${staffMember.name} ${t("from_team") || "da equipe"}?`)) {
        deleteStaffMutation.mutate(staffMember.id);
      }
    };

    const handleEditStaff = (staffMember: Staff) => {
      setEditingStaff(staffMember);
      editForm.reset({
        name: staffMember.name,
        role: staffMember.role,
        email: staffMember.email || "",
        phone: staffMember.phone || "",
        irdNumber: staffMember.irdNumber || "",
        specialties: staffMember.specialties || "",
        commissionRate: staffMember.commissionRate,
        hourlyPayment: staffMember.hourlyPayment ?? false,
        isActive: staffMember.isActive ?? true,
      });
    };

    const onEditSubmit = (data: StaffFormData) => {
      if (editingStaff) {
        updateStaffMutation.mutate({ id: editingStaff.id, data });
      }
    };

    if (staffLoading) {
      return <div className="p-4 text-center text-slate-500">{t("loading_team_members")}</div>;
    }

    return (
      <div className="space-y-6">
        <h4 className="font-medium text-slate-900">{t("team_members_management")}</h4>
        
        {(staff as Staff[]).length > 0 ? (
          <div className="space-y-4">
            {(staff as Staff[]).map((member: Staff) => (
              <div key={member.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-medium text-slate-900">{member.name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? t("active_label") : t("inactive_label")}
                      </span>
                    </div>
                    
                    <div className="text-sm text-slate-500 mt-1">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>{member.role}</span>
                        {member.email && <span>• {member.email}</span>}
                        {member.phone && <span>• {member.phone}</span>}
                        <span>• {member.commissionRate}% commission</span>
                      </div>
                      {member.specialties && (
                        <div className="mt-1 text-slate-400">
                          {t("specialties_label")}: {member.specialties}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => !open && setEditingStaff(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-600 hover:text-slate-800"
                        onClick={() => handleEditStaff(member)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {t("edit")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto p-4">
                      <DialogHeader className="pb-2">
                        <DialogTitle>{t("edit_staff_member")}</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("name_label")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("staff_member_name_placeholder")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("role_label")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("role_placeholder")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("email")}</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder={t("email_placeholder")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("phone_label")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("phone_placeholder")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name="irdNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("ird_number_required")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("ird_number_placeholder")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={editForm.control}
                              name="specialties"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("specialties_label")}</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder={t("list_specialties_placeholder")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <FormField
                                control={editForm.control}
                                name="commissionRate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("commission_rate_percent")}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={editForm.control}
                                name="hourlyPayment"
                                render={({ field }) => (
                                  <FormItem className="flex flex-col justify-end pb-2">
                                    <div className="flex items-center space-x-2">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="!mt-0 cursor-pointer">
                                        {t("paid_by_hours_worked")}
                                      </FormLabel>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={editForm.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={(e) => field.onChange(e.target.checked)}
                                      className="rounded border-slate-300"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm">{t("active_label")}</FormLabel>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </form>
                        </Form>
                      </div>
                      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 bg-white sticky bottom-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingStaff(null)}
                        >
                          {t("cancel")}
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateStaffMutation.isPending}
                          onClick={editForm.handleSubmit(onEditSubmit)}
                        >
                          {updateStaffMutation.isPending ? t("saving") : t("save_changes")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => handleRemoveStaff(member)}
                    disabled={deleteStaffMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("remove")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h5 className="font-medium text-slate-900 mb-2">{t("no_team_members_yet")}</h5>
            <p className="text-slate-500 mb-4">{t("add_staff_members_description")}</p>
            <Button variant="outline" onClick={() => window.location.href = '/staff'}>
              <Users className="w-4 h-4 mr-2" />
              {t("go_to_staff_management")}
            </Button>
          </div>
        )}

        <div className="p-4 border border-slate-200 rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">{t("team_management")}</h5>
              <p className="text-sm text-blue-700 mt-1">
                {t("team_management_description")}
              </p>
            </div>
          </div>
        </div>

        {/* Staff Users Section - Usuários que podem fazer login */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-slate-900">Usuários Staff (Acesso ao Sistema)</h4>
              <p className="text-sm text-slate-500 mt-1">
                Crie usuários que podem fazer login no sistema como staff. Eles terão acesso apenas ao menu de Agendamentos.
              </p>
            </div>
            <StaffUserForm />
          </div>

          <StaffUsersList />
        </div>
      </div>
    );
  }

  // Staff Users Management Component
  function StaffUserForm() {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const staffUserFormSchema = z.object({
      username: z.string().min(1, "Username é obrigatório"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    });

    type StaffUserFormData = z.infer<typeof staffUserFormSchema>;

    const form = useForm<StaffUserFormData>({
      resolver: zodResolver(staffUserFormSchema),
      defaultValues: {
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
      },
    });

    const createStaffUserMutation = useMutation({
      mutationFn: async (data: StaffUserFormData) => {
        const res = await apiRequest('POST', '/api/staff-users', data);
        return res;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/staff-users'] });
        form.reset();
        setIsOpen(false);
        toast({
          title: "Sucesso",
          description: "Usuário staff criado com sucesso!",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro",
          description: error.message || "Falha ao criar usuário staff",
          variant: "destructive",
        });
      },
    });

    const onSubmit = (data: StaffUserFormData) => {
      createStaffUserMutation.mutate(data);
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Criar Usuário Staff
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Usuário Staff</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="nomeusuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="João" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createStaffUserMutation.isPending}>
                  {createStaffUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  function StaffUsersList() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: staffUsers = [], isLoading } = useQuery({
      queryKey: ['/api/staff-users'],
      retry: false,
    });

    const deleteStaffUserMutation = useMutation({
      mutationFn: async (id: number) => {
        await apiRequest('DELETE', `/api/staff-users/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/staff-users'] });
        toast({
          title: "Sucesso",
          description: "Usuário staff removido com sucesso",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro",
          description: error.message || "Falha ao remover usuário",
          variant: "destructive",
        });
      },
    });

    if (isLoading) {
      return <div className="text-center py-4 text-slate-500">Carregando...</div>;
    }

    if (staffUsers.length === 0) {
      return (
        <div className="text-center py-8 bg-slate-50 rounded-lg">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum usuário staff criado ainda</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {(staffUsers as any[]).map((staffUser: any) => (
          <div key={staffUser.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center space-x-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-pink-100 text-pink-800">
                  {staffUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h5 className="font-medium text-slate-900">{staffUser.username}</h5>
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    Staff
                  </Badge>
                </div>
                <div className="text-sm text-slate-500">
                  {staffUser.email}
                  {staffUser.firstName && ` • ${staffUser.firstName} ${staffUser.lastName || ''}`}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Tem certeza que deseja remover o usuário ${staffUser.username}?`)) {
                  deleteStaffUserMutation.mutate(staffUser.id);
                }
              }}
              disabled={deleteStaffUserMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remover
            </Button>
          </div>
        ))}
      </div>
    );
  }

  // Loyalty Settings Section Component
  function LoyaltySettingsSection() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const loyaltySettingsFormSchema = insertLoyaltySettingsSchema.omit({ userId: true });
    type LoyaltySettingsFormData = z.infer<typeof loyaltySettingsFormSchema>;

    const { data: loyaltySettings, isLoading } = useQuery<LoyaltySettings | null>({
      queryKey: ["/api/loyalty-settings"],
      queryFn: async () => {
        const res = await apiRequest('GET', '/api/loyalty-settings');
        return res;
      },
      retry: false,
    });

    const form = useForm<LoyaltySettingsFormData>({
      resolver: zodResolver(loyaltySettingsFormSchema),
      defaultValues: {
        pointsPerDollar: 1.00,
        discountPerHundredPoints: 10.00,
        birthdayBonusPoints: 50,
        referralBonusPoints: 30,
        bronzeThreshold: 0,
        silverThreshold: 300,
        goldThreshold: 600,
        isActive: true,
      },
    });

    useEffect(() => {
      if (loyaltySettings) {
        form.reset({
          pointsPerDollar: parseFloat(loyaltySettings.pointsPerDollar?.toString() || '1.00'),
          discountPerHundredPoints: parseFloat(loyaltySettings.discountPerHundredPoints?.toString() || '10.00'),
          birthdayBonusPoints: loyaltySettings.birthdayBonusPoints || 50,
          referralBonusPoints: loyaltySettings.referralBonusPoints || 30,
          bronzeThreshold: loyaltySettings.bronzeThreshold || 0,
          silverThreshold: loyaltySettings.silverThreshold || 300,
          goldThreshold: loyaltySettings.goldThreshold || 600,
          isActive: loyaltySettings.isActive,
        });
      }
    }, [loyaltySettings, form]);

    const upsertLoyaltySettingsMutation = useMutation({
      mutationFn: async (data: LoyaltySettingsFormData) => {
        await apiRequest('POST', '/api/loyalty-settings', data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/loyalty-settings"] });
        toast({
          title: "Success",
          description: t("loyalty_settings_saved"),
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: `${t("failed_save_loyalty_settings")}: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    const onSubmit = (data: LoyaltySettingsFormData) => {
      upsertLoyaltySettingsMutation.mutate(data);
    };

    if (isLoading) {
      return <div className="text-center py-8">{t("loading") || "Carregando configurações de fidelidade..."}</div>;
    }

    return (
      <Card className="shadow-none border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" /> {t("loyalty_program_settings")}
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            {t("loyalty_settings_description")}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pointsPerDollar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("points_per_dollar_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountPerHundredPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("discount_per_hundred_points_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="10.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthdayBonusPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("birthday_bonus_points_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="50"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referralBonusPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("referral_bonus_points_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bronzeThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("bronze_threshold_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="silverThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("silver_threshold_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="300"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goldThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("gold_threshold_label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="600"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Loyalty Program
                      </FormLabel>
                      <p className="text-sm text-slate-500">
                        Activate or deactivate the loyalty points system for your clients.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={upsertLoyaltySettingsMutation.isPending}>
                  {upsertLoyaltySettingsMutation.isPending ? t("saving") : t("save_loyalty_settings")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  function IntegrationsSection() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
    const [testPayload, setTestPayload] = useState("");
    const [testResult, setTestResult] = useState<any>(null);
    
    const { data: integrations = [], isLoading } = useQuery({
      queryKey: ['/api/integrations'],
    });

    const integrationFormSchema = z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      url: z.string().url("URL inválida"),
      authType: z.string().min(1, "Tipo de autenticação é obrigatório"),
      authData: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    });
    type IntegrationFormData = z.infer<typeof integrationFormSchema>;

    const integrationForm = useForm<IntegrationFormData>({
      resolver: zodResolver(integrationFormSchema),
      defaultValues: {
        name: "",
        url: "",
        authType: "Bearer",
        authData: "",
        username: "",
        password: "",
      },
    });

    const createIntegrationMutation = useMutation({
      mutationFn: async (data: IntegrationFormData) => {
        await apiRequest('POST', '/api/integrations', data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
        setIsDialogOpen(false);
        integrationForm.reset();
        toast({
          title: "Sucesso",
          description: "Integração criada com sucesso!",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro",
          description: `Falha ao criar integração: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    const deleteIntegrationMutation = useMutation({
      mutationFn: async (id: number) => {
        await apiRequest('DELETE', `/api/integrations/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
        toast({
          title: "Sucesso",
          description: "Integração removida com sucesso!",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Erro",
          description: `Falha ao remover integração: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    const updateTestPayloadMutation = useMutation({
      mutationFn: async ({ id, testPayload }: { id: number; testPayload: string }) => {
        await apiRequest('PATCH', `/api/integrations/${id}/test-payload`, { testPayload });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
        toast({
          title: "Sucesso",
          description: "Teste de integração salvo!",
        });
      },
    });

    const testIntegrationMutation = useMutation({
      mutationFn: async (id: number) => {
        const response = await apiRequest('POST', `/api/integrations/${id}/test`);
        return response;
      },
      onSuccess: (data: any) => {
        setTestResult(data);
        toast({
          title: "Sucesso",
          description: `Integração testada! Status: ${data.status}`,
        });
      },
      onError: (error: any) => {
        setTestResult({ success: false, error: error.message });
        toast({
          title: "Erro",
          description: `Falha ao testar: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    const onSubmit = (data: IntegrationFormData) => {
      createIntegrationMutation.mutate(data);
    };

    const handleDelete = (id: number, name: string) => {
      if (confirm(`Tem certeza que deseja remover a integração "${name}"?`)) {
        deleteIntegrationMutation.mutate(id);
      }
    };

    const handleCreateTest = (integration: any) => {
      setSelectedIntegration(integration);
      setTestPayload(integration.testPayload || "{}");
      setTestResult(null);
      setTestDialogOpen(true);
    };

    const handleSaveTest = () => {
      if (selectedIntegration) {
        updateTestPayloadMutation.mutate({
          id: selectedIntegration.id,
          testPayload,
        });
      }
    };

    const handleTestIntegration = (integration: any) => {
      setSelectedIntegration(integration);
      setTestResult(null);
      testIntegrationMutation.mutate(integration.id);
    };

    if (isLoading) {
      return <div className="p-4 text-center text-slate-500">Carregando integrações...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-slate-900">Endpoints de Integração</h4>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                + Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Integração</DialogTitle>
              </DialogHeader>
              <Form {...integrationForm}>
                <form onSubmit={integrationForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={integrationForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: API Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={integrationForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={integrationForm.control}
                    name="authType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Autenticação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bearer">Bearer Token</SelectItem>
                            <SelectItem value="Basic">Basic Auth</SelectItem>
                            <SelectItem value="API Key">API Key</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={integrationForm.control}
                    name="authData"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dados de Autenticação</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: token, chave API, ou JSON com credenciais" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={integrationForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Usuário para autenticação" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={integrationForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="Senha para autenticação" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createIntegrationMutation.isPending}>
                      {createIntegrationMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {(integrations as any[]).length > 0 ? (
          <div className="space-y-4">
            {(integrations as any[]).map((integration: any) => (
              <div key={integration.id} className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Plug className="w-5 h-5 text-green-600" />
                      <h5 className="font-medium text-slate-900">{integration.name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        integration.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {integration.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-slate-600">
                        <span className="font-medium mr-2">URL:</span>
                        <span className="text-slate-500 break-all">{integration.url}</span>
                      </div>
                      <div className="flex items-center text-slate-600">
                        <span className="font-medium mr-2">Auth:</span>
                        <span className="text-slate-500">{integration.authType}</span>
                      </div>
                      {integration.username && (
                        <div className="flex items-center text-slate-600">
                          <span className="font-medium mr-2">Usuário:</span>
                          <span className="text-slate-500">{integration.username}</span>
                        </div>
                      )}
                      {integration.password && (
                        <div className="flex items-center text-slate-600">
                          <span className="font-medium mr-2">Senha:</span>
                          <span className="text-slate-500">••••••••</span>
                        </div>
                      )}
                      {integration.authData && (
                        <div className="flex items-start text-slate-600">
                          <span className="font-medium mr-2">Dados:</span>
                          <span className="text-slate-500 break-all font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            {integration.authData}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => handleCreateTest(integration)}
                    >
                      <FileJson className="w-4 h-4 mr-1" />
                      Criar Teste
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-800 hover:bg-green-50"
                      onClick={() => handleTestIntegration(integration)}
                      disabled={testIntegrationMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Testar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleDelete(integration.id, integration.name)}
                      disabled={deleteIntegrationMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <Plug className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h5 className="font-medium text-slate-900 mb-2">Nenhuma integração cadastrada</h5>
            <p className="text-slate-500 mb-4">Adicione endpoints de integração para conectar com sistemas externos</p>
          </div>
        )}

        <div className="p-4 border border-slate-200 rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Plug className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">Sobre Integrações</h5>
              <p className="text-sm text-blue-700 mt-1">
                Cadastre URLs e credenciais de autenticação para integrar com APIs externas.
                Esses dados serão usados para comunicação com sistemas de terceiros.
              </p>
            </div>
          </div>
        </div>

        {/* Test Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedIntegration?.name} - Teste de Integração
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payload JSON
                </label>
                <Textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>

              {testResult && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h5 className="font-medium text-slate-900 mb-2">Resultado do Teste</h5>
                  {testResult.success ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Status:</span>{' '}
                        <span className={testResult.status === 200 ? 'text-green-600' : 'text-orange-600'}>
                          {testResult.status} {testResult.statusText}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Resposta:</span>
                        <pre className="mt-1 p-3 bg-white rounded border border-slate-200 text-xs overflow-auto max-h-64">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      <span className="font-medium">Erro:</span> {testResult.error}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setTestDialogOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleSaveTest}
                  disabled={updateTestPayloadMutation.isPending}
                >
                  Salvar Teste
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      professionalRegistration: user?.professionalRegistration || "",
      specialties: user?.specialties || "",
      clinicName: user?.clinicName || "",
      clinicCnpj: user?.clinicCnpj || "",
      clinicAddress: user?.clinicAddress || "",
      clinicPhone: user?.clinicPhone || "",
      clinicWhatsapp: user?.clinicWhatsapp || "",
      inactivityDays: user?.inactivityDays ?? 7,
      reminderHours: user?.reminderHours ?? 2,
      reminderStartTime: user?.reminderStartTime || "18:00",
      reminderEndTime: user?.reminderEndTime || "20:00",
      language: user?.language || "pt-BR",
      currency: user?.currency || "BRL",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        professionalRegistration: user.professionalRegistration || "",
        specialties: user.specialties || "",
        clinicName: user.clinicName || "",
        clinicCnpj: user.clinicCnpj || "",
        clinicAddress: user.clinicAddress || "",
        clinicPhone: user.clinicPhone || "",
        clinicWhatsapp: user.clinicWhatsapp || "",
        inactivityDays: user.inactivityDays ?? 7,
        reminderHours: user.reminderHours ?? 2,
        reminderStartTime: user.reminderStartTime || "18:00",
        reminderEndTime: user.reminderEndTime || "20:00",
        language: user.language || "pt-BR",
        currency: user.currency || "BRL",
      });
    } else {
    }
  }, [user, form]);

  // Helper function to format time (HH:MM to readable format)
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  // Business hours query and mutation
  const { data: businessHours = [], isLoading: isLoadingHours } = useQuery({
    queryKey: ['/api/business-hours'],
    retry: false,
  });

  const [hoursForm, setHoursForm] = useState<BusinessHoursFormData>(() => {
    return daysOfWeek.map(day => {
      const existingHour = Array.isArray(businessHours) ? businessHours.find((h: any) => h.dayOfWeek === day.value) : null;
      return {
        dayOfWeek: day.value,
        isOpen: existingHour?.isOpen ?? true,
        openTime: existingHour?.openTime || '09:00',
        closeTime: existingHour?.closeTime || '17:00',
        breakStartTime: existingHour?.breakStartTime || '12:00',
        breakEndTime: existingHour?.breakEndTime || '13:00',
      };
    });
  });

  const updateBusinessHoursMutation = useMutation({
    mutationFn: async (data: BusinessHoursFormData) => {
      await apiRequest('POST', '/api/business-hours', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-hours'] });
      toast({
        title: "Success",
        description: "Operating hours updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update operating hours. Please try again.",
        variant: "destructive",
      });
    },
  });

  const heroImageUploadMutation = useMutation({
    mutationFn: async (heroImageUrl: string) => {
      const response = await apiRequest('PUT', '/api/hero-image', { heroImageUrl });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Hero image updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Hero image update error:', error);
      toast({
        title: "Error", 
        description: "Failed to update hero image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUploadUrlMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest('POST', '/api/objects/upload', {});
        
        const responseText = await response.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
        if (!data || !data.uploadURL) {
          throw new Error(`No upload URL in response: ${JSON.stringify(data)}`);
        }
        return data.uploadURL as string;
      } catch (error) {
        console.error('getUploadUrlMutation error:', error);
        throw error;
      }
    },
  });

  const handleHeroImageUpload = async (file: File) => {
    try {
      
      // Resize and compress image
      const resizedFile = await resizeAndCompressImage(file, 1200, 0.7);
      
      // Get upload URL
      const uploadURL = await getUploadUrlMutation.mutateAsync();
      
      // Upload to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: resizedFile,
        headers: {
          'Content-Type': 'image/jpeg'
        }
      });


      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed with response:', errorText);
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`);
      }

      // Convert upload URL to object path for saving
      const objectPath = uploadURL.split('?')[0]; // Remove query params
      
      // Update hero image in database
      await heroImageUploadMutation.mutateAsync(objectPath);
      setHeroImageUrl(objectPath);
      
      toast({
        title: "Success",
        description: "Hero image uploaded successfully!",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was a problem uploading your hero image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resizeAndCompressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img') as HTMLImageElement;

      img.onload = () => {
        try {
          // Calculate new dimensions
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              // Convert blob to File with proper filename and type
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, 'image/jpeg', quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest('PUT', '/api/auth/user', data);
      const result = await response.json();
      return result;
    },
    onSuccess: async (data) => {
      // Force refetch to get fresh data (not just invalidate)
      await queryClient.refetchQueries({ 
        queryKey: ["/api/user"],
        type: 'active'
      });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleBusinessHoursChange = (dayIndex: number, field: string, value: any) => {
    setHoursForm(prev => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      return updated;
    });
  };

  const saveBusinessHours = () => {
    updateBusinessHoursMutation.mutate(hoursForm);
  };

  const getInitials = () => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return "User";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0",
        isExpanded ? "lg:ml-72" : "lg:ml-16"
      )}>
        <TopHeader title={t("settings_title")} subtitle={t("settings_subtitle")} />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-semibold text-slate-900">
                {t("settings_title")} {t("and")} {t("profile")}
              </CardTitle>
            </CardHeader>

            <Tabs defaultValue="profile" className="w-full">
              <div className="px-6 pt-4 pb-2 border-b bg-slate-50">
                <TabsList className={cn(
                  "grid w-full gap-1 bg-transparent h-auto p-0",
                  (user?.role === 'admin' || !user?.role)
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-8" 
                    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-7"
                )}>
                  <TabsTrigger value="profile" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("profile")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="hours" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("business_hours")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("team")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Plug className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("integrations")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("client") || "Cliente"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Bell className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("notifications")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="loyalty" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Gift className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("loyalty_settings")}</span>
                  </TabsTrigger>
                  {(user?.role === 'admin' || !user?.role) && (
                    <TabsTrigger value="banner" className="flex items-center justify-center gap-1 text-xs md:text-sm py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{t("banners")}</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <CardContent className="pt-6">
                <TabsContent value="profile" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">{t("professional_profile") || "Perfil Profissional"}</h4>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="flex items-center space-x-4 mb-6">
                            <Avatar className="w-20 h-20">
                              <AvatarImage src={user?.profileImageUrl || ""} alt="Profile photo" />
                              <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                            <div className="w-full">
                              {/* Custom Upload Area - Exact design as shown */}
                              <div 
                                className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer bg-gray-50 w-full"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/jpeg,image/jpg,image/png';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    
                                    if (file.size > 10485760) { // 10MB
                                      toast({
                                        title: "Error",
                                        description: "File size must be less than 10MB",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                                      toast({
                                        title: "Error", 
                                        description: "Only JPG and PNG files are allowed",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    try {
                                      // Get upload URL
                                      const uploadResponse = await apiRequest('POST', '/api/objects/upload');
                                      
                                      if (!uploadResponse || !uploadResponse.uploadURL) {
                                        throw new Error('No upload URL received from server');
                                      }
                                      
                                      // Upload file directly to the signed URL
                                      const uploadResult = await fetch(uploadResponse.uploadURL, {
                                        method: 'PUT',
                                        body: file,
                                        headers: {
                                          'Content-Type': file.type
                                        }
                                      });
                                      
                                      if (!uploadResult.ok) {
                                        throw new Error(`Upload failed: ${uploadResult.status}`);
                                      }
                                      
                                      // Convert upload URL to object path for saving
                                      const objectPath = uploadResponse.uploadURL.split('?')[0]; // Remove query params
                                      
                                      // Update user profile with new image URL
                                      await apiRequest('PUT', '/api/profile-image', {
                                        profileImageUrl: objectPath
                                      });
                                      
                                      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                                      toast({
                                        title: "Success",
                                        description: "Profile photo updated successfully!",
                                      });
                                      
                                    } catch (error: any) {
                                      console.error('Upload error:', error);
                                      toast({
                                        title: "Error",
                                        description: `Failed to upload photo: ${error.message}`,
                                        variant: "destructive",
                                      });
                                    }
                                  };
                                  input.click();
                                }}
                              >
                                <div className="flex flex-col items-center">
                                  <User className="w-8 h-8 text-gray-400 mb-2" />
                                  <Upload className="w-5 h-5 text-gray-400 mb-2" />
                                  <p className="text-gray-600 font-medium">{t("click_to_upload")}</p>
                                  <p className="text-sm text-gray-400">{t("jpg_or_png_max_10mb")}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("first_name")}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("last_name")}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("email")}</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="professionalRegistration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("professional_registration")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("beauty_therapy_board_registration_placeholder")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="specialties"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("specialties_label")}</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder={t("describe_specialties_placeholder")}
                                    className="h-20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="pt-4">
                            <h5 className="font-medium text-slate-900 mb-4">{t("clinic_details")}</h5>
                            
                            <FormField
                              control={form.control}
                              name="clinicName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("clinic_name_label")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={t("clinic_name_label")} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                              <FormField
                                control={form.control}
                                name="clinicCnpj"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("business_number")}</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. NZBN 9429000000000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="clinicPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("business_phone")}</FormLabel>
                                    <FormControl>
                                      <Input placeholder="09 123 4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="clinicAddress"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>{t("complete_address")}</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Street, number, suburb, city, postcode"
                                      className="h-20"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="clinicWhatsapp"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>{t("whatsapp_business")}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="021 123 4567" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="language"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Idioma / Language</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "pt-BR"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o idioma" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                          {lang.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="currency"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Moeda / Currency</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "BRL"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a moeda" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {CURRENCIES.map((curr) => (
                                        <SelectItem key={curr.code} value={curr.code}>
                                          {curr.symbol} {curr.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="pt-4">
                            <Button type="submit" disabled={updateProfileMutation.isPending}>
                              {updateProfileMutation.isPending ? t("saving") : t("save_changes")}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">{t("system_information")}</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center space-x-3 mb-3">
                            <HelpCircle className="h-5 w-5 text-blue-600" />
                            <h5 className="font-medium text-slate-900">{t("support_title")}</h5>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            {t("need_help_contact_support")}
                          </p>
                          <Button variant="outline" size="sm">
                            {t("contact_support_button")}
                          </Button>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center space-x-3 mb-3">
                            <LogOut className="h-5 w-5 text-red-600" />
                            <h5 className="font-medium text-slate-900">{t("account_title")}</h5>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            {t("signed_in_as")} {getUserName()}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                          >
                            {t("sign_out")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="hours" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">{t("operating_hours")}</h4>
                      <Button 
                        onClick={saveBusinessHours}
                        disabled={updateBusinessHoursMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updateBusinessHoursMutation.isPending ? t("saving_hours") : t("save_hours")}
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {daysOfWeek.map((day, index) => (
                        <div key={day.value} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <h5 className="font-medium text-slate-900 w-20">{t(day.value as any)}</h5>
                              <Switch
                                checked={hoursForm[index]?.isOpen ?? true}
                                onCheckedChange={(checked) => handleBusinessHoursChange(index, 'isOpen', checked)}
                              />
                              <span className="text-sm text-slate-500">
                                {hoursForm[index]?.isOpen ? t("open") : t("closed")}
                              </span>
                            </div>
                          </div>

                          {hoursForm[index]?.isOpen && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  {t("opening_time") || "Horário de Abertura"}
                                </label>
                                <Select
                                  value={hoursForm[index]?.openTime || '09:00'}
                                  onValueChange={(value) => handleBusinessHoursChange(index, 'openTime', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.map((slot) => (
                                      <SelectItem key={slot.value} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  {t("closing_time")}
                                </label>
                                <Select
                                  value={hoursForm[index]?.closeTime || '17:00'}
                                  onValueChange={(value) => handleBusinessHoursChange(index, 'closeTime', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.map((slot) => (
                                      <SelectItem key={slot.value} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  {t("lunch_start")}
                                </label>
                                <Select
                                  value={hoursForm[index]?.breakStartTime || '12:00'}
                                  onValueChange={(value) => handleBusinessHoursChange(index, 'breakStartTime', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.map((slot) => (
                                      <SelectItem key={slot.value} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  {t("lunch_end")}
                                </label>
                                <Select
                                  value={hoursForm[index]?.breakEndTime || '13:00'}
                                  onValueChange={(value) => handleBusinessHoursChange(index, 'breakEndTime', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.map((slot) => (
                                      <SelectItem key={slot.value} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border border-slate-200 rounded-lg bg-blue-50 border-blue-200">
                      <div className="flex items-start space-x-3">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-blue-900">{t("operating_hours_information")}</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            {t("operating_hours_description")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="link" className="space-y-6">
                  {/* Hero Image Upload Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        {t("hero_image")}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {t("upload_hero_image_description") || "Envie uma imagem hero para sua página de agendamento de clientes. Esta imagem será exibida no topo da sua página pública de agendamento."}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Hero Image Preview */}
                      {(user?.heroImageUrl || heroImageUrl) && (
                        <div className="mb-4">
                          <img
                            src={user?.heroImageUrl || heroImageUrl}
                            alt="Hero image preview"
                            className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-200"
                          />
                        </div>
                      )}
                      
                      {/* Upload Area - Matching provided design */}
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                        <input
                          type="file"
                          id="hero-upload"
                          className="hidden"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleHeroImageUpload(file);
                          }}
                        />
                        <label htmlFor="hero-upload" className="cursor-pointer">
                          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-900 mb-2">
                            {t("upload_hero_image")}
                          </h3>
                          <p className="text-sm text-slate-600 mb-4">
                            {t("drop_image_or_click")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t("jpg_png_up_to_10mb")}
                          </p>
                        </label>
                      </div>

                      {/* Resolution Recommendations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Monitor className="h-5 w-5 text-slate-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{t("desktop_label")}</p>
                            <p className="text-xs text-slate-600">{t("recommended_resolution")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Smartphone className="h-5 w-5 text-slate-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{t("mobile_label")}</p>
                            <p className="text-xs text-slate-600">{t("optimised_automatically")}</p>
                          </div>
                        </div>
                      </div>

                      {/* Loading indicator */}
                      {(heroImageUploadMutation.isPending || getUploadUrlMutation.isPending) && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2 text-sm text-slate-600">{t("uploading")}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Public Link Manager */}
                  {user && <PublicLinkManager user={user} />}
                </TabsContent>

                <TabsContent value="notifications" className="mt-0">
                  <div className="space-y-6">
                    {/* Time Parameters Section */}
                    <Card className="border-2 border-green-100">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Timer className="h-5 w-5 text-green-600" />
                          {t("time_parameters")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Form {...form}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Inactivity Days */}
                            <FormField
                            control={form.control}
                            name="inactivityDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-900 font-medium">{t("inactivity_timeout_days")}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="90"
                                    placeholder="7" 
                                    {...field}
                                    value={field.value ?? 7}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                                  />
                                </FormControl>
                                <p className="text-xs text-slate-500">
                                  {t("inactivity_timeout_description")}
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Reminder Hours */}
                          <FormField
                            control={form.control}
                            name="reminderHours"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-900 font-medium">{t("reminder_time_hours")}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="48"
                                    placeholder="2" 
                                    {...field}
                                    value={field.value ?? 2}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                                  />
                                </FormControl>
                                <p className="text-xs text-slate-500">
                                  {t("reminder_time_description")}
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Reminder Time Configuration */}
                        <div className="pt-4 border-t">
                          <h5 className="font-medium text-slate-900 mb-3">{t("reminder_schedule_configuration")}</h5>
                          <p className="text-sm text-slate-600 mb-4">
                            {t("reminder_schedule_description")}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Reminder Start Time */}
                            <FormField
                              control={form.control}
                              name="reminderStartTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-900 font-medium">{t("start_time_for_reminders")}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "18:00"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("select_start_time")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {timeSlots.map((slot) => (
                                        <SelectItem key={slot.value} value={slot.value}>
                                          {slot.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-slate-500">
                                    {t("start_time_example")}
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Reminder End Time */}
                            <FormField
                              control={form.control}
                              name="reminderEndTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-900 font-medium">{t("end_time_for_reminders")}</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "20:00"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t("select_end_time")} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {timeSlots.map((slot) => (
                                        <SelectItem key={slot.value} value={slot.value}>
                                          {slot.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-slate-500">
                                    {t("end_time_example")}
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Validation Message */}
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-900">
                                {t("valid_configuration")} {formatTime(form.watch('reminderStartTime') || '18:00')} {t("and")} {formatTime(form.watch('reminderEndTime') || '20:00')}
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                {t("reminder_example")}: {formatTime(form.watch('reminderStartTime') || '18:00')} - {formatTime(form.watch('reminderEndTime') || '20:00')}, {t("reminder_example")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button 
                            onClick={() => form.handleSubmit(onSubmit)()}
                            className="w-full md:w-auto"
                          >
                            {t("save_time_settings")}
                          </Button>
                        </Form>
                      </CardContent>
                    </Card>

                    <h4 className="font-medium text-slate-900">{t("notification_preferences")}</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <h5 className="font-medium text-slate-900">{t("email_notifications")}</h5>
                            <p className="text-sm text-slate-500">{t("receive_email_alerts") || "Receba alertas por email para novos agendamentos"}</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.email}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, email: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <h5 className="font-medium text-slate-900">{t("sms_notifications")}</h5>
                            <p className="text-sm text-slate-500">{t("send_sms_reminders") || "Envie lembretes de agendamento via SMS"}</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.sms}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, sms: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <h5 className="font-medium text-slate-900">{t("push_notifications")}</h5>
                            <p className="text-sm text-slate-500">{t("realtime_alerts") || "Alertas em tempo real no aplicativo"}</p>
                          </div>
                        </div>
                        <Switch
                          checked={notificationSettings.push}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, push: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Bell className="h-5 w-5 text-yellow-600" />
                          <div>
                            <h5 className="font-medium text-slate-900">{t("marketing_notifications") || "Notificações de Marketing"}</h5>
                            <p className="text-sm text-slate-500">{t("receive_updates") || "Receba atualizações sobre novos recursos e dicas"}</p>
                          </div>
                        </div>
                        <Switch
                          checked={true}
                          onCheckedChange={() => {}}
                        />
                      </div>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-start space-x-3">
                        <Bell className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-green-900">{t("notification_preferences")}</h5>
                          <p className="text-sm text-green-700 mt-1">
                            {t("configure_notifications") || "Configure como e quando deseja receber notificações sobre agendamentos, comunicações com clientes e atualizações do sistema."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="loyalty" className="mt-0">
                  <LoyaltySettingsSection />
                </TabsContent>

                {(user?.role === 'admin' || !user?.role) && (
                  <TabsContent value="banner" className="mt-0">
                    <BannerSection />
                  </TabsContent>
                )}

                <TabsContent value="team" className="mt-0">
                  <TeamMembersSection />
                </TabsContent>

                <TabsContent value="integrations" className="mt-0">
                  <IntegrationsSection />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}