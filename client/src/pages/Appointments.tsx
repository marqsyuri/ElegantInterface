import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, Camera, CalendarDays, CheckCircle, XCircle, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import PageLayout from "@/components/PageLayout";
import AppointmentCalendar from "@/components/AppointmentCalendar";
import AppointmentDetailsDialog from "@/components/AppointmentDetailsDialog";
import { insertAppointmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { enNZ } from "date-fns/locale";
import * as dateFnsTz from "date-fns-tz";
import { z } from "zod";

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").default(60),
  beforeImages: z.array(z.string()).optional(),
  afterImages: z.array(z.string()).optional(),
}).omit({ userId: true });

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      status: "scheduled",
      serviceType: "service",
      duration: 60,
      beforeImages: [],
      afterImages: [],
    },
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", selectedDate?.toISOString().split('T')[0]],
    queryFn: () => fetch(`/api/appointments/${selectedDate?.toISOString().split('T')[0]}`, {
      credentials: 'include'
    }).then(res => res.json()),
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

  const { data: procedures = [] } = useQuery({
    queryKey: ["/api/procedures"],
    retry: false,
  });

  // Combine services and procedures
  const allServices = [...(services as any[]), ...(procedures as any[])];

  // Reset search fields when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setClientSearch("");
      setServiceSearch("");
      setFilteredClients([]);
      setFilteredServices([]);
      setSelectedClient(null);
      setSelectedService(null);
      form.reset({
        status: "scheduled",
        serviceType: "service",
        duration: 60,
        beforeImages: [],
        afterImages: [],
      });
    }
  }, [isDialogOpen, form]);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      const { appointmentDate, appointmentTime, ...appointmentData } = data;
      
      await apiRequest('POST', '/api/appointments', {
        ...appointmentData,
        appointmentDate: appointmentDateTime.toISOString(),
        duration: data.duration || 60,
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
        description: "Appointment created successfully!",
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

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? 0 : 30;
    const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    const display = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    return { value: time24, label: display };
  });

  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  // Handle booking approval/rejection
  const handleApproveBooking = async (appointmentId: number) => {
    try {
      await apiRequest('PUT', `/api/appointments/${appointmentId}`, { status: 'confirmed' });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Booking Approved",
        description: "The appointment has been confirmed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve booking",
        variant: "destructive",
      });
    }
  };

  const handleRejectBooking = async (appointmentId: number) => {
    try {
      await apiRequest('PUT', `/api/appointments/${appointmentId}`, { status: 'cancelled' });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Booking Rejected",
        description: "The appointment has been cancelled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject booking",
        variant: "destructive",
      });
    }
  };

  const formatNZDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    const nzDate = dateFnsTz.toZonedTime(date, NZ_TIMEZONE);
    return format(nzDate, "EEEE, d MMMM yyyy 'at' h:mm a", { locale: enNZ });
  };

  const NZ_TIMEZONE = 'Pacific/Auckland';

  const formatNZTime = (dateString: string) => {
    const date = parseISO(dateString);
    const nzDate = dateFnsTz.toZonedTime(date, NZ_TIMEZONE);
    return format(nzDate, "h:mm a", { locale: enNZ });
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

  // Use appointments data directly since it already includes client and service details from the JOIN
  const appointmentsWithDetails = appointments as any[];
  


  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Appointments</h1>
            <p className="text-muted-foreground">Manage your client appointments with New Zealand time format</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              List
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
                  <Plus className="w-4 h-4" />
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
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Type to search clients..."
                                  value={clientSearch}
                                  onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    if (e.target.value.length >= 3) {
                                      const filtered = (clients as any[])?.filter((client: any) =>
                                        client.name.toLowerCase().includes(e.target.value.toLowerCase())
                                      ) || [];
                                      setFilteredClients(filtered);
                                    } else {
                                      setFilteredClients([]);
                                    }
                                  }}
                                />
                                {filteredClients.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {filteredClients.map((client: any) => (
                                      <div
                                        key={client.id}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                          setSelectedClient(client);
                                          setClientSearch(client.name);
                                          setFilteredClients([]);
                                          field.onChange(client.id);
                                        }}
                                      >
                                        {client.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
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
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Type to search services/procedures..."
                                  value={serviceSearch}
                                  onChange={(e) => {
                                    setServiceSearch(e.target.value);
                                    if (e.target.value.length >= 3) {
                                      const filtered = allServices?.filter((service: any) =>
                                        service.name.toLowerCase().includes(e.target.value.toLowerCase())
                                      ) || [];
                                      setFilteredServices(filtered);
                                    } else {
                                      setFilteredServices([]);
                                    }
                                  }}
                                />
                                {filteredServices.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {filteredServices.map((service: any) => (
                                      <div
                                        key={`${service.id}-${service.category || 'procedure'}`}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                          setSelectedService(service);
                                          setServiceSearch(service.name);
                                          setFilteredServices([]);
                                          field.onChange(service.id);
                                          // Set serviceType in form - if service has category, it's a service; otherwise it's a procedure
                                          form.setValue('serviceType', service.category ? 'service' : 'procedure');
                                        }}
                                      >
                                        <div className="flex justify-between items-center">
                                          <span>{service.name}</span>
                                          <span className="text-xs text-gray-500">
                                            {service.category || 'Procedure'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
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
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot.value} value={slot.value}>
                                    {slot.label}
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
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {durationOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
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
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                            <Textarea placeholder="Additional notes..." {...field} value={field.value || ""} />
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

                    <Button 
                      type="submit" 
                      className="w-full bg-green-700 hover:bg-green-800"
                      disabled={createAppointmentMutation.isPending}
                    >
                      {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          <AppointmentCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            appointments={Array.isArray(appointments) ? appointments : []}
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Appointments List
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="w-auto"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="text-center py-8">Loading appointments...</div>
                ) : !Array.isArray(appointments) || appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments scheduled for {format(selectedDate, "EEEE, d MMMM yyyy", { locale: enNZ })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(Array.isArray(appointments) ? appointments : [])
                      .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
                      .map((appointment: any) => {
                      const endTime = new Date(parseISO(appointment.appointmentDate).getTime() + (appointment.duration || 60) * 60000);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className="p-4 border rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(appointment.status)}
                                <Badge className={getStatusColor(appointment.status)}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-lg">{appointment.client.name}</h3>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatNZTime(appointment.appointmentDate)} - {formatNZTime(endTime.toISOString())}
                              ({appointment.duration || 60} mins)
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Service</p>
                              <p className="font-medium">{appointment.service.name}</p>
                            </div>
                            {appointment.client.phone && (
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{appointment.client.phone}</p>
                              </div>
                            )}
                          </div>
                          
                          {appointment.notes && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground">Notes</p>
                              <p className="text-sm">{appointment.notes}</p>
                            </div>
                          )}
                          
                          {(appointment.beforeImages?.length > 0 || appointment.afterImages?.length > 0) && (
                            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                              {appointment.beforeImages?.length > 0 && (
                                <span>📷 {appointment.beforeImages.length} before photo(s)</span>
                              )}
                              {appointment.afterImages?.length > 0 && (
                                <span>📷 {appointment.afterImages.length} after photo(s)</span>
                              )}
                            </div>
                          )}

                          {/* Approval buttons for pending bookings */}
                          {appointment.status === 'pending' && (
                            <div className="mt-4 flex space-x-2 pt-3 border-t">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveBooking(appointment.id);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve Booking
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectBooking(appointment.id);
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Appointment Details Dialog */}
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedAppointment(null);
          }}
        />
      </div>
    </PageLayout>
  );
}