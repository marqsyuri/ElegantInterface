import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  MessageCircle,
  User,
  Mail,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CompanyInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicWhatsapp: string;
  specialties: string;
  businessHours: Array<{
    dayOfWeek: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
  }>;
  services: Array<{
    id: number;
    name: string;
    description: string;
    price: string;
    duration: number;
  }>;
}

const dayNames = {
  monday: "Monday",
  tuesday: "Tuesday", 
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday"
};

export default function ClientAccess() {
  const [, params] = useRoute("/client/:publicLink");
  const publicLink = params?.publicLink;

  const { data: companyInfo, isLoading, error } = useQuery<CompanyInfo>({
    queryKey: [`/api/public/company/${publicLink}`],
    enabled: !!publicLink,
    retry: false,
  });

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${period}`;
  };

  const handleWhatsAppContact = () => {
    if (companyInfo?.clinicWhatsapp) {
      const message = encodeURIComponent(`Hi ${companyInfo.clinicName}! I found your booking page and would like to schedule an appointment. Could you please help me?`);
      const whatsappUrl = `https://wa.me/${companyInfo.clinicWhatsapp.replace(/\D/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleOnlineBooking = () => {
    // Navigate to online booking form
    window.location.href = `/client/${publicLink}/book`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !companyInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Beauty Clinic Not Found</h2>
            <p className="text-slate-600">The clinic link you're looking for doesn't exist or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openHours = companyInfo.businessHours.filter(h => h.isOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold text-slate-900">{companyInfo.clinicName}</h1>
          </div>
          {companyInfo.specialties && (
            <p className="text-slate-600 text-lg">{companyInfo.specialties}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button 
            onClick={handleWhatsAppContact}
            className="h-16 text-lg font-semibold bg-green-600 hover:bg-green-700 border border-green-500"
          >
            <MessageCircle className="w-6 h-6 mr-3" />
            Contact via WhatsApp
          </Button>
          
          <Button 
            onClick={handleOnlineBooking}
            className="h-16 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 border border-yellow-400 text-slate-900"
          >
            <Calendar className="w-6 h-6 mr-3" />
            Book Online
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyInfo.clinicAddress && (
                <div>
                  <p className="font-medium text-slate-900">Address</p>
                  <p className="text-slate-600">{companyInfo.clinicAddress}</p>
                </div>
              )}
              
              {companyInfo.clinicPhone && (
                <div>
                  <p className="font-medium text-slate-900">Phone</p>
                  <a 
                    href={`tel:${companyInfo.clinicPhone}`}
                    className="text-green-600 hover:text-green-700 flex items-center"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {companyInfo.clinicPhone}
                  </a>
                </div>
              )}

              {companyInfo.clinicWhatsapp && (
                <div>
                  <p className="font-medium text-slate-900">WhatsApp</p>
                  <button 
                    onClick={handleWhatsAppContact}
                    className="text-green-600 hover:text-green-700 flex items-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {companyInfo.clinicWhatsapp}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Opening Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {companyInfo.businessHours.map((hours) => (
                  <div key={hours.dayOfWeek} className="flex justify-between items-center">
                    <span className="font-medium text-slate-900 capitalize">
                      {dayNames[hours.dayOfWeek as keyof typeof dayNames]}
                    </span>
                    {hours.isOpen ? (
                      <div className="text-right">
                        <span className="text-slate-600">
                          {formatTime(hours.openTime)} - {formatTime(hours.closeTime)}
                        </span>
                        {hours.breakStartTime && hours.breakEndTime && (
                          <div className="text-xs text-slate-500">
                            Break: {formatTime(hours.breakStartTime)} - {formatTime(hours.breakEndTime)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-slate-600">
                        Closed
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        {companyInfo.services && companyInfo.services.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-green-600" />
                Our Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyInfo.services.map((service) => (
                  <div key={service.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-900">{service.name}</h3>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        ${service.price}
                      </Badge>
                    </div>
                    {service.description && (
                      <p className="text-slate-600 text-sm mb-2">{service.description}</p>
                    )}
                    <div className="flex items-center text-xs text-slate-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {service.duration} minutes
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-slate-200">
          <p className="text-slate-500 text-sm">
            Powered by <span className="font-semibold text-green-600">Estética Pro</span>
          </p>
        </div>
      </div>
    </div>
  );
}