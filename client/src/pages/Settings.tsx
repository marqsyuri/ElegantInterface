import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, MessageCircle, LogOut, Clock, User, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { insertUserSchema, insertBusinessHoursSchema, type BusinessHours } from "@shared/schema";
import { PublicLinkManager } from "@/components/PublicLinkManager";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const userFormSchema = insertUserSchema.omit({ id: true });
type UserFormData = z.infer<typeof userFormSchema>;

const businessHoursFormSchema = z.array(insertBusinessHoursSchema.omit({ userId: true }));
type BusinessHoursFormData = z.infer<typeof businessHoursFormSchema>;

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
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
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { isCollapsed } = useSidebar();
  const queryClient = useQueryClient();

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
    },
  });

  // Business hours query and mutation
  const { data: businessHours = [], isLoading: isLoadingHours } = useQuery({
    queryKey: ['/api/business-hours'],
    retry: false,
  });

  const [hoursForm, setHoursForm] = useState<BusinessHoursFormData>(() => {
    return daysOfWeek.map(day => {
      const existingHour = businessHours.find((h: BusinessHours) => h.dayOfWeek === day.value);
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      await apiRequest('PUT', '/api/auth/user', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: (error) => {
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
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <TopHeader title="Settings" subtitle="Manage your profile and system preferences" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Settings and Profile
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="hours" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Operating Hours
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Client Access
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">Professional Profile</h4>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="flex items-center space-x-4 mb-6">
                            <Avatar className="w-20 h-20">
                              <AvatarImage src={user?.profileImageUrl || ""} alt="Profile photo" />
                              <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Button type="button" variant="outline">
                                Change Photo
                              </Button>
                              <p className="text-sm text-slate-500 mt-1">JPG, PNG or GIF (max. 5MB)</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
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
                                  <FormLabel>Last Name</FormLabel>
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
                                <FormLabel>Email Address</FormLabel>
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
                                <FormLabel>Professional Registration</FormLabel>
                                <FormControl>
                                  <Input placeholder="Beauty Therapy Board NZ registration number" {...field} />
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
                                <FormLabel>Specialties</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe your specialties..."
                                    className="h-20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="pt-4">
                            <h5 className="font-medium text-slate-900 mb-4">Clinic Details</h5>
                            
                            <FormField
                              control={form.control}
                              name="clinicName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Clinic Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Clinic name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <FormField
                                control={form.control}
                                name="clinicCnpj"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Business Number</FormLabel>
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
                                    <FormLabel>Business Phone</FormLabel>
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
                                  <FormLabel>Complete Address</FormLabel>
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
                                  <FormLabel>WhatsApp Business</FormLabel>
                                  <FormControl>
                                    <Input placeholder="021 123 4567" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="pt-4">
                            <Button type="submit" disabled={updateProfileMutation.isPending}>
                              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">System Information</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center space-x-3 mb-3">
                            <HelpCircle className="h-5 w-5 text-blue-600" />
                            <h5 className="font-medium text-slate-900">Support</h5>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            Need help? Contact our support team for assistance with your clinic management system.
                          </p>
                          <Button variant="outline" size="sm">
                            Contact Support
                          </Button>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center space-x-3 mb-3">
                            <LogOut className="h-5 w-5 text-red-600" />
                            <h5 className="font-medium text-slate-900">Account</h5>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            Signed in as: {getUserName()}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => window.location.href = '/api/logout'}>
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="hours" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Operating Hours</h4>
                      <Button 
                        onClick={saveBusinessHours}
                        disabled={updateBusinessHoursMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updateBusinessHoursMutation.isPending ? 'Saving...' : 'Save Hours'}
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {daysOfWeek.map((day, index) => (
                        <div key={day.value} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <h5 className="font-medium text-slate-900 w-20">{day.label}</h5>
                              <Switch
                                checked={hoursForm[index]?.isOpen ?? true}
                                onCheckedChange={(checked) => handleBusinessHoursChange(index, 'isOpen', checked)}
                              />
                              <span className="text-sm text-slate-500">
                                {hoursForm[index]?.isOpen ? 'Open' : 'Closed'}
                              </span>
                            </div>
                          </div>

                          {hoursForm[index]?.isOpen && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Opening Time
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
                                  Closing Time
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
                                  Lunch Start
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
                                  Lunch End
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
                          <h5 className="font-medium text-blue-900">Operating Hours Information</h5>
                          <p className="text-sm text-blue-700 mt-1">
                            These hours will be used for appointment scheduling and client booking availability. 
                            Lunch breaks are automatically excluded from available appointment times.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                  <div className="space-y-6">
                    <h4 className="font-medium text-slate-900">Notification Preferences</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <h5 className="font-medium text-slate-900">Email Notifications</h5>
                            <p className="text-sm text-slate-500">Receive email alerts for new appointments</p>
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
                            <h5 className="font-medium text-slate-900">SMS Notifications</h5>
                            <p className="text-sm text-slate-500">Send appointment reminders via SMS</p>
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
                            <h5 className="font-medium text-slate-900">Push Notifications</h5>
                            <p className="text-sm text-slate-500">Real-time alerts in the app</p>
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
                            <h5 className="font-medium text-slate-900">Marketing Notifications</h5>
                            <p className="text-sm text-slate-500">Receive updates about new features and tips</p>
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
                          <h5 className="font-medium text-green-900">Notification Settings</h5>
                          <p className="text-sm text-green-700 mt-1">
                            Configure how and when you want to receive notifications about appointments, 
                            client communications, and system updates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}