import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { MapPin, Phone, Clock, MessageCircle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CompanyInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicWhatsapp: string;
  email: string;
  profileImageUrl: string | null;
  publicLink: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

interface BusinessHours {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

const daysOfWeek = {
  monday: 'Monday',
  tuesday: 'Tuesday', 
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export default function ClientAccess() {
  const params = useParams();
  const publicLink = params.publicLink;

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: [`/api/public/company/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: [`/api/public/services/${publicLink}`],
    enabled: !!publicLink,
  });

  const { data: businessHours, isLoading: hoursLoading } = useQuery({
    queryKey: [`/api/public/business-hours/${publicLink}`],
    enabled: !!publicLink,
  });

  const isLoading = companyLoading || servicesLoading || hoursLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading clinic information...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Clinic Not Found</h1>
          <p className="text-slate-600">The clinic you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? 'AM' : 'PM';
    return `${displayHour}:${minutes} ${period}`;
  };

  const openWhatsApp = () => {
    if (company.clinicWhatsapp) {
      const message = encodeURIComponent(
        `Hi! I found your clinic online and would like to know more about your services.`
      );
      const whatsappUrl = `https://wa.me/${company.clinicWhatsapp.replace(/\D/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const groupedServices = services?.reduce((acc: any, service: Service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={company.profileImageUrl || ''} />
              <AvatarFallback className="bg-green-100 text-green-700 text-xl font-bold">
                {company.clinicName ? company.clinicName.charAt(0).toUpperCase() : 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{company.clinicName}</h1>
              <p className="text-slate-600 mt-1">Professional Beauty & Wellness</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.clinicAddress && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Address</p>
                    <p className="text-slate-600">{company.clinicAddress}</p>
                  </div>
                </div>
              )}

              {company.clinicPhone && (
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <a href={`tel:${company.clinicPhone}`} className="text-green-600 hover:text-green-700">
                      {company.clinicPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {company.clinicWhatsapp && (
              <div className="pt-4 border-t border-slate-200">
                <Button 
                  onClick={openWhatsApp}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact via WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operating Hours */}
        {businessHours && businessHours.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {businessHours.map((hours: BusinessHours) => (
                  <div key={hours.dayOfWeek} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900">
                      {daysOfWeek[hours.dayOfWeek as keyof typeof daysOfWeek]}
                    </span>
                    {hours.isOpen ? (
                      <div className="text-sm text-slate-600">
                        <span>{formatTime(hours.openTime)} - {formatTime(hours.closeTime)}</span>
                        {hours.breakStartTime && hours.breakEndTime && (
                          <div className="text-xs text-slate-500">
                            Lunch: {formatTime(hours.breakStartTime)} - {formatTime(hours.breakEndTime)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {services && services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Our Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedServices).map(([category, categoryServices]: [string, any]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-slate-900 mb-3 text-lg">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryServices.map((service: Service) => (
                        <div key={service.id} className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-slate-900">{service.name}</h4>
                            <span className="text-lg font-bold text-green-600">
                              ${service.price}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                          )}
                          <div className="flex items-center text-xs text-slate-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {service.duration} minutes
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book Appointment CTA */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold text-green-900 mb-2">Ready to Book?</h3>
            <p className="text-green-700 mb-4">
              Schedule your appointment online and we'll get back to you shortly.
            </p>
            <Link href={`/client/${publicLink}/book`}>
              <Button className="bg-green-600 hover:bg-green-700">
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}