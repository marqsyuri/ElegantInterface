import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Aesthetic Pro</h1>
            <p className="text-slate-600">
              Organise your appointments, clients and financial control with ease
            </p>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium"
            size="lg"
          >
            Enter Platform
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Complete management system for aesthetic professionals
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
