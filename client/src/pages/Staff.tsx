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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import TopHeader from "@/components/TopHeader";
import PageLayout from "@/components/PageLayout";
import { type Staff } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Staff form schema
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

export default function Staff() {
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
      phone: "",
      specialties: "",
      commissionRate: 0,
      isActive: true,
    },
  });

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

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      await apiRequest('POST', '/api/staff', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      setIsStaffDialogOpen(false);
      staffForm.reset();
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: `Failed to add staff member: ${error.message}`,
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

  const handleRemoveStaff = (staffMember: Staff) => {
    if (confirm(`Are you sure you want to remove ${staffMember.name} from the team?`)) {
      deleteStaffMutation.mutate(staffMember.id);
    }
  };

  return (
    <PageLayout>
      <TopHeader title="Staff Management" subtitle="Manage your team members and schedules" />
        
      <div className="p-6 space-y-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsStaffDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </div>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Total Staff</p>
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
                      <p className="text-sm font-medium text-slate-600">Active Staff</p>
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
                      <p className="text-sm font-medium text-slate-600">Avg Commission</p>
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
                <CardTitle>Team Members</CardTitle>
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
                            {member.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <div className="text-sm text-slate-600">
                            {member.commissionRate}% commission
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(member)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleRemoveStaff(member)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No staff members registered</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsStaffDialogOpen(true)}
                      >
                        Add first staff member
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
                <CardTitle>Weekly Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Schedule management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Performance analytics coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Staff Dialog */}
        <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <Form {...staffForm}>
              <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4">
                <FormField
                  control={staffForm.control}
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
                  control={staffForm.control}
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
                  control={staffForm.control}
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
                  control={staffForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="021 123 4567" {...field} />
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
                      <FormLabel>Specialties</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List specialties and certifications" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={staffForm.control}
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsStaffDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createStaffMutation.isPending}
                  >
                    {createStaffMutation.isPending ? "Adding..." : "Add Staff Member"}
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
                <DialogTitle>Edit Staff Member</DialogTitle>
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
                        <FormLabel className="text-sm">Active Staff Member</FormLabel>
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
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateStaffMutation.isPending}
                    >
                      {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
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