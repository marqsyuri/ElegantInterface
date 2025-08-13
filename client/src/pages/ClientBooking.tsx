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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronUp, ChevronDown, Info, X, MapPin } from "lucide-react";
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

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  notes: z.string().optional(),
  selectedServices: z.array(z.string()).min(1, "Please select at least one service"),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function ClientBooking() {
  const { publicLink } = useParams<{ publicLink: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
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

  const bookingMutation = useMutation({
    mutationFn: (data: BookingForm) =>
      apiRequest(`/api/public/appointments/${publicLink}`, "POST", data),
    onSuccess: () => {
      toast({
        title: "Appointment Requested",
        description: "We'll contact you soon to confirm your booking.",
      });
      form.reset();
      setSelectedServices([]);
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
    setShowBookingForm(true);
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
              <X className="h-4 w-4" />
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