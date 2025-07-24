import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Clock, DollarSign, Mail, Phone, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertStaffSchema, insertStaffScheduleSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const staffFormSchema = insertStaffSchema.omit({ userId: true });
const scheduleFormSchema = insertStaffScheduleSchema.omit({ staffId: true });

type StaffFormData = z.infer<typeof staffFormSchema>;
type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

export default function Staff() {
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      isActive: true,
      commissionRate: "10",
      specialties: [],
    },
  });

  const scheduleForm = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      isAvailable: true,
    },
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["/api/staff"],
    retry: false,
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/staff-schedules"],
    retry: false,
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      await apiRequest('POST', '/api/staff', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsStaffDialogOpen(false);
      staffForm.reset();
      toast({
        title: "Success",
        description: "Staff member added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData & { staffId: number }) => {
      await apiRequest('POST', '/api/staff-schedules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-schedules"] });
      setIsScheduleDialogOpen(false);
      scheduleForm.reset();
      toast({
        title: "Success",
        description: "Schedule updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onStaffSubmit = (data: StaffFormData) => {
    createStaffMutation.mutate(data);
  };

  const onScheduleSubmit = (data: ScheduleFormData) => {
    if (selectedStaffId) {
      createScheduleMutation.mutate({ ...data, staffId: selectedStaffId });
    }
  };

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const roles = [
    { value: 'therapist', label: 'Beauty Therapist' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'manager', label: 'Manager' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <TopHeader title="Staff Management" subtitle="Manage your team members and schedules" />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
              <p className="text-slate-600 mt-1">Manage your team members and schedules</p>
            </div>
            <Button onClick={() => setIsStaffDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Total Staff</p>
                        <div className="text-2xl font-bold">{staff.length}</div>
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
                          {staff.filter((member: any) => member.isActive).length}
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
                          {staff.length > 0 
                            ? `${(staff.reduce((acc: number, member: any) => acc + parseFloat(member.commissionRate), 0) / staff.length).toFixed(1)}%`
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
                    ) : staff?.length > 0 ? (
                      staff.map((member: any) => (
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
                                    <Mail className="w-3 h-3 mr-1" />
                                    {member.email}
                                  </div>
                                )}
                                {member.phone && (
                                  <div className="flex items-center text-xs text-slate-500">
                                    <Phone className="w-3 h-3 mr-1" />
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
                              onClick={() => {
                                setSelectedStaffId(member.id);
                                setIsScheduleDialogOpen(true);
                              }}
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              Schedule
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Staff Member</th>
                          {daysOfWeek.map(day => (
                            <th key={day} className="text-center p-2 capitalize">{day.slice(0, 3)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map((member: any) => (
                          <tr key={member.id} className="border-b">
                            <td className="p-2 font-medium">{member.name}</td>
                            {daysOfWeek.map(day => {
                              const daySchedule = schedules.find((s: any) => 
                                s.staffId === member.id && s.dayOfWeek === day
                              );
                              return (
                                <td key={day} className="text-center p-2">
                                  {daySchedule ? (
                                    <Badge variant="outline" className="text-xs">
                                      {daySchedule.startTime} - {daySchedule.endTime}
                                    </Badge>
                                  ) : (
                                    <span className="text-slate-400">Off</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  <p className="text-slate-500 text-center py-8">
                    Performance analytics coming soon...
                  </p>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="staff@example.com" {...field} />
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
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="021 123 4567" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-3">
                    <Button type="submit" disabled={createStaffMutation.isPending}>
                      {createStaffMutation.isPending ? "Adding..." : "Add Staff Member"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Schedule Dialog */}
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Update Schedule</DialogTitle>
              </DialogHeader>
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(onScheduleSubmit)} className="space-y-4">
                  <FormField
                    control={scheduleForm.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={scheduleForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={scheduleForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button type="submit" disabled={createScheduleMutation.isPending}>
                      {createScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}