import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronUp, ChevronDown, Info, X, MapPin, ArrowLeft, Calendar, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: number;
  name: string;
  duration: number;
  price: string;
  description?: string;
  category: string;
  isActive: boolean;
}

interface CompanyInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone?: string;
  clinicWhatsapp?: string;
}

interface Professional {
  id: number;
  name: string;
  specialties: string[];
  profileImage?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BusinessHours {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  notes: z.string().optional(),
  selectedServices: z.array(z.string()).min(1, "Please select at least one service"),
  selectedProfessional: z.string().min(1, "Please select a professional"),
  selectedDate: z.string().min(1, "Please select a date"),
  selectedTime: z.string().min(1, "Please select a time"),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function ClientBooking() {
  const { publicLink } = useParams<{ publicLink: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showProfessionalSelection, setShowProfessionalSelection] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
      selectedServices: [],
      selectedProfessional: "",
      selectedDate: "",
      selectedTime: "",
    },
  });

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/public/procedures/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: company } = useQuery<CompanyInfo>({
    queryKey: [`/api/public/company/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: professionals } = useQuery<Professional[]>({
    queryKey: [`/api/public/staff/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: businessHours } = useQuery<BusinessHours[]>({
    queryKey: [`/api/public/business-hours/${publicLink}`],
    enabled: !!publicLink,
  });

  const handleDateTimeSelected = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Date/Time Required",
        description: "Please select both date and time to continue.",
        variant: "destructive",
      });
      return;
    }
    form.setValue('selectedDate', selectedDate);
    form.setValue('selectedTime', selectedTime);
    setShowBookingForm(true);
  };

  const bookingMutation = useMutation({
    mutationFn: (data: BookingForm) =>
      apiRequest(`/api/public/appointments/${publicLink}`, "POST", data),
    onSuccess: () => {
      setShowConfirmation(true);
      setShowBookingForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (servicesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading services...</p>
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-slate-600">No services available at the moment.</p>
        </div>
      </div>
    );
  }

  // Group services by category (only active ones)
  const servicesByCategory = services
    .filter(service => service.isActive)
    .reduce((acc: Record<string, Service[]>, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {});

  const handleServiceToggle = (serviceId: string) => {
    const newSelection = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];
    
    setSelectedServices(newSelection);
    form.setValue('selectedServices', newSelection);
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service to continue.",
        variant: "destructive",
      });
      return;
    }
    setShowProfessionalSelection(true);
  };

  const handleProfessionalSelected = () => {
    console.log("handleProfessionalSelected called, selectedProfessional:", selectedProfessional);
    if (!selectedProfessional) {
      toast({
        title: "No Professional Selected",
        description: "Please select a professional to continue.",
        variant: "destructive",
      });
      return;
    }
    form.setValue('selectedProfessional', selectedProfessional);
    console.log("Setting showCalendar to true");
    setShowCalendar(true);
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id.toString() === serviceId);
      if (service) {
        const price = parseFloat(service.price);
        return total + price;
      }
      return total;
    }, 0);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} mins`;
    }
    return `${minutes} mins`;
  };

  // Generate available dates (next 14 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const businessDay = businessHours?.find(bh => bh.dayOfWeek === dayOfWeek);
      
      if (businessDay?.isOpen) {
        dates.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('en-NZ', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          dayOfWeek
        });
      }
    }
    
    return dates;
  };

  // Generate time slots for selected date
  const getTimeSlots = (date: string) => {
    if (!businessHours || !date) return [];
    
    const selectedDateObj = new Date(date);
    const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const businessDay = businessHours.find(bh => bh.dayOfWeek === dayOfWeek);
    
    if (!businessDay?.isOpen) return [];
    
    const slots: TimeSlot[] = [];
    const openTime = businessDay.openTime;
    const closeTime = businessDay.closeTime;
    
    // Parse time strings (assumes HH:MM format)
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMin = openMin;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      
      // Skip break times if they exist
      const isBreakTime = businessDay.breakStartTime && businessDay.breakEndTime &&
        timeString >= businessDay.breakStartTime && timeString < businessDay.breakEndTime;
      
      if (!isBreakTime) {
        slots.push({
          time: timeString,
          available: true // In a real app, you'd check against existing bookings
        });
      }
      
      // Increment by 30 minutes
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  // Professional Selection Screen
  if (showProfessionalSelection) {
    const selectedServiceDetails = services.filter(s => 
      selectedServices.includes(s.id.toString())
    );

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfessionalSelection(false)}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-slate-900">Select Professional</h1>
              {company?.clinicAddress && (
                <div className="flex items-center text-slate-600 text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{company.clinicAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Selected Services Summary */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-900 mb-3">Selected Services</h3>
              <div className="space-y-2">
                {selectedServiceDetails.map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-900">{service.name}</span>
                      <span className="text-slate-600 ml-2">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    <span className="text-slate-900 font-medium">${parseFloat(service.price).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Selection */}
          <h3 className="text-lg font-medium text-slate-900 mb-4">Choose Your Professional</h3>
          
          {professionals && professionals.length > 0 ? (
            <div className="space-y-3">
              {professionals.map((professional) => (
                <Card 
                  key={professional.id} 
                  className={`cursor-pointer transition-all ${
                    selectedProfessional === professional.id.toString() 
                      ? 'ring-2 ring-slate-800 bg-slate-50' 
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedProfessional(professional.id.toString())}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                        {professional.profileImage ? (
                          <img 
                            src={professional.profileImage} 
                            alt={professional.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-600 font-medium text-lg">
                            {professional.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{professional.name}</h4>
                        {professional.specialties.length > 0 && (
                          <p className="text-sm text-slate-600 mt-1">
                            {professional.specialties.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-full flex items-center justify-center">
                        {selectedProfessional === professional.id.toString() && (
                          <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No professionals available at the moment.</p>
            </div>
          )}

          {/* Continue Button */}
          {selectedProfessional && (
            <div className="mt-6">
              <Button 
                onClick={() => {
                  console.log("Button clicked!");
                  handleProfessionalSelected();
                }}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 text-lg font-medium"
              >
                Continue to Date & Time
              </Button>
            </div>
          )}
          
          {/* Debug info */}
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p>Debug: selectedProfessional = {selectedProfessional || "null"}</p>
            <p>Debug: showCalendar = {showCalendar.toString()}</p>
            <p>Debug: businessHours = {businessHours ? businessHours.length : "null"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calendar/DateTime Selection Screen
  if (showCalendar) {
    const selectedServiceDetails = services.filter(s => 
      selectedServices.includes(s.id.toString())
    );
    const availableDates = getAvailableDates();
    const timeSlots = selectedDate ? getTimeSlots(selectedDate) : [];

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendar(false)}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-slate-900">Select Date & Time</h1>
              {company?.clinicAddress && (
                <div className="flex items-center text-slate-600 text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{company.clinicAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Booking Summary */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-900 mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                {selectedServiceDetails.map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <span className="text-slate-900">{service.name}</span>
                    <span className="text-slate-900">${parseFloat(service.price).toFixed(2)}</span>
                  </div>
                ))}
                {selectedProfessional && professionals && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Professional:</span>
                    <span>{professionals.find(p => p.id.toString() === selectedProfessional)?.name}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Select Date
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {availableDates.map((dateOption) => (
                <Card
                  key={dateOption.date}
                  className={`cursor-pointer transition-all ${
                    selectedDate === dateOption.date
                      ? 'ring-2 ring-slate-800 bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setSelectedDate(dateOption.date);
                    setSelectedTime(""); // Reset time when date changes
                  }}
                >
                  <CardContent className="p-3 text-center">
                    <div className="text-sm font-medium text-slate-900">
                      {dateOption.display}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Select Time
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    className={`h-12 ${
                      selectedTime === slot.time 
                        ? 'bg-slate-800 hover:bg-slate-900' 
                        : 'hover:bg-slate-50'
                    } ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
              {timeSlots.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-600">No available times for this date.</p>
                </div>
              )}
            </div>
          )}

          {/* Continue Button */}
          {selectedDate && selectedTime && (
            <Button 
              onClick={handleDateTimeSelected}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 text-lg font-medium"
            >
              Continue to Booking Details
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (showBookingForm) {
    const selectedServiceDetails = services.filter(s => 
      selectedServices.includes(s.id.toString())
    );

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookingForm(false)}
              className="mr-3"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-slate-900">Book Appointment</h1>
              {company?.clinicAddress && (
                <div className="flex items-center text-slate-600 text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{company.clinicAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Booking Summary */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-medium text-slate-900 mb-3">Booking Summary</h3>
              <div className="space-y-2">
                {selectedServiceDetails.map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-900">{service.name}</span>
                      <span className="text-slate-600 ml-2">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                    <span className="text-slate-900 font-medium">${parseFloat(service.price).toFixed(2)}</span>
                  </div>
                ))}
                
                {/* Selected Professional */}
                {selectedProfessional && professionals && (
                  <div className="border-t pt-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Professional:</span>
                      <span className="text-slate-900 font-medium">
                        {professionals.find(p => p.id.toString() === selectedProfessional)?.name}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Selected Date & Time */}
                {selectedDate && selectedTime && (
                  <div className="border-t pt-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Date & Time:</span>
                      <span className="text-slate-900 font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-NZ', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {selectedTime}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => bookingMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special requests or notes..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 text-lg font-medium"
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? "Submitting..." : "Request Appointment"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }

  // Confirmation Screen
  if (showConfirmation) {
    const selectedServiceDetails = services.filter(s => 
      selectedServices.includes(s.id.toString())
    );

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Booking Request Sent!
              </h2>
              
              <p className="text-slate-600 mb-6">
                We've received your appointment request and will contact you soon to confirm your booking.
              </p>

              {/* Booking Summary */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-slate-900 mb-3">Your Booking Details</h3>
                <div className="space-y-2 text-sm">
                  {selectedServiceDetails.map((service) => (
                    <div key={service.id} className="flex justify-between">
                      <span>{service.name}</span>
                      <span>${parseFloat(service.price).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  {selectedProfessional && professionals && (
                    <div className="flex justify-between text-slate-600">
                      <span>Professional:</span>
                      <span>{professionals.find(p => p.id.toString() === selectedProfessional)?.name}</span>
                    </div>
                  )}
                  
                  {selectedDate && selectedTime && (
                    <div className="flex justify-between text-slate-600">
                      <span>Date & Time:</span>
                      <span>
                        {new Date(selectedDate).toLocaleDateString('en-NZ', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {selectedTime}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {(company?.clinicPhone || company?.clinicWhatsapp) && (
                <div className="border-t pt-4">
                  <p className="text-sm text-slate-600 mb-3">
                    Questions? Contact us:
                  </p>
                  <div className="flex justify-center space-x-4">
                    {company.clinicPhone && (
                      <a 
                        href={`tel:${company.clinicPhone}`}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        📞 {company.clinicPhone}
                      </a>
                    )}
                    {company.clinicWhatsapp && (
                      <a 
                        href={`https://wa.me/${company.clinicWhatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-slate-900"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-medium text-slate-900">Select services</h1>
          <Button variant="ghost" size="sm" className="text-slate-600">
            Log in
          </Button>
        </div>
        
        {/* Company Info */}
        {company && (
          <div className="max-w-lg mx-auto px-4 pb-4">
            <div className="bg-slate-100 rounded-lg p-3 flex items-start">
              <MapPin className="h-4 w-4 text-slate-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-slate-900 text-sm">
                  {company.clinicName || 'Beauty Salon'}
                </h2>
                {company.clinicAddress && (
                  <p className="text-slate-600 text-xs mt-0.5">
                    {company.clinicAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto">
        {/* Services List */}
        <div className="space-y-2">
          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <div key={category}>
              {/* Category Header */}
              <button
                onClick={() => setSelectedCategory(
                  selectedCategory === category ? null : category
                )}
                className="w-full px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between hover:bg-slate-50"
              >
                <span className="text-lg font-medium text-slate-900">{category}</span>
                {selectedCategory === category ? (
                  <ChevronUp className="h-5 w-5 text-slate-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-600" />
                )}
              </button>

              {/* Category Services */}
              {(selectedCategory === category || selectedCategory === null) && (
                <div className="bg-white">
                  {categoryServices.map((service) => {
                    const isSelected = selectedServices.includes(service.id.toString());
                    
                    return (
                      <div
                        key={service.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <div className="px-4 py-4 flex items-start space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleServiceToggle(service.id.toString())}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-slate-900 font-medium">{service.name}</h3>
                            <div className="flex items-center text-slate-600 text-sm mt-1 space-x-3">
                              <span>{formatDuration(service.duration)}</span>
                              <span>•</span>
                              <span className="font-medium">${parseFloat(service.price).toFixed(2)}</span>
                            </div>
                            {service.description && (
                              <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-400 p-1">
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Continue Button - Fixed at bottom */}
        {selectedServices.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
            <div className="max-w-lg mx-auto">
              <Button 
                onClick={handleContinue}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 text-lg font-medium"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding to account for fixed button */}
      {selectedServices.length > 0 && <div className="h-20" />}
    </div>
  );
}