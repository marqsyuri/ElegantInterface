import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, MessageCircle, LogOut, Clock, User, Bell, Upload, Users, Trash2, Edit, Image, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { insertUserSchema, insertBusinessHoursSchema, insertStaffSchema, type BusinessHours, type Staff } from "@shared/schema";
import { PublicLinkManager } from "@/components/PublicLinkManager";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
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
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");

  const { user } = useAuth();

  useEffect(() => {
    if (user?.heroImageUrl) {
      setHeroImageUrl(user.heroImageUrl);
    }
  }, [user?.heroImageUrl]);
  const { toast } = useToast();
  const { isExpanded } = useSidebar();
  const queryClient = useQueryClient();

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
      specialties: z.string().optional(),
      commissionRate: z.number().min(0).max(100),
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
        specialties: "",
        commissionRate: 0,
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
          description: "Staff member updated successfully",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error", 
          description: `Failed to update staff member: ${error.message}`,
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
          description: "Staff member removed successfully",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error", 
          description: `Failed to remove staff member: ${error.message}`,
          variant: "destructive",
        });
      },
    });

    const handleRemoveStaff = (staffMember: Staff) => {
      if (confirm(`Are you sure you want to remove ${staffMember.name} from the team?`)) {
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
        specialties: staffMember.specialties || "",
        commissionRate: staffMember.commissionRate,
        isActive: staffMember.isActive ?? true,
      });
    };

    const onEditSubmit = (data: StaffFormData) => {
      if (editingStaff) {
        updateStaffMutation.mutate({ id: editingStaff.id, data });
      }
    };

    if (staffLoading) {
      return <div className="p-4 text-center text-slate-500">Loading team members...</div>;
    }

    return (
      <div className="space-y-6">
        <h4 className="font-medium text-slate-900">Team Members Management</h4>
        
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
                        {member.isActive ? 'Active' : 'Inactive'}
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
                          Specialties: {member.specialties}
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
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto p-4">
                      <DialogHeader className="pb-2">
                        <DialogTitle>Edit Staff Member</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
                            <FormField
                              control={editForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Staff member name" {...field} />
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
                                  <FormLabel>Email</FormLabel>
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
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="021 123 4567" {...field} />
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
                                  <FormLabel className="text-sm">Active</FormLabel>
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
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateStaffMutation.isPending}
                          onClick={editForm.handleSubmit(onEditSubmit)}
                        >
                          {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
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
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h5 className="font-medium text-slate-900 mb-2">No team members yet</h5>
            <p className="text-slate-500 mb-4">Add staff members to manage your team and schedules</p>
            <Button variant="outline" onClick={() => window.location.href = '/staff'}>
              <Users className="w-4 h-4 mr-2" />
              Go to Staff Management
            </Button>
          </div>
        )}

        <div className="p-4 border border-slate-200 rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">Team Management</h5>
              <p className="text-sm text-blue-700 mt-1">
                Manage your team members here. You can edit their information, schedules, and remove them from the team. 
                For full staff management including adding new members, use the Staff page from the main menu.
              </p>
            </div>
          </div>
        </div>
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
    },
  });

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
        console.log('Making API request to /api/objects/upload');
        const response = await apiRequest('POST', '/api/objects/upload', {});
        console.log('API response status:', response.status);
        console.log('API response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
        console.log('Parsed upload response data:', data);
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
      console.log('Starting hero image upload for file:', file.name);
      
      // Resize and compress image
      const resizedFile = await resizeAndCompressImage(file, 1200, 0.7);
      console.log('Image resized successfully:', resizedFile.size, 'bytes');
      
      // Get upload URL
      const uploadURL = await getUploadUrlMutation.mutateAsync();
      console.log('Got upload URL:', uploadURL);
      
      // Upload to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: resizedFile,
        headers: {
          'Content-Type': 'image/jpeg'
        }
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed with response:', errorText);
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`);
      }

      // Convert upload URL to object path for saving
      const objectPath = uploadURL.split('?')[0]; // Remove query params
      console.log('Object path for hero image:', objectPath);
      
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
      return await response.json();
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
      
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0",
        isExpanded ? "lg:ml-72" : "lg:ml-16"
      )}>
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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="hours" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Operating Hours
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team Members
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
                                      console.log('Upload response:', uploadResponse);
                                      
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
                                      console.log('Object path:', objectPath);
                                      
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
                                  <p className="text-gray-600 font-medium">Click to upload</p>
                                  <p className="text-sm text-gray-400">JPG or PNG, max 10MB</p>
                                </div>
                              </div>
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

                <TabsContent value="link" className="space-y-6">
                  {/* Hero Image Upload Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Hero Image
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Upload a hero image for your client booking page. This image will be displayed at the top of your public booking page.
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
                            Upload Hero Image
                          </h3>
                          <p className="text-sm text-slate-600 mb-4">
                            Drop your image here or click to browse
                          </p>
                          <p className="text-xs text-slate-500">
                            JPG, PNG up to 10MB
                          </p>
                        </label>
                      </div>

                      {/* Resolution Recommendations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Monitor className="h-5 w-5 text-slate-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Desktop</p>
                            <p className="text-xs text-slate-600">Recommended: 1920x600px</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Smartphone className="h-5 w-5 text-slate-600" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">Mobile</p>
                            <p className="text-xs text-slate-600">Optimised automatically</p>
                          </div>
                        </div>
                      </div>

                      {/* Loading indicator */}
                      {(heroImageUploadMutation.isPending || getUploadUrlMutation.isPending) && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2 text-sm text-slate-600">Uploading...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Public Link Manager */}
                  {user && <PublicLinkManager user={user} />}
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

                <TabsContent value="team" className="mt-6">
                  <TeamMembersSection />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}