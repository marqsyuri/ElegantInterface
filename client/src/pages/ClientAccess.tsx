import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import { Link } from "wouter";

interface CompanyInfo {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicWhatsapp?: string;
  profileImageUrl?: string;
}

export default function ClientAccess() {
  const { publicLink } = useParams<{ publicLink: string }>();

  const { data: company, isLoading: companyLoading } = useQuery<CompanyInfo>({
    queryKey: [`/api/public/company/${publicLink}`],
    enabled: !!publicLink,
  });

  if (companyLoading || !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            {company.clinicName || 'Beauty Salon'}
          </h1>
          {company.clinicAddress && (
            <div className="flex items-center justify-center text-slate-600 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{company.clinicAddress}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-medium text-slate-900 mb-4">
              Book Your Appointment
            </h2>
            <p className="text-slate-600 mb-6">
              Select from our professional beauty services and choose your preferred time.
            </p>
            
            <Link href={`/client/${publicLink}/booking`}>
              <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 text-lg font-medium">
                Select Services
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contact Info */}
        {(company.clinicPhone || company.clinicWhatsapp) && (
          <Card className="mt-4">
            <CardContent className="p-6">
              <h3 className="font-medium text-slate-900 mb-3">Contact Us</h3>
              <div className="space-y-2">
                {company.clinicPhone && (
                  <div className="flex items-center text-slate-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <a 
                      href={`tel:${company.clinicPhone}`}
                      className="hover:text-slate-900"
                    >
                      {company.clinicPhone}
                    </a>
                  </div>
                )}
                {company.clinicWhatsapp && (
                  <div className="flex items-center text-slate-600">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <a 
                      href={`https://wa.me/${company.clinicWhatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-slate-900"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}