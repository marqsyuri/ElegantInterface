import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Edit, Trash2, Clock, DollarSign, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import TopHeader from "@/components/TopHeader";
import PageLayout from "@/components/PageLayout";
import { type Staff } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { z } from "zod";
import { useLocale } from "@/contexts/LocaleContext";

// Staff form schema - validation messages will be translated in component
const staffFormSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  irdNumber: z.string().min(1),
  specialties: z.string().optional(),
  commissionRate: z.number().min(0).max(100),
  hourlyPayment: z.boolean(),
  isActive: z.boolean(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

export default function Staff() {
  const { t } = useLocale();
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['/api/staff'],
  });

  // Forms
  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      role: "",
      email: "",
      phone: "+64", // DDI padrão da Nova Zelândia
      irdNumber: "",
      specialties: "",
      commissionRate: 0,
      hourlyPayment: false,
      isActive: true,
    },
  });

  const editForm = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      role: "",
      email: "",
      phone: "+64", // DDI padrão da Nova Zelândia
      irdNumber: "",
      specialties: "",
      commissionRate: 0,
      hourlyPayment: false,
      isActive: true,
    },
  });

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      await apiRequest('POST', '/api/staff', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      setIsStaffDialogOpen(false);
      staffForm.reset({
        name: "",
        role: "",
        email: "",
        phone: "+64", // DDI padrão da Nova Zelândia
        irdNumber: "",
        specialties: "",
        commissionRate: 0,
        hourlyPayment: false,
        isActive: true,
      });
      toast({
        title: t('success'),
        description: t('staff_created'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'), 
        description: t('failed_to_create'),
        variant: "destructive",
      });
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
        title: t('success'),
        description: t('staff_updated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'), 
        description: t('failed_to_create'),
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
        title: t('success'),
        description: t('staff_deleted'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'), 
        description: t('failed_to_create'),
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const onStaffSubmit = (data: StaffFormData) => {
    createStaffMutation.mutate(data);
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

  const handleRemoveStaff = (staffMember: Staff) => {
    if (confirm(`${t("confirm_remove_staff")} ${staffMember.name}?`)) {
      deleteStaffMutation.mutate(staffMember.id);
    }
  };

  return (
    <PageLayout>
      <TopHeader title={t("staff_management")} subtitle={t("staff_subtitle")} />
        
      <div className="p-6 space-y-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
              <TabsTrigger value="schedules">{t("schedules")}</TabsTrigger>
              <TabsTrigger value="performance">{t("performance")}</TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsStaffDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("add_staff_member")}
            </Button>
          </div>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{t("total_staff")}</p>
                      <div className="text-2xl font-bold">{(staff as any[]).length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <UserCheck className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{t("active_staff")}</p>
                      <div className="text-2xl font-bold">
                        {(staff as any[]).filter((member: any) => member.isActive).length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{t("avg_commission")}</p>
                      <div className="text-2xl font-bold">
                        {(staff as any[]).length > 0 
                          ? `${((staff as any[]).reduce((acc: number, member: any) => acc + parseFloat(member.commissionRate), 0) / (staff as any[]).length).toFixed(1)}%`
                          : '0%'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("team_members")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center p-4 border border-slate-200 rounded-lg">
                          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                          <div className="ml-4 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (staff as any[])?.length > 0 ? (
                    (staff as any[]).map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-primary/30 transition-colors">
                        <div className="flex items-center">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <p className="font-medium text-slate-900">{member.name}</p>
                            <p className="text-sm text-slate-600 capitalize">{member.role}</p>
                            <div className="flex items-center mt-1 space-x-4">
                              {member.email && (
                                <div className="flex items-center text-xs text-slate-500">
                                  <span className="mr-1">📧</span>
                                  {member.email}
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center text-xs text-slate-500">
                                  <span className="mr-1">📞</span>
                                  {member.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? t("active") : t("inactive")}
                          </Badge>
                          <div className="text-sm text-slate-600">
                            {member.commissionRate}% {t("commission_rate_percent")}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(member)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            {t("edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleRemoveStaff(member)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {t("remove")}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">{t("no_staff_registered")}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsStaffDialogOpen(true)}
                      >
                        {t("add_first_staff")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <CardTitle>{t("weekly_schedules")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">{t("schedule_management_coming_soon")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>{t("staff_performance")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">{t("performance_analytics_coming_soon")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Staff Dialog */}
        <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("add_new_staff_member")}</DialogTitle>
            </DialogHeader>
            <Form {...staffForm}>
              <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4">
                <FormField
                  control={staffForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("full_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("full_name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={staffForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("role")}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Esteticista Sênior" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={staffForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email_optional")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={staffForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone_optional")}</FormLabel>
                      <FormControl>
                        <PhoneInputWithCountry
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="(11) 99999-9999"
                          disabled={staffForm.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={staffForm.control}
                  name="irdNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("ird_number_required")}</FormLabel>
                      <FormControl>
                        <Input placeholder="123.456.789-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={staffForm.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("specialties")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("list_specialties")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={staffForm.control}
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
                    control={staffForm.control}
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsStaffDialogOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createStaffMutation.isPending}
                  >
                    {createStaffMutation.isPending ? t("adding") : t("add_staff_member")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Dialog */}
        {editingStaff && (
          <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("edit_staff_member")}</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter staff member's name" {...field} />
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
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Senior Aesthetician" {...field} />
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
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
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
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <PhoneInputWithCountry
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="021 123 4567"
                            disabled={editForm.formState.isSubmitting}
                          />
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
                        <FormLabel>IRD Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-789" {...field} />
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
                        <FormLabel>Specialties</FormLabel>
                        <FormControl>
                          <Textarea placeholder="List specialties and certifications" {...field} />
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
                          <FormLabel>Commission Rate (%)</FormLabel>
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
                              Paid by Hours Worked
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
                        <FormLabel className="text-sm">{t("active_staff_member")}</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
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
                    >
                      {updateStaffMutation.isPending ? t("saving") : t("save_changes")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageLayout>
  );
}