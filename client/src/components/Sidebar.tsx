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
  X,
  Menu,
  ChevronLeft
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 overflow-y-auto",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-xl font-bold text-slate-900">Aesthetic Pro</h1>
                <p className="text-sm text-slate-500">Professional Management</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 h-8 w-8"
          >
            {isCollapsed ? (
              <Menu className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
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
                  <div 
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer group relative",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    {!isCollapsed && item.name}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className={cn("absolute bottom-4", isCollapsed ? "left-2 right-2" : "left-4 right-4")}>
        {showUpgradeBanner && !isCollapsed && (
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
        

      </div>
    </nav>
  );
}
