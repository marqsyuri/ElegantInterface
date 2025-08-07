import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Calendar, User, Phone, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  serviceId: z.string().min(1, "Please select a service"),
  preferredDate: z.string().min(1, "Please select a preferred date"),
  preferredTime: z.string().min(1, "Please select a preferred time"),
  notes: z.string().optional(),
  isNewClient: z.boolean().default(true),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

interface CompanyInfo {
  clinicName: string;
  publicLink: string;
}

export default function ClientBooking() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bookingComplete, setBookingComplete] = useState(false);
  const publicLink = params.publicLink;

  const { data: company } = useQuery({
    queryKey: [`/api/public/company/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: services } = useQuery({
    queryKey: [`/api/public/services/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: businessHours } = useQuery({
    queryKey: [`/api/public/business-hours/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: bookedSlots } = useQuery({
    queryKey: [`/api/public/booked-slots/${publicLink}/${form.watch('preferredDate')}`],
    enabled: !!publicLink && !!form.watch('preferredDate'),
  });

  // Generate available time slots based on business hours and booked appointments
  const generateAvailableTimeSlots = () => {
    if (!businessHours || !form.watch('preferredDate') || !form.watch('serviceId')) {
      return [];
    }

    const selectedService = services?.find((s: Service) => s.id === parseInt(form.watch('serviceId')));
    if (!selectedService) return [];

    const selectedDate = form.watch('preferredDate');
    const dayOfWeek = new Date(selectedDate).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const todayHours = businessHours?.find((bh: any) => bh.dayOfWeek === dayName);
    if (!todayHours || !todayHours.isOpen) {
      return [];
    }

    const slots = [];
    const startTime = todayHours.openTime;
    const endTime = todayHours.closeTime;
    const lunchStart = todayHours.lunchStart;
    const lunchEnd = todayHours.lunchEnd;

    // Generate 30-minute slots
    let currentTime = startTime;
    while (currentTime < endTime) {
      // Skip lunch break
      if (lunchStart && lunchEnd && currentTime >= lunchStart && currentTime < lunchEnd) {
        currentTime = addMinutes(currentTime, 30);
        continue;
      }

      // Check if slot is available (not booked)
      const isBooked = bookedSlots?.some((slot: any) => {
        const slotStart = slot.startTime;
        const slotEnd = slot.endTime;
        return currentTime >= slotStart && currentTime < slotEnd;
      });

      // Check if there's enough time for the service
      const serviceEndTime = addMinutes(currentTime, selectedService.duration);
      if (serviceEndTime <= endTime && !isBooked) {
        slots.push({
          value: currentTime,
          label: formatTime(currentTime),
        });
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  };

  // Helper functions
  const addMinutes = (timeString: string, minutes: number): string => {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatTime = (timeString: string): string => {
    const [hours, mins] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    return date.toLocaleTimeString('en-NZ', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const availableTimeSlots = generateAvailableTimeSlots();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceId: "",
      preferredDate: "",
      preferredTime: "",
      notes: "",
      isNewClient: true,
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      return await apiRequest('POST', `/api/public/book/${publicLink}`, data);
    },
    onSuccess: () => {
      setBookingComplete(true);
      toast({
        title: "Booking Request Submitted",
        description: "We'll contact you shortly to confirm your appointment.",
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    bookingMutation.mutate(data);
  };



  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for your booking request. We'll contact you within 24 hours to confirm your appointment details.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation(`/client/${publicLink}`)}
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clinic Info
              </Button>
              {company?.clinicWhatsapp && (
                <Button 
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Hi! I just submitted a booking request through your website. My name is ${form.getValues('name')}.`
                    );
                    window.open(`https://wa.me/${company.clinicWhatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact via WhatsApp
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/client/${publicLink}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {company?.clinicName || 'Clinic Info'}
          </Button>
          
          <h1 className="text-3xl font-bold text-slate-900">Book Appointment</h1>
          <p className="text-slate-600 mt-2">
            Fill out the form below and we'll get back to you to confirm your appointment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="021 123 4567" {...field} />
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
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Service Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Service Selection</h3>
                  
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose Service *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services?.map((service: Service) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name} - ${service.price} ({service.duration} min)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Preferred Date & Time */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Preferred Date & Time</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="preferredDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Date *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              min={new Date().toISOString().split('T')[0]}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTimeSlots.length > 0 ? (
                                availableTimeSlots.map((slot) => (
                                  <SelectItem key={slot.value} value={slot.value}>
                                    {slot.label}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  {!form.watch('preferredDate') ? 'Please select a date first' :
                                   !form.watch('serviceId') ? 'Please select a service first' :
                                   'No available times for selected date'}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special requests or information we should know..."
                          className="h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-slate-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>Please note:</strong> This is a booking request. We'll contact you within 24 hours 
                      to confirm your appointment and discuss any specific requirements.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    disabled={bookingMutation.isPending}
                  >
                    {bookingMutation.isPending ? "Submitting..." : "Submit Booking Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}