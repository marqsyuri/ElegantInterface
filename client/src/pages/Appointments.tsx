import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, Camera, CalendarDays, CheckCircle, XCircle, List, Search } from "lucide-react";
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
import FunctionalCalendar from "@/components/FunctionalCalendar";
import { ProcedureMultiSelect } from "@/components/ProcedureMultiSelect";
import { TimeSlotAlert } from "@/components/TimeSlotAlert";
import { insertAppointmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { format, parseISO } from "date-fns";
import * as dateFnsTz from "date-fns-tz";
import { z } from "zod";
import { useLocale } from "@/contexts/LocaleContext";
import { createAppointmentDateTime, formatNZTime, formatNZDate } from "@/lib/timezoneUtils";
import { getDateLocale, getLocaleString } from "@/lib/dateLocale";

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").default(60),
  totalAmount: z.string().optional(),
  paidAmount: z.string().optional(),
  beforeImages: z.array(z.string()).optional(),
  afterImages: z.array(z.string()).optional(),
}).omit({ userId: true });

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  const { t, language } = useLocale();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const dateLocale = getDateLocale(language);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<number[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [calculatedDuration, setCalculatedDuration] = useState<number>(0);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('week'); // Default to week view
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [showAll, setShowAll] = useState(true); // Default to true for calendar view to show all appointments
  const [quickSearch, setQuickSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      status: "scheduled",
      serviceType: "service",
      duration: 60,
      totalAmount: "",
      paidAmount: "",
      beforeImages: [],
      afterImages: [],
    },
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", showAll ? 'all' : selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      const url = showAll 
        ? '/api/appointments/all' 
        : `/api/appointments/${selectedDate?.toISOString().split('T')[0]}`;
      
      console.log('🔍 Fetching appointments from:', url, 'showAll:', showAll);
      
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      
      console.log('📅 API Response:', {
        url,
        status: response.status,
        dataLength: Array.isArray(data) ? data.length : 'not array',
        data: Array.isArray(data) ? data.map(a => ({
          id: a.id,
          date: a.appointmentDate,
          client: a.client?.name
        })) : data
      });
      
      return data;
    },
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

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
    retry: false,
  });

  const { data: businessHours = [] } = useQuery({
    queryKey: ["/api/business-hours"],
    retry: false,
  });

  // Reset search fields when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setClientSearch("");
      setFilteredClients([]);
      setSelectedClient(null);
      setSelectedProcedureIds([]);
      setSelectedStaffId("");
      setCalculatedTotal(0);
      setCalculatedDuration(0);
      setBeforeImages([]);
      setAfterImages([]);
      form.reset({
        status: "scheduled",
        serviceType: "service",
        duration: 60,
        totalAmount: "",
        paidAmount: "",
        beforeImages: [],
        afterImages: [],
      });
    }
  }, [isDialogOpen, form]);

  // Note: Availability checking is now handled by useTimeSlots hook
  // The backend will perform final conflict checking during appointment creation

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Validation
      if (selectedProcedureIds.length === 0) {
        throw new Error(t('please_select_procedure'));
      }
      if (!selectedClient) {
        throw new Error(t('please_select_client'));
      }
      if (!selectedStaffId) {
        throw new Error(t('please_select_staff'));
      }

      const appointmentDateTime = createAppointmentDateTime(data.appointmentDate, data.appointmentTime);
      
      // Note: Availability is already checked by useTimeSlots hook
      // The backend will handle final conflict checking
      
      // Get selected procedures data
      const selectedProcs = (procedures as any[]).filter(p => selectedProcedureIds.includes(p.id));
      const proceduresToAdd = selectedProcs.map(proc => ({
        procedureId: proc.id,
        procedureName: proc.name,
        procedurePrice: parseFloat(proc.price || '0'),
        procedureDuration: proc.duration || 60,
        procedureMaterials: proc.materials || '',
      }));

      const payload = {
        clientId: selectedClient.id,
        staffId: parseInt(selectedStaffId),
        appointmentDate: appointmentDateTime,
        status: data.status,
        notes: data.notes || '',
        procedureIds: selectedProcedureIds,
        totalAmount: calculatedTotal,
        totalDuration: calculatedDuration,
        beforeImages,
        afterImages,
      };

      await apiRequest('POST', '/api/appointments/with-procedures', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      form.reset();
      setBeforeImages([]);
      setAfterImages([]);
      setSelectedProcedureIds([]);
      setSelectedStaffId("");
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "Appointment created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Use dynamic time slots based on business hours and availability
  const { timeSlots, loading: timeSlotsLoading } = useTimeSlots({
    selectedDate: form.watch('appointmentDate') || '',
    selectedStaffId: selectedStaffId,
    duration: calculatedDuration || 60,
    businessHours: businessHours as any[]
  });

  // Debug logs
  console.log('🔍 Appointments.tsx debug:', {
    selectedDate: form.watch('appointmentDate'),
    selectedStaffId,
    calculatedDuration,
    businessHoursLength: businessHours.length,
    businessHours,
    timeSlotsLength: timeSlots.length,
    timeSlots,
    timeSlotsLoading,
    totalAppointments: appointments.length
  });

  // Additional debug for form state
  console.log('📝 Form state debug:', {
    appointmentDate: form.watch('appointmentDate'),
    staffId: form.watch('staffId'),
    procedures: form.watch('procedures'),
    formValues: form.getValues()
  });

  // Check for Clebinho's appointment in the main appointments list
  const clebinhoInMainList = appointments.find(a => 
    a.client?.name?.toLowerCase().includes('clebinho') || 
    a.client?.name?.toLowerCase().includes('seixas')
  );
  
  if (clebinhoInMainList) {
    console.log('🎯 Clebinho found in main appointments list:', {
      id: clebinhoInMainList.id,
      date: clebinhoInMainList.appointmentDate,
      client: clebinhoInMainList.client?.name
    });
  } else {
    console.log('❌ Clebinho NOT found in main appointments list');
  }

  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  const onSubmit = async (data: AppointmentFormData) => {
    console.log('📝 Submitting appointment form:', {
      date: data.appointmentDate,
      time: data.appointmentTime,
      staffId: selectedStaffId,
      duration: calculatedDuration || 60
    });

    // Let the backend handle availability checking to avoid conflicts
    console.log('✅ Creating appointment...');
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
    return format(date, "EEEE, d MMMM yyyy 'at' h:mm a", { locale: dateLocale });
  };

  const getPaymentStatus = (appointment: any) => {
    const total = parseFloat(appointment.totalAmount || '0');
    const paid = parseFloat(appointment.paidAmount || '0');
    
    if (total === 0) return 'no-amount';
    if (paid === 0) return 'unpaid';
    if (paid >= total) return 'paid';
    return 'partial';
  };

  const getPaymentBadge = (appointment: any) => {
    const status = getPaymentStatus(appointment);
    const config = {
      'no-amount': { 
        variant: 'bg-gray-100 text-gray-600 hover:bg-gray-200', 
        label: 'No Amount', 
        icon: '💰' 
      },
      'unpaid': { 
        variant: 'bg-red-100 text-red-700 hover:bg-red-200', 
        label: 'Unpaid', 
        icon: '❌' 
      },
      'partial': { 
        variant: 'bg-orange-100 text-orange-700 hover:bg-orange-200', 
        label: 'Partial', 
        icon: '⚠️' 
      },
      'paid': { 
        variant: 'bg-green-100 text-green-700 hover:bg-green-200', 
        label: 'Paid', 
        icon: '✅' 
      },
    };
    
    const { variant, label, icon } = config[status as keyof typeof config];
    return { variant, label, icon };
  };



  // Quick search filter function
  const filterAppointments = (appointments: any[]) => {
    if (!quickSearch.trim()) return appointments;
    
    const searchTerm = quickSearch.toLowerCase().trim();
    
    return appointments.filter((appointment: any) => {
      // Search in client name
      const clientName = appointment.client?.name?.toLowerCase() || '';
      if (clientName.includes(searchTerm)) return true;
      
      // Search in client phone
      const clientPhone = appointment.client?.phone?.toLowerCase() || '';
      if (clientPhone.includes(searchTerm)) return true;
      
      // Search in staff IRD number
      const staffIrd = appointment.staff?.irdNumber?.toLowerCase() || '';
      if (staffIrd.includes(searchTerm)) return true;
      
      // Search in appointment status
      const status = appointment.status?.toLowerCase() || '';
      if (status.includes(searchTerm)) return true;
      
      // Search in procedure names
      if (appointment.allProcedures && Array.isArray(appointment.allProcedures)) {
        const procedureNames = appointment.allProcedures
          .map((p: any) => (p.procedureName || p.name || '').toLowerCase())
          .join(' ');
        if (procedureNames.includes(searchTerm)) return true;
      }
      
      // Search in service name (fallback)
      const serviceName = appointment.service?.name?.toLowerCase() || '';
      if (serviceName.includes(searchTerm)) return true;
      
      return false;
    });
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
  
  // Debug log for appointmentsWithDetails
  console.log('🔍 appointmentsWithDetails debug:', {
    length: appointmentsWithDetails.length,
    appointments: appointmentsWithDetails.map(a => ({
      id: a.id,
      date: a.appointmentDate,
      client: a.client?.name
    }))
  });
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appointmentParam = params.get("appointmentId");

    if (!appointmentParam || !Array.isArray(appointments) || appointments.length === 0) {
      return;
    }

    const appointmentId = parseInt(appointmentParam, 10);
    if (Number.isNaN(appointmentId)) {
      return;
    }

    const foundAppointment = appointments.find((appointment: any) => appointment.id === appointmentId);

    if (foundAppointment) {
      if (!selectedAppointment || selectedAppointment.id !== foundAppointment.id) {
        setSelectedAppointment(foundAppointment);
      }
      if (!isDetailsDialogOpen) {
        setIsDetailsDialogOpen(true);
      }

      params.delete("appointmentId");
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [appointments, isDetailsDialogOpen, selectedAppointment]);



  return (
    <PageLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('appointments_title')}</h1>
            <p className="text-muted-foreground">{t('appointments_subtitle')}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex rounded-lg border p-1 bg-background">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{t('calendar_view')}</span>
                <span className="xs:hidden">{t('calendar_view').substring(0, 3)}</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{t('list_view')}</span>
                <span className="xs:hidden">{t('list_view')}</span>
              </Button>
            </div>
            
            {/* Calendar View Toggle - only show when calendar mode is selected */}
            {viewMode === 'calendar' && (
              <div className="flex rounded-lg border p-1 bg-background">
                <Button
                  variant={calendarView === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('month')}
                  className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{t('month_view')}</span>
                  <span className="xs:hidden">{t('month_view').substring(0, 1)}</span>
                </Button>
                <Button
                  variant={calendarView === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('week')}
                  className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{t('week_view')}</span>
                  <span className="xs:hidden">{t('week_view').substring(0, 1)}</span>
                </Button>
              </div>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden xs:inline">{t('new_appointment_button')}</span>
                  <span className="xs:hidden">{t('new_appointment_button').substring(0, 3)}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Camera className="w-5 h-5" />
                    {t('create_new_appointment')}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    <div className="space-y-4">
                      {/* Client Selection */}
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('client_label')} *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder={t('type_to_search_clients')}
                                  value={clientSearch}
                                  onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    if (e.target.value.length >= 2) {
                                      const filtered = (clients as any[])?.filter((client: any) =>
                                        client.name.toLowerCase().includes(e.target.value.toLowerCase())
                                      ) || [];
                                      setFilteredClients(filtered);
                                    } else {
                                      setFilteredClients([]);
                                    }
                                  }}
                                  className={selectedClient ? "border-green-500" : ""}
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

                      {/* Procedures Multi-Select */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('procedures_label')} *</label>
                        <ProcedureMultiSelect
                          procedures={procedures as any[]}
                          selectedProcedureIds={selectedProcedureIds}
                          onSelectionChange={setSelectedProcedureIds}
                          onTotalChange={(price, duration) => {
                            setCalculatedTotal(price);
                            setCalculatedDuration(duration);
                            form.setValue('totalAmount', price.toFixed(2));
                            form.setValue('duration', duration);
                            // Auto-fill duration field
                            form.setValue('duration', duration);
                          }}
                          showSummary={true}
                        />
                      </div>

                      {/* Staff Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('professional_label')} *</label>
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                          <SelectTrigger className={selectedStaffId ? "border-green-500" : ""}>
                            <SelectValue placeholder={t('select_professional')} />
                          </SelectTrigger>
                          <SelectContent>
                            {(staff as any[]).map((member: any) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{member.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                      <FormField
                        control={form.control}
                        name="appointmentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('date_label')}</FormLabel>
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
                            <FormLabel>{t('time_label')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('select_time')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlotsLoading ? (
                                  <SelectItem value="loading" disabled>
                                    {t('loading_times')}
                                  </SelectItem>
                                ) : timeSlots.length === 0 ? (
                                  <SelectItem value="no-slots" disabled>
                                    {t('no_times_available')}
                                  </SelectItem>
                                ) : (
                                  timeSlots.map((slot) => (
                                    <SelectItem 
                                      key={slot.value} 
                                      value={slot.value}
                                      disabled={!slot.available}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>{slot.label}</span>
                                        {!slot.available && (
                                          <span className="text-xs text-red-500 ml-2">
                                            {t('booked')}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Time Slot Alert */}
                      {timeSlots.length === 0 && form.watch('appointmentDate') && selectedStaffId && (
                        <TimeSlotAlert
                          message={t('no_times_available_date')}
                          type="warning"
                        />
                      )}

                      {/* Duration is auto-calculated from selected procedures */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('total_duration')}</label>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>{t('total_duration')}:</strong> {calculatedDuration} {t('minutes')}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {t('automatically_calculated')}
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('status')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('select_status')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
                                <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                                <SelectItem value="completed">{t('completed')}</SelectItem>
                                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="totalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('total_amount')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('paid_amount')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </FormControl>
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
                            <FormLabel>{t('notes_label')}</FormLabel>
                            <FormControl>
                              <Textarea placeholder={t('additional_notes')} {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Tabs defaultValue="before" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-auto">
                        <TabsTrigger value="before" className="text-xs sm:text-sm py-2">
                          <span className="hidden xs:inline">{t('before_photos')}</span>
                          <span className="xs:hidden">{t('before_photos').substring(0, 6)}</span>
                        </TabsTrigger>
                        <TabsTrigger value="after" className="text-xs sm:text-sm py-2">
                          <span className="hidden xs:inline">{t('after_photos')}</span>
                          <span className="xs:hidden">{t('after_photos').substring(0, 5)}</span>
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="before" className="space-y-4">
                        <FileUpload
                          files={beforeImages}
                          onFilesChange={setBeforeImages}
                          maxFiles={5}
                          label={t('upload_before_photos')}
                        />
                      </TabsContent>
                      <TabsContent value="after" className="space-y-4">
                        <FileUpload
                          files={afterImages}
                          onFilesChange={setAfterImages}
                          maxFiles={5}
                          label={t('upload_after_photos')}
                        />
                      </TabsContent>
                    </Tabs>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createAppointmentMutation.isPending}
                    >
                      {createAppointmentMutation.isPending ? t('creating') : t('new_appointment_button')}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          <FunctionalCalendar
            appointments={appointmentsWithDetails}
            viewType={calendarView}
            onDateSelect={(date) => {
              setSelectedDate(date);
              // Removed setShowAll(false) to prevent filtering when clicking on calendar days
            }}
            onAppointmentClick={(appointment) => {
              setSelectedAppointment(appointment);
              setIsDetailsDialogOpen(true);
            }}
            onCreateAppointment={() => setIsDialogOpen(true)}
            selectedDate={selectedDate}
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <List className="w-5 h-5" />
                    {t('appointments_list')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showAll ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="text-xs sm:text-sm"
                    >
                      Show All
                    </Button>
                    {!showAll && (
                      <Input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="w-full xs:w-auto text-sm"
                      />
                    )}
                  </div>
                </div>
                {/* Quick Search Filter */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name, phone, IRD, status, or procedure..."
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {quickSearch && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Searching: {quickSearch}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="text-center py-8">Loading appointments...</div>
                ) : !Array.isArray(appointments) || appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {showAll ? 'No appointments found' : `No appointments scheduled for ${format(selectedDate, "EEEE, d MMMM yyyy", { locale: dateLocale })}`}
                  </div>
                ) : filterAppointments(appointments).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No appointments match your search "{quickSearch}"
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filterAppointments(Array.isArray(appointments) ? appointments : [])
                      .sort((a: any, b: any) => showAll 
                        ? new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
                        : new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
                      )
                      .map((appointment: any) => {
                      const endTime = new Date(parseISO(appointment.appointmentDate).getTime() + (appointment.duration || 60) * 60000);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className="p-3 sm:p-4 border rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <div className="flex flex-col gap-3">
                            {/* Top section with client name and time */}
                            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                              <h3 className="font-semibold text-base sm:text-lg">{appointment.client.name}</h3>
                              <div className="text-sm text-muted-foreground">
                                <div className="xs:text-right">
                                  <div className="font-medium">
                                    {format(parseISO(appointment.appointmentDate), "dd/MM/yyyy", { locale: dateLocale })} • {formatNZTime(appointment.appointmentDate)} - {formatNZTime(endTime.toISOString())}
                                  </div>
                                  <div className="text-xs">({appointment.duration || 60} mins)</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Status badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              {getStatusIcon(appointment.status)}
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                              {(() => {
                                const paymentBadge = getPaymentBadge(appointment);
                                return (
                                  <Badge className={`${paymentBadge.variant} flex items-center gap-1`}>
                                    <span>{paymentBadge.icon}</span>
                                    <span className="hidden xs:inline">{paymentBadge.label}</span>
                                  </Badge>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mt-3">
                            <div className="col-span-full">
                              <p className="text-xs sm:text-sm text-muted-foreground">Procedure(s) to Perform</p>
                              {appointment.allProcedures && appointment.allProcedures.length > 0 ? (
                                <div className="space-y-1">
                                  {appointment.allProcedures.map((procedure: any, index: number) => (
                                    <div key={procedure.id || index} className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                                      <span className="font-medium text-blue-900">{procedure.name}</span>
                                      <div className="flex gap-2 text-xs text-blue-700">
                                        <span>{procedure.duration}min</span>
                                        <span>NZ${parseFloat(procedure.price || '0').toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="pt-2 border-t border-gray-200">
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                      <span>Total Duration:</span>
                                      <span className="text-blue-600">{appointment.duration} minutes</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{appointment.service.name}</span>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                      <span>{appointment.duration}min</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Total to Charge</p>
                              <p className="font-semibold text-green-600 text-lg">
                                {appointment.totalAmount ? `NZ$${parseFloat(appointment.totalAmount).toFixed(2)}` : 'No amount set'}
                              </p>
                              {parseFloat(appointment.paidAmount || '0') > 0 && (
                                <p className="text-xs text-blue-600">Already paid: NZ$${parseFloat(appointment.paidAmount).toFixed(2)}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Client Contact</p>
                              <p className="font-medium text-sm">{appointment.client.phone}</p>
                              <p className="text-xs text-muted-foreground">{appointment.client.email}</p>
                            </div>
                          </div>
                          
                          {(appointment.paidAmount && parseFloat(appointment.paidAmount) > 0) && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">Payment Status</p>
                              <p className="text-sm">
                                Paid: <span className="font-semibold text-blue-600">NZ$${parseFloat(appointment.paidAmount).toFixed(2)}</span>
                                {appointment.totalAmount && parseFloat(appointment.totalAmount) > parseFloat(appointment.paidAmount) && (
                                  <span className="text-red-600 ml-2">
                                    (Outstanding: NZ$${(parseFloat(appointment.totalAmount) - parseFloat(appointment.paidAmount)).toFixed(2)})
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                          
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
                            <div className="mt-4 flex flex-col xs:flex-row gap-2 xs:gap-2 pt-3 border-t">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveBooking(appointment.id);
                                }}
                                className="w-full xs:w-auto text-xs sm:text-sm"
                              >
                                <span className="hidden xs:inline">Approve Booking</span>
                                <span className="xs:hidden">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectBooking(appointment.id);
                                }}
                                className="w-full xs:w-auto text-xs sm:text-sm"
                              >
                                <span className="hidden xs:inline">Reject Booking</span>
                                <span className="xs:hidden">Reject</span>
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