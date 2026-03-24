import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, User, Camera, CalendarDays, CheckCircle, XCircle, List, Search, Package, FileText, Scissors, DollarSign, CreditCard, Banknote, QrCode, AlertCircle } from "lucide-react";
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
import { ProcedureSearchableSelect } from "@/components/ProcedureSearchableSelect";
import { TimeSlotAlert } from "@/components/TimeSlotAlert";
import { StaffCombobox } from "@/components/StaffCombobox";
import { ProductSearchableSelect, SelectedProduct } from "@/components/ProductSearchableSelect";
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
  appointmentTime: z.string().optional(), // Made optional to allow status-only updates
  duration: z.number().min(15, "Duration must be at least 15 minutes").default(60),
  totalAmount: z.string().optional(),
  paidAmount: z.string().optional(),
  beforeImages: z.array(z.string()).optional(),
  afterImages: z.array(z.string()).optional(),
  waitlist: z.boolean().optional().default(false),
  dateOnly: z.boolean().optional().default(false),
}).omit({ userId: true });

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  // Get current user data for permission filtering
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });
  const { t, language } = useLocale();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const dateLocale = getDateLocale(language);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<number[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]); // Multiple professionals support
  const [selectedStaffId, setSelectedStaffId] = useState<string>(""); // Keep for backward compatibility
  // Map of procedureId -> staffId for individual procedure-staff associations
  const [procedureStaffMap, setProcedureStaffMap] = useState<Record<number, number | null>>({});
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [calculatedDuration, setCalculatedDuration] = useState<number>(0);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [paymentEntries, setPaymentEntries] = useState<Array<{id:number, method:string, amount:string}>>([{id:1, method:'cash', amount:''}]);
  const addPaymentEntry = () => setPaymentEntries(prev => [...prev, {id: Date.now(), method:'cash', amount:''}]);
  const removePaymentEntry = (id:number) => setPaymentEntries(prev => prev.filter(p => p.id !== id));
  const updatePaymentEntry = (id:number, field:'method'|'amount', value:string) =>
    setPaymentEntries(prev => prev.map(p => p.id === id ? {...p, [field]: value} : p));
  const totalPaidEntries = () => paymentEntries.reduce((s,p) => s + (parseFloat(p.amount)||0), 0);
  const [endTimeInput, setEndTimeInput] = useState<string>("");
  const [endTimeManuallyEdited, setEndTimeManuallyEdited] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'waitlist'>('calendar');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('week'); // Default to week view
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null); // Appointment being edited
  const [showAll, setShowAll] = useState(true); // Default to true for calendar view to show all appointments
  const [quickSearch, setQuickSearch] = useState("");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>(""); // Staff filter for calendar
  const [waitlistDateFilter, setWaitlistDateFilter] = useState<string>(""); // Date filter for waitlist
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
      appointmentTime: "", // Add default value to avoid uncontrolled component warning
    },
  });

  const { data: products = [] } = useQuery({ queryKey: ["/api/products"] });

  const { data: appointments = [], isLoading: appointmentsLoading, error: appointmentsError } = useQuery({
    queryKey: ["/api/appointments", showAll ? 'all' : selectedDate?.toISOString().split('T')[0], selectedStaffFilter],
    queryFn: async () => {
      try {
        let url = showAll 
          ? '/api/appointments/all' 
          : `/api/appointments/${selectedDate?.toISOString().split('T')[0]}`;
        
        // Add staffId filter if selected
        if (selectedStaffFilter) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}staffId=${selectedStaffFilter}`;
        }
        
        
        const response = await fetch(url, { credentials: 'include' });
        
        if (!response.ok) {
          console.error('📅 API Error:', response.status, response.statusText);
          // If unauthorized, return empty array (will be handled by auth)
          if (response.status === 401) {
            return [];
          }
          throw new Error(`Failed to fetch appointments: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        
        // Log waitlist appointments specifically
        if (Array.isArray(data)) {
          const waitlistAppointments = data.filter((a: any) => a.waitlist === true);
        }
        
        // Ensure we always return an array
        if (!Array.isArray(data)) {
          console.error('📅 API did not return an array:', data);
          return [];
        }
        
        return data;
      } catch (error) {
        console.error('📅 Error fetching appointments:', error);
        // Return empty array on error to prevent page from breaking
        return [];
      }
    },
    retry: false,
    onError: (error) => {
      console.error('📅 Query error:', error);
    },
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

  // Fetch staff procedures map for each selected procedure (database associations - not used in UI anymore)
  const { data: dbProcedureStaffMap = {} } = useQuery({
    queryKey: ["/api/procedure-staff-map", selectedProcedureIds],
    queryFn: async () => {
      const map: Record<number, any[]> = {};
      for (const procedureId of selectedProcedureIds) {
        try {
          // Get all staff and filter by procedure
          const allStaffResponse = await fetch('/api/staff', { credentials: 'include' });
          if (allStaffResponse.ok) {
            const allStaff = await allStaffResponse.json();
            const staffForProcedure: any[] = [];
            
            for (const staffMember of allStaff) {
              try {
                const staffProceduresResponse = await fetch(`/api/staff/${staffMember.id}/procedures`, { credentials: 'include' });
                if (staffProceduresResponse.ok) {
                  const staffProcedures = await staffProceduresResponse.json();
                  if (staffProcedures.some((p: any) => p.id === procedureId)) {
                    staffForProcedure.push(staffMember);
                  }
                }
              } catch (error) {
                console.error(`Error fetching procedures for staff ${staffMember.id}:`, error);
              }
            }
            map[procedureId] = staffForProcedure;
          }
        } catch (error) {
          console.error(`Error fetching staff for procedure ${procedureId}:`, error);
        }
      }
      return map;
    },
    enabled: selectedProcedureIds.length > 0,
  });

  const { data: businessHours = [] } = useQuery({
    queryKey: ["/api/business-hours"],
    retry: false,
  });

  // Reset search fields when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedProducts([]);
      setConsumptions([]);
      setPaymentEntries([{id:1, method:'cash', amount:''}]);
      setEditingAppointment(null);
      setClientSearch("");
      setFilteredClients([]);
      setSelectedClient(null);
      setSelectedProcedureIds([]);
      setProcedureStaffMap({}); // Clear procedure-staff associations
      setCalculatedTotal(0);
      setCalculatedDuration(0);
      setEndTimeManuallyEdited(false);
      setEndTimeInput("");
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
        waitlist: false,
        dateOnly: false,
      });
    }
  }, [isDialogOpen, form]);

  // Load appointment data when editing (separate effect to ensure it runs after dialog opens)
  useEffect(() => {
    
    if (editingAppointment && isDialogOpen) {
      // Load appointment data for editing - fetch full data with staffId
      const loadAppointmentData = async () => {
        const appointment = editingAppointment;
        
        try {
          // Fetch full appointment data with procedures and staffId
          const apiUrl = `/api/appointments/${appointment.id}/with-procedures`;
          
          const response = await fetch(apiUrl, {
            credentials: 'include'
          });
          
          
          if (response.ok) {
            const fullData = await response.json();
            
            // Set client and update form field
            const clientToUse = fullData.client || appointment.client;
            if (clientToUse) {
              setSelectedClient(clientToUse);
              setClientSearch(clientToUse.name || '');
              // Update form field value
              form.setValue('clientId', clientToUse.id);
            }
            
            // Load procedures with staffId from API
            const procIds = fullData.procedures?.map((p: any) => p.procedureId) || 
                           appointment.allProcedures?.map((p: any) => p.id) || 
                           (appointment.serviceId ? [appointment.serviceId] : []);
            setSelectedProcedureIds(procIds);
            
            // Use fullData.appointment for form data (define before using it)
            const appointmentToUse = fullData.appointment || appointment;
            
            // Load procedure-staff map from appointment_procedures (with staffId from API)
            const procStaffMap: Record<number, number | null> = {};
            if (fullData.procedures && fullData.procedures.length > 0) {
              fullData.procedures.forEach((proc: any) => {
                // Use procedureId as key (not proc.id, which might be appointment_procedures.id)
                if (proc.staffId) {
                  procStaffMap[proc.procedureId] = proc.staffId;
                } else {
                  // If no staffId, try to get from appointment staffId as fallback
                  if (appointmentToUse.staffId) {
                    procStaffMap[proc.procedureId] = appointmentToUse.staffId;
                  }
                }
              });
            } else if (appointment.allProcedures) {
              // Fallback to allProcedures if API data structure is different
              appointment.allProcedures.forEach((proc: any) => {
                if (proc.staffId) {
                  procStaffMap[proc.id] = proc.staffId;
                } else if (appointment.staffId) {
                  procStaffMap[proc.id] = appointment.staffId;
                }
              });
            }
            setProcedureStaffMap(procStaffMap);
            const appointmentDate = new Date(appointmentToUse.appointmentDate);
            
            
            // Format time correctly (HH:mm) - use local time
            // Need to match the format used by timeSlots (which uses generateTimeSlots)
            const hours = appointmentDate.getHours();
            const minutes = appointmentDate.getMinutes();
            const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            
            form.reset({
              clientId: appointmentToUse.clientId,
              appointmentDate: appointmentDate.toISOString().split('T')[0],
              appointmentTime: timeString, // Set in reset
              status: appointmentToUse.status || "scheduled",
              notes: appointmentToUse.notes || "",
              totalAmount: appointmentToUse.totalAmount || "",
              paidAmount: appointmentToUse.paidAmount || "",
              duration: appointmentToUse.totalDuration || appointmentToUse.duration || 60,
              beforeImages: appointmentToUse.beforeImages || [],
              afterImages: appointmentToUse.afterImages || [],
            });
            
            // Explicitly set appointmentTime after reset to ensure it's set
            // Use setTimeout to ensure the value is set after the form state updates
            setTimeout(() => {
              form.setValue('appointmentTime', timeString, { shouldValidate: false, shouldDirty: false });
            }, 0);
            
            setBeforeImages(appointmentToUse.beforeImages || []);
            setAfterImages(appointmentToUse.afterImages || []);
            setCalculatedTotal(parseFloat(appointmentToUse.totalAmount || '0'));
            setCalculatedDuration(appointmentToUse.totalDuration || appointmentToUse.duration || 60);
            
            // Load saved products into selectedProducts state
            if (fullData.appointmentProducts && fullData.appointmentProducts.length > 0) {
              setSelectedProducts(fullData.appointmentProducts.map((p: any) => {
                const charged = parseFloat(p.price || '0');
                const original = parseFloat(p.originalPrice || p.price || p.productPrice || p.product?.price || '0');
                return {
                  productId: p.productId,
                  name: p.product?.name || p.productName || '',
                  price: charged,
                  originalPrice: original || charged,
                  quantity: p.quantity || 1,
                };
              }));
            } else {
              setSelectedProducts([]);
            }

            // Load consumptions (gastos de insumos)
            try {
              const prefillRes = await fetch(`/api/appointments/${fullData.id || fullData.appointment?.id}/consumptions/prefill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
              });
              const prefillData = await prefillRes.json();
              setConsumptions(prefillData.consumptions || []);
            } catch { setConsumptions([]); }

            // Load payment entries from saved payments
            if (fullData.appointmentPayments && fullData.appointmentPayments.length > 0) {
              setPaymentEntries(fullData.appointmentPayments.map((p: any, idx: number) => ({
                id: p.id || idx + 1,
                method: p.method || 'cash',
                amount: parseFloat(p.amount || '0').toFixed(2),
              })));
            } else {
              const existingPaid = parseFloat(appointmentToUse.paidAmount || '0');
              if (existingPaid > 0) {
                setPaymentEntries([{ id: 1, method: 'cash', amount: existingPaid.toFixed(2) }]);
              } else {
                setPaymentEntries([{ id: 1, method: 'cash', amount: '' }]);
              }
            }
          } else {
            // Fallback to existing appointment data
            if (appointment.client) {
              setSelectedClient(appointment.client);
              setClientSearch(appointment.client.name || '');
              form.setValue('clientId', appointment.client.id);
            }
            
            const procIds = appointment.allProcedures?.map((p: any) => p.id) || 
                           (appointment.serviceId ? [appointment.serviceId] : []);
            setSelectedProcedureIds(procIds);
            
            const procStaffMap: Record<number, number | null> = {};
            if (appointment.allProcedures) {
              appointment.allProcedures.forEach((proc: any) => {
                if (proc.staffId) {
                  procStaffMap[proc.id] = proc.staffId;
                } else if (appointment.staffId) {
                  procStaffMap[proc.id] = appointment.staffId;
                }
              });
            }
            setProcedureStaffMap(procStaffMap);
            
            const appointmentDate = new Date(appointment.appointmentDate);
            const hours = appointmentDate.getHours();
            const minutes = appointmentDate.getMinutes();
            const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            form.reset({
              clientId: appointment.clientId,
              appointmentDate: appointmentDate.toISOString().split('T')[0],
              appointmentTime: timeString,
              status: appointment.status || "scheduled",
              notes: appointment.notes || "",
              totalAmount: appointment.totalAmount || "",
              paidAmount: appointment.paidAmount || "",
              duration: appointment.totalDuration || appointment.duration || 60,
              beforeImages: appointment.beforeImages || [],
              afterImages: appointment.afterImages || [],
            });
            
            setBeforeImages(appointment.beforeImages || []);
            setAfterImages(appointment.afterImages || []);
            setCalculatedTotal(parseFloat(appointment.totalAmount || '0'));
            setCalculatedDuration(appointment.totalDuration || appointment.duration || 60);
          }
        } catch (error) {
          console.error('❌ Error loading appointment data:', error);
          // Fallback to existing appointment data
          if (appointment.client) {
            setSelectedClient(appointment.client);
            setClientSearch(appointment.client.name || '');
            form.setValue('clientId', appointment.client.id);
          }
          
          const procIds = appointment.allProcedures?.map((p: any) => p.id) || 
                         (appointment.serviceId ? [appointment.serviceId] : []);
          setSelectedProcedureIds(procIds);
          
          const procStaffMap: Record<number, number | null> = {};
          if (appointment.allProcedures) {
            appointment.allProcedures.forEach((proc: any) => {
              if (proc.staffId) {
                procStaffMap[proc.id] = proc.staffId;
              } else if (appointment.staffId) {
                procStaffMap[proc.id] = appointment.staffId;
              }
            });
          }
          setProcedureStaffMap(procStaffMap);
          
          const appointmentDate = new Date(appointment.appointmentDate);
          const hours = appointmentDate.getHours();
          const minutes = appointmentDate.getMinutes();
          const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          
          form.reset({
            clientId: appointment.clientId,
            appointmentDate: appointmentDate.toISOString().split('T')[0],
            appointmentTime: timeString,
            status: appointment.status || "scheduled",
            notes: appointment.notes || "",
            totalAmount: appointment.totalAmount || "",
            paidAmount: appointment.paidAmount || "",
            duration: appointment.totalDuration || appointment.duration || 60,
            beforeImages: appointment.beforeImages || [],
            afterImages: appointment.afterImages || [],
          });
          
          setBeforeImages(appointment.beforeImages || []);
          setAfterImages(appointment.afterImages || []);
          setCalculatedTotal(parseFloat(appointment.totalAmount || '0'));
          setCalculatedDuration(appointment.totalDuration || appointment.duration || 60);
        }
      };
      
      loadAppointmentData();
    }
  }, [isDialogOpen, editingAppointment, form]);

  // Listen for edit appointment event
  useEffect(() => {
    const handleEditAppointment = (event: CustomEvent) => {
      const appointment = event.detail;
      setEditingAppointment(appointment);
      setIsDialogOpen(true);
    };

    window.addEventListener('editAppointment' as any, handleEditAppointment as EventListener);
    return () => {
      window.removeEventListener('editAppointment' as any, handleEditAppointment as EventListener);
    };
  }, []);

  // Note: Availability checking is now handled by useTimeSlots hook
  // The backend will perform final conflict checking during appointment creation

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (editingAppointment) {
        // Update existing appointment
        const appointmentId = editingAppointment.id;
        
        
        // Build procedure-staff associations map
        const procedureStaffAssociations: Record<number, number> = {};
        selectedProcedureIds.forEach(procedureId => {
          const staffId = procedureStaffMap[procedureId];
          if (staffId) {
            procedureStaffAssociations[procedureId] = staffId;
          }
        });

        const staffIdsFromProcedures = Object.values(procedureStaffMap)
          .filter((id): id is number => id !== null && id !== undefined)
          .filter((id, index, self) => self.indexOf(id) === index);

        if (staffIdsFromProcedures.length === 0) {
          throw new Error('Por favor, selecione um profissional para pelo menos um procedimento');
        }

        // Use existing appointment time if not provided (for status-only updates)
        let appointmentTimeToUse = data.appointmentTime;
        if (!appointmentTimeToUse && editingAppointment?.appointmentDate) {
          const existingDate = new Date(editingAppointment.appointmentDate);
          const hours = existingDate.getHours();
          const minutes = existingDate.getMinutes();
          appointmentTimeToUse = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        const appointmentDateTime = createAppointmentDateTime(data.appointmentDate, appointmentTimeToUse || '12:00');
        
        // Convert paidAmount to proper format for database
        const paidAmountValue = data.paidAmount ? parseFloat(data.paidAmount.toString()).toFixed(2) : '0.00';
        
        const payload = {
          clientId: selectedClient.id,
          staffId: staffIdsFromProcedures[0],
          staffIds: staffIdsFromProcedures,
          procedureStaffMap: procedureStaffAssociations,
          appointmentDate: appointmentDateTime,
          status: data.status, // Ensure status is always sent
          notes: data.notes || '',
          procedureIds: selectedProcedureIds,
          totalAmount: calculatedTotal,
          paidAmount: paidAmountValue,
          totalDuration: calculatedDuration,
          beforeImages,
          afterImages,
          products: selectedProducts.map((p: any) => ({
            productId: p.productId,
            originalPrice: p.originalPrice ?? p.price,
            quantity: p.quantity || 1,
            price: p.price,
          })),
          paymentEntries: paymentEntries.map((e) => ({
            method: e.method,
            amount: e.amount,
          })),
        };

        
        const response = await apiRequest('PUT', `/api/appointments/${appointmentId}/with-procedures`, payload);
        const responseData = await response.json();

        // Salva consumptions editados
        if (consumptions.length > 0) {
          try {
            await fetch(`/api/appointments/${appointmentId}/consumptions`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ consumptions }),
            });
          } catch {}
        }

        return responseData;
      }
      
      // Create new appointment (existing logic)
      // Validation
      if (selectedProcedureIds.length === 0) {
        throw new Error(t('please_select_procedure'));
      }
      if (!selectedClient) {
        throw new Error(t('please_select_client'));
      }
      // Collect staff IDs from procedure-staff map (new system using combobox in table)
      const staffIdsFromProcedures = Object.values(procedureStaffMap)
        .filter((id): id is number => id !== null && id !== undefined)
        .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
      
      // Validate that at least one procedure has a staff assigned
      if (staffIdsFromProcedures.length === 0) {
        throw new Error('Por favor, selecione um profissional para pelo menos um procedimento');
      }

      const staffIdsToUse = staffIdsFromProcedures;

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

      // Build procedure-staff associations map
      const procedureStaffAssociations: Record<number, number> = {};
      selectedProcedureIds.forEach(procedureId => {
        const staffId = procedureStaffMap[procedureId];
        if (staffId) {
          procedureStaffAssociations[procedureId] = staffId;
        }
      });

      // If dateOnly is true, use only the date without time
      let finalAppointmentDate = appointmentDateTime;
      if (data.dateOnly) {
        // Parse the date string and create a UTC date at midnight to avoid timezone issues
        // data.appointmentDate is in format "YYYY-MM-DD"
        const [year, month, day] = data.appointmentDate.split('-').map(Number);
        const dateOnly = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0)); // Use noon UTC to avoid day shifts
        finalAppointmentDate = dateOnly.toISOString();
      }

      // Convert paidAmount to proper format for database
      const paidAmountValue = data.paidAmount ? parseFloat(data.paidAmount.toString()).toFixed(2) : '0.00';
      

      const payload = {
        clientId: selectedClient.id,
        staffId: staffIdsToUse[0], // First staff as primary for backward compatibility
        staffIds: staffIdsToUse, // Array of all staff members
        procedureStaffMap: procedureStaffAssociations, // Map of procedureId -> staffId
        appointmentDate: finalAppointmentDate,
        status: data.status,
        notes: data.notes || '',
        procedureIds: selectedProcedureIds,
        totalAmount: calculatedTotal,
        paidAmount: paidAmountValue,
        totalDuration: calculatedDuration,
        beforeImages,
        afterImages,
        waitlist: data.waitlist || false,
        dateOnly: data.dateOnly || false,
      };


      await apiRequest('POST', '/api/appointments/with-procedures', payload);
    },
    onSuccess: async (data, variables) => {
      
      // Update cache with the response data if available
      if (editingAppointment && data) {
        // The response from /with-procedures returns { appointment, procedures, client }
        const appointmentFromResponse = data.appointment || data;
        const appointmentId = editingAppointment.id;
        
        
        // Update all appointment queries with the server response
        queryClient.setQueriesData(
          { 
            queryKey: ["/api/appointments"],
            exact: false 
          }, 
          (old: any) => {
            if (!old) return old;
            if (Array.isArray(old)) {
              const updated = old.map((apt: any) => {
                if (apt.id === appointmentId) {
                  // Merge the updated appointment data, ensuring status is from server response
                  const merged = { 
                    ...apt, 
                    ...appointmentFromResponse,
                    status: appointmentFromResponse.status || apt.status, // Ensure status is updated
                    notes: appointmentFromResponse.notes !== undefined ? appointmentFromResponse.notes : apt.notes
                  };
                  return merged;
                }
                return apt;
              });
              const found = updated.find((a: any) => a.id === appointmentId);
              return updated;
            }
            return old;
          }
        );
      }
      
      // Invalidate queries to ensure fresh data is fetched
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/appointments"],
        exact: false 
      });
      
      setIsDialogOpen(false);
      setEditingAppointment(null);
      setEndTimeManuallyEdited(false);
      setEndTimeInput("");
      form.reset();
      setBeforeImages([]);
      setAfterImages([]);
      setSelectedProcedureIds([]);
      setProcedureStaffMap({}); // Clear procedure-staff associations
      setSelectedClient(null);
      toast({
        title: "Success",
        description: editingAppointment 
          ? "Appointment updated successfully!" 
          : "Appointment created successfully!",
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
  // Use first staff from procedureStaffMap for availability checking
  const firstStaffIdFromProcedures = Object.values(procedureStaffMap)
    .filter((id): id is number => id !== null && id !== undefined)[0];
  const staffIdForTimeSlots = firstStaffIdFromProcedures 
    ? firstStaffIdFromProcedures.toString() 
    : "";

  const { timeSlots, loading: timeSlotsLoading } = useTimeSlots({
    selectedDate: form.watch('appointmentDate') || '',
    selectedStaffId: staffIdForTimeSlots,
    duration: calculatedDuration || 60,
    businessHours: businessHours as any[]
  });

  // Set appointmentTime when timeSlots are loaded and we have a value to set
  useEffect(() => {
    if (editingAppointment && !timeSlotsLoading && timeSlots.length > 0) {
      // Get the current value from form state, not just watch
      const currentTime = form.getValues('appointmentTime');
      const watchedTime = form.watch('appointmentTime');
      
      // Use currentTime from getValues (more reliable) or watchedTime as fallback
      const timeToUse = currentTime || watchedTime;
      
      if (timeToUse) {
        // Check if the current time matches a slot value
        const matchingSlot = timeSlots.find(s => s.value === timeToUse);
        if (matchingSlot) {
          form.setValue('appointmentTime', timeToUse, { shouldValidate: false, shouldDirty: false });
        } else {
          // Try to find the closest slot
          const [hours, minutes] = timeToUse.split(':').map(Number);
          const currentMinutes = hours * 60 + minutes;
          const closestSlot = timeSlots.reduce((closest, slot) => {
            const [sHours, sMinutes] = slot.value.split(':').map(Number);
            const slotMinutes = sHours * 60 + sMinutes;
            const closestDiff = Math.abs(closest ? (parseInt(closest.split(':')[0]) * 60 + parseInt(closest.split(':')[1])) - currentMinutes : Infinity);
            const slotDiff = Math.abs(slotMinutes - currentMinutes);
            return slotDiff < closestDiff ? slot.value : closest;
          }, '');
          
          if (closestSlot) {
            form.setValue('appointmentTime', closestSlot, { shouldValidate: false, shouldDirty: false });
          }
        }
      } else {
      }
    }
  }, [timeSlots, timeSlotsLoading, editingAppointment, form]);

  // Debug logs

  // Additional debug for form state

  // Check for Clebinho's appointment in the main appointments list
  // Ensure appointments is an array before calling .find()
  const clebinhoInMainList = Array.isArray(appointments) ? appointments.find(a => 
    a.client?.name?.toLowerCase().includes('clebinho') || 
    a.client?.name?.toLowerCase().includes('seixas')
  ) : null;
  
  if (clebinhoInMainList) {
  } else {
  }

  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  const onSubmit = async (data: AppointmentFormData) => {

    // Let the backend handle availability checking to avoid conflicts
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
    if (!Array.isArray(appointments)) return [];
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
  // Filter by selected staff if a filter is applied
  const appointmentsWithDetails = useMemo(() => {
    try {
      // Ensure appointments is always an array
      if (!Array.isArray(appointments)) {
        return [];
      }
      
      let filtered = appointments as any[];
      
      // PERMISSION FILTER: Filter by company_id for staff users
      if (currentUser) {
        const isStaffUser = currentUser.role === 'staff' || currentUser.accessLevel === 'staff';
        const userCompanyId = currentUser.companyId || currentUser.company_id;
        
        if (isStaffUser && userCompanyId) {
          
          filtered = filtered.filter((appointment: any) => {
            if (!appointment) return false;
            
            // Check if any staff member in this appointment belongs to the user's company
            if (appointment.allStaff && Array.isArray(appointment.allStaff)) {
              const hasCompanyStaff = appointment.allStaff.some((s: any) => 
                s && (s.companyId === userCompanyId || s.company_id === userCompanyId)
              );
              if (hasCompanyStaff) return true;
            }
            
            // Check procedures for staff with matching company
            if (appointment.allProcedures && Array.isArray(appointment.allProcedures)) {
              const hasCompanyProcedure = appointment.allProcedures.some((p: any) => {
                if (!p || !p.staffId) return false;
                // Find staff in allStaff array
                const procedureStaff = appointment.allStaff?.find((s: any) => s?.id === p.staffId);
                return procedureStaff && (procedureStaff.companyId === userCompanyId || procedureStaff.company_id === userCompanyId);
              });
              if (hasCompanyProcedure) return true;
            }
            
            // If no staff info, don't show to staff users (only admins see these)
            return false;
          });
          
        } else {
        }
      }
      
      // STAFF FILTER: If a specific staff filter is selected, further filter by that staff
      if (selectedStaffFilter) {
        const staffIdNum = parseInt(selectedStaffFilter);
        if (!isNaN(staffIdNum)) {
          filtered = filtered.filter((appointment: any) => {
            if (!appointment) return false;
            
            // Check if staff is in appointment_staff (allStaff array)
            if (appointment.allStaff && Array.isArray(appointment.allStaff)) {
              return appointment.allStaff.some((s: any) => s && s.id === staffIdNum);
            }
            
            // Check if staff is in appointment_procedures (procedures with staffId)
            if (appointment.allProcedures && Array.isArray(appointment.allProcedures)) {
              return appointment.allProcedures.some((p: any) => p && p.staffId === staffIdNum);
            }
            
            // Check if staffId matches directly (backward compatibility)
            if (appointment.staffId === staffIdNum) {
              return true;
            }
            
            return false;
          });
        }
      }
      
      return filtered;
    } catch (error) {
      console.error('Error processing appointmentsWithDetails:', error);
      return [];
    }
  }, [appointments, selectedStaffFilter, currentUser]);
  
  // appointmentsWithDetails is memoized to avoid recalculations
  
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

    const foundAppointment = Array.isArray(appointments) ? appointments.find((appointment: any) => appointment.id === appointmentId) : null;

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

  // Update selectedAppointment when appointments array changes (e.g., after status update)
  useEffect(() => {
    if (selectedAppointment && Array.isArray(appointments) && appointments.length > 0) {
      const updatedAppointment = Array.isArray(appointments) ? appointments.find((apt: any) => apt.id === selectedAppointment.id) : null;
      if (updatedAppointment && (
        updatedAppointment.status !== selectedAppointment.status || 
        updatedAppointment.notes !== selectedAppointment.notes
      )) {
        setSelectedAppointment(updatedAppointment);
      }
    }
  }, [appointments, selectedAppointment?.id]);


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
              <Button
                variant={viewMode === 'waitlist' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('waitlist')}
                className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Lista de Espera</span>
                <span className="xs:hidden">Espera</span>
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
            
            {/* Staff Filter - only show when calendar mode is selected */}
            {viewMode === 'calendar' && (
              <Select value={selectedStaffFilter || "all"} onValueChange={(value) => setSelectedStaffFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-full sm:w-[200px] text-xs sm:text-sm">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {staff && (staff as any[]).length > 0 ? (
                    (staff as any[]).map((member: any) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
              <DialogContent className="sm:max-w-[1120px] w-[98vw] max-h-[94vh] overflow-hidden flex flex-col p-0">
                              <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                                <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                                  <Calendar className="w-4 h-4 text-primary" />
                                  {editingAppointment ? (t('edit_appointment') || 'Editar Agendamento') : t('create_new_appointment')}
                                </DialogTitle>
                              </DialogHeader>
              
                              <div className="flex-1 overflow-y-auto">
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
              
                                  {/* ════ GRID PRINCIPAL 65/35 ════ */}
                                  <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] min-h-full">
              
                                    {/* ══════ COLUNA ESQUERDA — FORM ══════ */}
                                    <div className="px-6 py-5 space-y-5 border-r">
              
                                      {/* CLIENTE */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <User className="w-4 h-4 text-primary" />
                                          <span className="text-sm font-semibold">{t('client_label')} *</span>
                                        </div>
                                        <FormField control={form.control} name="clientId" render={({ field }) => (
                                          <FormItem>
                                            <FormControl>
                                              <div className="relative">
                                                <Input
                                                  placeholder={t('type_to_search_clients')}
                                                  value={clientSearch}
                                                  onChange={(e) => {
                                                    setClientSearch(e.target.value);
                                                    if (e.target.value.length >= 2) {
                                                      const filtered = (clients as any[])?.filter((c: any) =>
                                                        c.name.toLowerCase().includes(e.target.value.toLowerCase())
                                                      ) || [];
                                                      setFilteredClients(filtered);
                                                    } else { setFilteredClients([]); }
                                                  }}
                                                  className={selectedClient ? "border-green-500 pr-8" : ""}
                                                />
                                                {selectedClient && <CheckCircle className="absolute right-2 top-2.5 w-4 h-4 text-green-500" />}
                                                {filteredClients.length > 0 && (
                                                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-44 overflow-y-auto">
                                                    {filteredClients.map((client: any) => (
                                                      <div key={client.id} className="px-3 py-2.5 cursor-pointer hover:bg-slate-50 text-sm border-b last:border-0"
                                                        onClick={() => { setSelectedClient(client); setClientSearch(client.name); setFilteredClients([]); field.onChange(client.id); }}>
                                                        <span className="font-medium">{client.name}</span>
                                                        {client.phone && <span className="text-slate-400 ml-2 text-xs">{client.phone}</span>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )} />
                                      </div>
              
                                      {/* PROCEDIMENTOS */}
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Scissors className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-semibold">{t('procedures_label')} *</span>
                                          </div>
                                        </div>
                                        <ProcedureSearchableSelect
                                          procedures={procedures as any[]}
                                          selectedProcedureIds={selectedProcedureIds}
                                          onSelectionChange={setSelectedProcedureIds}
                                          onTotalChange={(price, duration) => {
                                            setCalculatedTotal(price);
                                            setCalculatedDuration(duration);
                                            form.setValue('totalAmount', price.toFixed(2));
                                            form.setValue('duration', duration);
                                            // Recalcular endTime quando duração muda (só se usuário não editou manualmente)
                                            if (!endTimeManuallyEdited) {
                                              const st = form.getValues('appointmentTime');
                                              if (st && st !== '') {
                                                const [h, m] = st.split(':').map(Number);
                                                const end = h * 60 + m + duration;
                                                setEndTimeInput(`${Math.floor(end/60)%24}:${String(end%60).padStart(2,'0')}`);
                                              }
                                            }
                                          }}
                                          placeholder="Buscar e selecionar procedimentos..."
                                        />
                                        {selectedProcedureIds.length > 0 && (
                                          <div className="border rounded-lg overflow-hidden mt-2">
                                            <table className="w-full text-sm">
                                              <thead className="bg-slate-50 border-b">
                                                <tr>
                                                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Procedimento</th>
                                                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Profissional</th>
                                                  <th className="text-center px-3 py-2 text-xs font-semibold text-slate-600">Duração</th>
                                                  <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Valor</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {selectedProcedureIds.map((procedureId) => {
                                                  const procedure = (procedures as any[]).find(p => p.id === procedureId);
                                                  return (
                                                    <tr key={procedureId} className="border-b last:border-0 hover:bg-slate-50/50">
                                                      <td className="px-3 py-2 font-medium text-slate-800 text-xs">{procedure?.name || `#${procedureId}`}</td>
                                                      <td className="px-3 py-2">
                                                        {staff && (staff as any[]).length > 0 ? (
                                                          <StaffCombobox staff={staff as any[]} selectedStaffId={procedureStaffMap[procedureId] || null}
                                                            onSelect={(staffId) => setProcedureStaffMap(prev => ({ ...prev, [procedureId]: staffId }))}
                                                            placeholder="Profissional..." />
                                                        ) : <span className="text-xs text-slate-400">—</span>}
                                                      </td>
                                                      <td className="px-3 py-2 text-center text-xs text-slate-500">{procedure?.duration || 60}min</td>
                                                      <td className="px-3 py-2 text-right text-xs font-semibold text-slate-800">R${parseFloat(procedure?.price || '0').toFixed(2)}</td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
              
                                      {/* PRODUTOS */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Package className="w-4 h-4 text-primary" />
                                          <span className="text-sm font-semibold">Produtos Adicionais</span>
                                          <span className="text-xs text-muted-foreground">(opcional)</span>
                                        </div>
                                        <ProductSearchableSelect products={products as any[]} selectedProducts={selectedProducts} onSelectionChange={setSelectedProducts} allowPriceEdit={true} />
                                      </div>
              
                                      {/* GASTOS DE INSUMOS */}
                                      {editingAppointment && (
                                        <div>
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="text-base">🧪</span>
                                              <span className="text-sm font-semibold">Gastos de Insumos</span>
                                              <span className="text-xs text-muted-foreground">(uso interno)</span>
                                              {consumptions.length > 0 && (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{consumptions.length}</span>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              className="text-xs text-primary hover:underline flex items-center gap-1"
                                              onClick={() => {
                                                setConsumptions(prev => [...prev, {
                                                  product_id: null,
                                                  product_name: '',
                                                  quantity_suggested: 1,
                                                  quantity_used: 1,
                                                  unit: 'un',
                                                  source: 'manual',
                                                  _isNew: true,
                                                }]);
                                              }}
                                            >
                                              + Adicionar insumo
                                            </button>
                                          </div>
                                          {consumptions.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic px-2 py-1.5 bg-muted/40 rounded">
                                              Nenhum insumo lançado. Clique em "+ Adicionar insumo" ou cadastre insumos no procedimento para pré-carregar automaticamente.
                                            </p>
                                          ) : (
                                            <div className="space-y-2">
                                              {consumptions.map((item: any, idx: number) => (
                                                <div key={item.id || idx} className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-100">
                                                  <div className="flex-1 min-w-0">
                                                    {item._isNew ? (
                                                      <select
                                                        className="w-full text-xs border rounded px-1 py-0.5"
                                                        value={item.product_id || ''}
                                                        onChange={(e) => {
                                                          const pid = parseInt(e.target.value);
                                                          const prod = (products as any[]).find((p: any) => p.id === pid);
                                                          setConsumptions(prev => prev.map((c, i) =>
                                                            i === idx ? { ...c, product_id: pid, product_name: prod?.name || '', unit: prod?.unit || 'un', _isNew: false } : c
                                                          ));
                                                        }}
                                                      >
                                                        <option value="">Selecione o produto...</option>
                                                        {(products as any[]).map((p: any) => (
                                                          <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                      </select>
                                                    ) : (
                                                      <>
                                                        <p className="text-xs font-medium truncate">{item.product_name}</p>
                                                        {item.procedure_name && (
                                                          <p className="text-xs text-muted-foreground">{item.procedure_name}</p>
                                                        )}
                                                      </>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-xs">
                                                      {item.source === 'manual' || item._isNew ? '🔵' : item.quantity_used == item.quantity_suggested ? '🟡' : '🟢'}
                                                    </span>
                                                    <input
                                                      type="number"
                                                      min="0"
                                                      step="0.001"
                                                      className="w-16 text-xs border rounded px-1 py-0.5 text-right"
                                                      value={item.quantity_used}
                                                      onChange={(e) => {
                                                        const val = e.target.value;
                                                        setConsumptions(prev => prev.map((c, i) =>
                                                          i === idx ? { ...c, quantity_used: val, source: item.source === 'template' ? 'edited' : item.source } : c
                                                        ));
                                                      }}
                                                    />
                                                    <span className="text-xs text-muted-foreground">{item.unit || 'un'}</span>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    className="text-muted-foreground hover:text-destructive text-xs ml-1"
                                                    onClick={() => setConsumptions(prev => prev.filter((_, i) => i !== idx))}
                                                    title="Remover"
                                                  >✕</button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* DATA E HORÁRIO */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Clock className="w-4 h-4 text-primary" />
                                          <span className="text-sm font-semibold">Data e Horário</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                          <FormField control={form.control} name="appointmentDate" render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs text-slate-500">Data início</FormLabel>
                                              <FormControl><Input type="date" {...field} /></FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )} />
                                          <div>
                                            <label className="text-xs text-slate-500 block mb-1">Data fim <span className="text-muted-foreground">(opcional)</span></label>
                                            <input
                                              type="date"
                                              value={form.watch('appointmentDate') || ''}
                                              onChange={(e) => {
                                                // Se data fim diferente da início, apenas guarda em endTimeInput como referência
                                                // Por ora usa mesma data — pode ser expandido futuramente
                                              }}
                                              className="h-9 w-full border border-input rounded-md px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <FormField control={form.control} name="appointmentTime" render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs text-slate-500">Hora início</FormLabel>
                                              <FormControl>
                                                <input
                                                  type="time"
                                                  value={field.value || ''}
                                                  onChange={(e) => {
                                                    const v = e.target.value;
                                                    field.onChange(v);
                                                    // Recalcula hora fim baseado na duração (só se não editou manualmente)
                                                    if (v && calculatedDuration && !endTimeManuallyEdited) {
                                                      const [h, m] = v.split(':').map(Number);
                                                      const end = h * 60 + m + calculatedDuration;
                                                      setEndTimeInput(`${Math.floor(end/60)%24}:${String(end%60).padStart(2,'0')}`);
                                                    }
                                                  }}
                                                  className="h-9 w-full border border-input rounded-md px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )} />
                                          <div>
                                            <label className="text-xs text-slate-500 block mb-1">Hora fim</label>
                                            <input
                                              type="time"
                                              value={endTimeInput}
                                              onChange={(e) => {
                                                const newEnd = e.target.value;
                                                setEndTimeManuallyEdited(true);
                                                setEndTimeInput(newEnd);
                                                const startT = form.getValues('appointmentTime');
                                                if (startT && newEnd) {
                                                  const [sh, sm] = startT.split(':').map(Number);
                                                  const [eh, em] = newEnd.split(':').map(Number);
                                                  const newDur = (eh * 60 + em) - (sh * 60 + sm);
                                                  if (newDur > 0) setCalculatedDuration(newDur);
                                                }
                                              }}
                                              className="h-9 w-full border border-input rounded-md px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-5 mt-3">
                                          <FormField control={form.control} name="dateOnly" render={({ field }) => (
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                              <input type="checkbox" checked={field.value || false} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300 text-primary" />
                                              Sem horário
                                            </label>
                                          )} />
                                          <FormField control={form.control} name="waitlist" render={({ field }) => (
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                              <input type="checkbox" checked={field.value || false} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300 text-primary" />
                                              Lista de espera
                                            </label>
                                          )} />
                                        </div>
                                      </div>
              
                                      {/* STATUS */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <CheckCircle className="w-4 h-4 text-primary" />
                                          <span className="text-sm font-semibold">Status</span>
                                        </div>
                                        <FormField control={form.control} name="status" render={({ field }) => (
                                          <FormItem>
                                            <div className="flex flex-wrap gap-2">
                                              {[
                                                { value: 'scheduled', label: 'Agendado', active: 'bg-blue-600 text-white border-blue-600', idle: 'text-blue-700 border-blue-200 hover:bg-blue-50' },
                                                { value: 'confirmed', label: 'Confirmado', active: 'bg-green-600 text-white border-green-600', idle: 'text-green-700 border-green-200 hover:bg-green-50' },
                                                { value: 'pending', label: 'Pendente', active: 'bg-amber-500 text-white border-amber-500', idle: 'text-amber-700 border-amber-200 hover:bg-amber-50' },
                                                { value: 'completed', label: 'Finalizado', active: 'bg-purple-600 text-white border-purple-600', idle: 'text-purple-700 border-purple-200 hover:bg-purple-50' },
                                                { value: 'cancelled', label: 'Cancelado', active: 'bg-red-600 text-white border-red-600', idle: 'text-red-700 border-red-200 hover:bg-red-50' },
                                              ].map((s) => (
                                                <button key={s.value} type="button" onClick={() => field.onChange(s.value)}
                                                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${field.value === s.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                                                  {s.label}
                                                </button>
                                              ))}
                                            </div>
                                            <FormMessage />
                                          </FormItem>
                                        )} />
                                      </div>
              
                                      {/* OBSERVAÇÕES */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="w-4 h-4 text-primary" />
                                          <span className="text-sm font-semibold">{t('notes_label')}</span>
                                        </div>
                                        <FormField control={form.control} name="notes" render={({ field }) => (
                                          <FormItem>
                                            <FormControl>
                                              <Textarea placeholder={t('additional_notes')} {...field} value={field.value || ""} rows={2} className="resize-none text-sm" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )} />
                                      </div>
              
                                      {/* FOTOS */}
                                      <Tabs defaultValue="before" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                          <TabsTrigger value="before" className="text-xs gap-1">📷 Fotos Antes</TabsTrigger>
                                          <TabsTrigger value="after" className="text-xs gap-1">📷 Fotos Depois</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="before" className="mt-3">
                                          <FileUpload files={beforeImages} onFilesChange={setBeforeImages} maxFiles={5} label={t('upload_before_photos')} />
                                        </TabsContent>
                                        <TabsContent value="after" className="mt-3">
                                          <FileUpload files={afterImages} onFilesChange={setAfterImages} maxFiles={5} label={t('upload_after_photos')} />
                                        </TabsContent>
                                      </Tabs>
              
                                    </div>{/* fim coluna esquerda */}
              
                                    {/* ══════ COLUNA DIREITA — RESUMO ══════ */}
                                    <div className="px-5 py-5 bg-slate-50/60">
                                      <div className="sticky top-4 space-y-4">
              
                                        <h3 className="text-sm font-bold text-slate-800">Resumo do Pedido</h3>
              
                                        {/* Procedimentos */}
                                        {selectedProcedureIds.length > 0 && (
                                          <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Procedimentos</p>
                                            <div className="space-y-1.5">
                                              {selectedProcedureIds.map((id) => {
                                                const p = (procedures as any[]).find(x => x.id === id);
                                                return (
                                                  <div key={id} className="flex justify-between text-sm">
                                                    <span className="flex items-center gap-1.5 text-slate-700">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                                                      {p?.name || `#${id}`}
                                                    </span>
                                                    <span className="font-medium text-slate-800">R${parseFloat(p?.price || '0').toFixed(2)}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
              
                                        {/* Produtos */}
                                        {selectedProducts.length > 0 && (
                                          <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Produtos</p>
                                            <div className="space-y-1.5">
                                              {selectedProducts.map((p: any) => (
                                                <div key={p.productId} className="flex justify-between text-sm">
                                                  <span className="flex items-center gap-1.5 text-slate-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                                    {p.name} {p.quantity > 1 && <span className="text-xs text-slate-400">×{p.quantity}</span>}
                                                  </span>
                                                  <span className="font-medium text-slate-800">R${(p.price * p.quantity).toFixed(2)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
              
                                        {/* Separador + Tempo + Horário */}
                                        <div className="border-t pt-3 space-y-2">
                                          {calculatedDuration > 0 && (
                                            <div className="flex justify-between text-sm">
                                              <span className="text-amber-600 font-semibold">Tempo Total:</span>
                                              <span className="text-amber-600 font-bold">
                                                {calculatedDuration >= 60 ? `${Math.floor(calculatedDuration/60)}h${calculatedDuration%60 > 0 ? ` ${calculatedDuration%60}min` : ''}` : `${calculatedDuration}min`}
                                              </span>
                                            </div>
                                          )}
                                          {form.watch('appointmentTime') && (
                                            <div className="flex justify-between items-center text-sm">
                                              <span className="text-slate-600">Horário:</span>
                                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                <span>{form.watch('appointmentTime')}</span>
                                                <span className="text-slate-400">→</span>
                                                <input
                                                  type="time"
                                                  value={endTimeInput}
                                                  onChange={(e) => {
                                                    const newEnd = e.target.value;
                                                    setEndTimeInput(newEnd);
                                                    const startT = form.getValues('appointmentTime');
                                                    if (startT && newEnd) {
                                                      const [sh, sm] = startT.split(':').map(Number);
                                                      const [eh, em] = newEnd.split(':').map(Number);
                                                      const newDur = (eh * 60 + em) - (sh * 60 + sm);
                                                      if (newDur > 0) setCalculatedDuration(newDur);
                                                    }
                                                  }}
                                                  className="border border-slate-300 rounded px-1.5 py-0.5 text-sm w-20 text-center focus:outline-none focus:border-primary"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
              
                                        {/* Total */}
                                        <div className="bg-slate-900 rounded-xl p-4 text-center">
                                          <p className="text-xs text-slate-400 mb-0.5">Total</p>
                                          <p className="text-2xl font-bold text-white">
                                            R$ {(calculatedTotal + selectedProducts.reduce((s: number, p: any) => s + p.price * p.quantity, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </p>
                                        </div>
              
                                        {/* Múltiplos Pagamentos */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pagamentos</p>
                                            <button type="button" onClick={addPaymentEntry}
                                              className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                                              <Plus className="w-3 h-3" /> Adicionar
                                            </button>
                                          </div>

                                          <div className="space-y-1.5">
                                            {paymentEntries.map((entry) => (
                                              <div key={entry.id} className="flex items-center gap-1.5">
                                                <select
                                                  value={entry.method}
                                                  onChange={(e) => updatePaymentEntry(entry.id, 'method', e.target.value)}
                                                  className="flex-1 h-8 text-xs border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                                  style={{colorScheme:'light'}}
                                                >
                                                  <option value="cash">💵 Dinheiro</option>
                                                  <option value="card">💳 Cartão</option>
                                                  <option value="pix">🔷 Pix</option>
                                                </select>
                                                <div className="relative flex-1">
                                                  <span className="absolute left-2 top-1.5 text-xs text-slate-400 pointer-events-none">R$</span>
                                                  <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0,00"
                                                    value={entry.amount}
                                                    onChange={(e) => {
                                                      updatePaymentEntry(entry.id, 'amount', e.target.value);
                                                      const newTotal = paymentEntries
                                                        .map(p => p.id === entry.id ? (parseFloat(e.target.value)||0) : (parseFloat(p.amount)||0))
                                                        .reduce((a,b)=>a+b,0);
                                                      form.setValue('paidAmount', newTotal.toFixed(2));
                                                    }}
                                                    className="w-full h-8 border border-input rounded-md pl-7 pr-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                                  />
                                                </div>
                                                {paymentEntries.length > 1 && (
                                                  <button type="button" onClick={() => removePaymentEntry(entry.id)}
                                                    className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                                                    <XCircle className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>

                                          {/* Resumo pagamentos */}
                                          {(() => {
                                            const grandTotal = calculatedTotal + selectedProducts.reduce((s: number, p: any) => s + p.price * p.quantity, 0);
                                            const paid = totalPaidEntries();
                                            const saldo = grandTotal - paid;
                                            return grandTotal > 0 ? (
                                              <div className="border-t pt-2 space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500">Total pago</span>
                                                  <span className="font-semibold text-green-700">R$ {paid.toFixed(2)}</span>
                                                </div>
                                                {saldo > 0.005 ? (
                                                  <div className="flex justify-between">
                                                    <span className="text-slate-500">Saldo restante</span>
                                                    <span className="font-semibold text-red-600">R$ {saldo.toFixed(2)}</span>
                                                  </div>
                                                ) : paid > 0 ? (
                                                  <p className="text-center text-green-700 font-semibold">✓ Pagamento completo</p>
                                                ) : null}
                                                <button type="button"
                                                  onClick={() => {
                                                    if (paymentEntries.length > 0) {
                                                      const share = (grandTotal / paymentEntries.length).toFixed(2);
                                                      setPaymentEntries(prev => prev.map(p => ({...p, amount: share})));
                                                      form.setValue('paidAmount', grandTotal.toFixed(2));
                                                    }
                                                  }}
                                                  className="w-full text-primary hover:underline text-center pt-0.5">
                                                  Dividir igualmente
                                                </button>
                                              </div>
                                            ) : null;
                                          })()}
                                        </div>
              
                                        {/* Botão submit */}
                                        <Button type="submit" className="w-full" disabled={createAppointmentMutation.isPending}>
                                          {createAppointmentMutation.isPending
                                            ? (editingAppointment ? 'Salvando...' : 'Criando...')
                                            : (editingAppointment ? 'Salvar Alterações' : '✓ Criar Agendamento')}
                                        </Button>
              
                                      </div>
                                    </div>{/* fim coluna direita */}
              
                                  </div>{/* fim grid */}
                                </form>
                              </Form>
                              </div>
                            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar or List View */}
        {viewMode === 'calendar' ? (
          Array.isArray(appointmentsWithDetails) ? (
            <FunctionalCalendar
              appointments={appointmentsWithDetails}
              viewType={calendarView}
              onDateSelect={(date) => {
                setSelectedDate(date);
                // Removed setShowAll(false) to prevent filtering when clicking on calendar days
              }}
              onAppointmentClick={(appointment) => {
                // Open full edit form instead of details dialog
                setEditingAppointment(appointment);
                setIsDialogOpen(true);
              }}
              onCreateAppointment={() => setIsDialogOpen(true)}
              selectedDate={selectedDate}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  Erro ao carregar agendamentos para o calendário
                </div>
              </CardContent>
            </Card>
          )
        ) : viewMode === 'waitlist' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <User className="w-5 h-5" />
                    Lista de Espera
                  </CardTitle>
                  
                  {/* Filtro de Data */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={waitlistDateFilter}
                      onChange={(e) => setWaitlistDateFilter(e.target.value)}
                      placeholder="Filtrar por data"
                      className="w-full sm:w-auto"
                    />
                    {waitlistDateFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWaitlistDateFilter("")}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="text-center py-8">Carregando lista de espera...</div>
                ) : (() => {
                  const waitlistAppointments = Array.isArray(appointments) 
                    ? appointments.filter((a: any) => {
                        if (a.waitlist !== true) return false;
                        if (waitlistDateFilter) {
                          const appointmentDate = a.appointmentDate 
                            ? format(parseISO(a.appointmentDate), "yyyy-MM-dd", { locale: dateLocale })
                            : null;
                          return appointmentDate === waitlistDateFilter;
                        }
                        return true;
                      })
                    : [];
                  
                  const totalCount = waitlistAppointments.length;
                  
                  if (totalCount === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        {waitlistDateFilter 
                          ? `Nenhum cliente na lista de espera para a data selecionada`
                          : "Nenhum cliente na lista de espera"}
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {/* Totalizador */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          Total de clientes na lista de espera: <span className="text-lg font-bold">{totalCount}</span>
                        </p>
                      </div>
                      
                      {/* Lista com bordas */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {waitlistAppointments
                          .sort((a: any, b: any) => {
                            // Ordenar do mais recente para o mais antigo
                            const dateA = new Date(a.appointmentDate || a.createdAt).getTime();
                            const dateB = new Date(b.appointmentDate || b.createdAt).getTime();
                            return dateB - dateA; // Invertido para mais recente primeiro
                          })
                          .map((appointment: any, index: number) => (
                            <div 
                              key={appointment.id} 
                              className={`p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors ${
                                index !== waitlistAppointments.length - 1 ? 'border-b border-slate-200' : ''
                              }`}
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold text-base sm:text-lg">{appointment.client?.name || 'Cliente sem nome'}</h3>
                                    {appointment.appointmentDate && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Data solicitada: {format(parseISO(appointment.appointmentDate), "dd/MM/yyyy", { locale: dateLocale })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Informações de contato */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  {appointment.client?.phone && (
                                    <div>
                                      <span className="font-medium">Telefone: </span>
                                      <span className="text-muted-foreground">{appointment.client.phone}</span>
                                    </div>
                                  )}
                                  {appointment.client?.email && (
                                    <div>
                                      <span className="font-medium">Email: </span>
                                      <span className="text-muted-foreground">{appointment.client.email}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Procedimentos */}
                                {appointment.allProcedures && appointment.allProcedures.length > 0 && (
                                  <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Procedimentos:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {appointment.allProcedures.map((procedure: any, procIndex: number) => (
                                        <span 
                                          key={procedure.id || procIndex} 
                                          className="text-xs sm:text-sm bg-blue-50 text-blue-900 px-2 py-1 rounded border border-blue-200"
                                        >
                                          {procedure.name || procedure.procedureName}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Notas */}
                                {appointment.notes && (
                                  <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Notas:</p>
                                    <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">{appointment.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
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
                            // Open full edit form instead of details dialog
                            setEditingAppointment(appointment);
                            setIsDialogOpen(true);
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