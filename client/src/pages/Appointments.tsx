import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, Camera, CalendarDays, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import PageLayout from "@/components/PageLayout";
import { insertAppointmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  beforeImages: z.array(z.string()).optional(),
  afterImages: z.array(z.string()).optional(),
}).omit({ userId: true });

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      status: "scheduled",
      beforeImages: [],
      afterImages: [],
    },
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", { date: selectedDate?.toISOString().split('T')[0] }],
    retry: false,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    retry: false,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      const { appointmentDate, appointmentTime, ...appointmentData } = data;
      
      await apiRequest('POST', '/api/appointments', {
        ...appointmentData,
        appointmentDate: appointmentDateTime.toISOString(),
        beforeImages: beforeImages,
        afterImages: afterImages,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      form.reset();
      setBeforeImages([]);
      setAfterImages([]);
      toast({
        title: "Success",
        description: "Appointment created successfully with photos!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-50 border-green-100 text-green-700";
      case "cancelled":
        return "bg-red-50 border-red-100 text-red-700";
      case "completed":
        return "bg-blue-50 border-blue-100 text-blue-700";
      default:
        return "bg-yellow-50 border-yellow-100 text-yellow-700";
    }
  };

  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Appointments</h1>
          <p className="text-muted-foreground">Manage your client appointments with before/after photos</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Calendar and Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="date"
                    value={selectedDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-full"
                  />
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-700 hover:bg-green-800 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        New Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Create New Appointment
                        </DialogTitle>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="clientId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Client</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select client" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {(clients as any[])?.map((client: any) => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                          {client.name}
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
                              name="serviceId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select service" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {(services as any[])?.map((service: any) => (
                                        <SelectItem key={service.id} value={service.id.toString()}>
                                          {service.name}
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
                              name="appointmentDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="appointmentTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select time" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {timeSlots.map((time) => (
                                        <SelectItem key={time} value={time}>
                                          {time}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Additional notes..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Tabs defaultValue="before" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="before">Before Photos</TabsTrigger>
                              <TabsTrigger value="after">After Photos</TabsTrigger>
                            </TabsList>
                            <TabsContent value="before" className="space-y-4">
                              <FileUpload
                                files={beforeImages}
                                onFilesChange={setBeforeImages}
                                maxFiles={5}
                                label="Upload Before Photos"
                              />
                            </TabsContent>
                            <TabsContent value="after" className="space-y-4">
                              <FileUpload
                                files={afterImages}
                                onFilesChange={setAfterImages}
                                maxFiles={5}
                                label="Upload After Photos"
                              />
                            </TabsContent>
                          </Tabs>

                          <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createAppointmentMutation.isPending}>
                              {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Appointments List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointments for {selectedDate?.toLocaleDateString('en-NZ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No appointments scheduled for this date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(appointments as any[]).map((appointment) => (
                      <div key={appointment.id} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 border border-green-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">
                                {appointment.client?.name || 'Unknown Client'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {appointment.service?.name || 'Unknown Service'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(appointment.appointmentDate).toLocaleTimeString('en-NZ', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                            {appointment.notes}
                          </p>
                        )}

                        {/* Before/After Photos Preview */}
                        {(appointment.beforeImages?.length > 0 || appointment.afterImages?.length > 0) && (
                          <div className="space-y-3">
                            {appointment.beforeImages?.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-2">Before Photos</h4>
                                <div className="flex gap-2 overflow-x-auto">
                                  {appointment.beforeImages.map((image: string, index: number) => (
                                    <img
                                      key={index}
                                      src={image}
                                      alt={`Before ${index + 1}`}
                                      className="w-16 h-16 object-cover rounded-lg border border-border flex-shrink-0"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {appointment.afterImages?.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-2">After Photos</h4>
                                <div className="flex gap-2 overflow-x-auto">
                                  {appointment.afterImages.map((image: string, index: number) => (
                                    <img
                                      key={index}
                                      src={image}
                                      alt={`After ${index + 1}`}
                                      className="w-16 h-16 object-cover rounded-lg border border-border flex-shrink-0"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}