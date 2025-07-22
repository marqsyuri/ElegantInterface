import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  Users, 
  ClipboardList, 
  CreditCard, 
  MessageCircle, 
  ShieldCheck, 
  Gift, 
  Settings,
  Sparkles,
  LogOut,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Clinical Records", href: "/clinical", icon: ClipboardList },
  { name: "Financial", href: "/financial", icon: CreditCard },
  { name: "Communication", href: "/communication", icon: MessageCircle },
  { name: "PPE & Materials", href: "/materials", icon: ShieldCheck },
  { name: "Loyalty", href: "/loyalty", icon: Gift },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-slate-900">Aesthetic Pro</h1>
            <p className="text-sm text-slate-500">Professional Management</p>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div className={cn(
                    "flex items-center px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        {showUpgradeBanner && (
          <div className="bg-gradient-to-br from-primary to-secondary rounded-lg p-4 text-white mb-4 relative">
            <button
              onClick={() => setShowUpgradeBanner(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
              aria-label="Close banner"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-semibold mb-1">Upgrade Pro</h3>
            <p className="text-sm text-white/80 mb-3">Unlock advanced features</p>
            <Button className="bg-white text-primary hover:bg-white/90 px-4 py-2 rounded-lg text-sm font-medium w-full">
              Learn More
            </Button>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-700 hover:bg-slate-100"
          onClick={() => window.location.href = "/api/logout"}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Log Out
        </Button>
      </div>
    </nav>
  );
}
