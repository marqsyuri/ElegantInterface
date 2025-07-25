import { Link, useLocation } from "wouter";
import { useState } from "react";
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
  UserCheck,
  Mail,
  BarChart3,
  Leaf,
  Menu,
  X
} from "lucide-react";
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
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Marketing", href: "/marketing", icon: Mail },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Sustainability", href: "/sustainability", icon: Leaf },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-gradient-to-br from-primary to-secondary p-3 rounded-xl shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={cn(
        "fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300",
        "w-72 lg:w-72", // Full width on all screens
        "lg:translate-x-0", // Always visible on desktop
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0" // Hide on mobile unless open
      )}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modern Header with Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-white tracking-tight">Estética Pro</h1>
              <p className="text-sm text-slate-400 font-medium">Professional Beauty System</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden touch-target",
                        isActive 
                          ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25 border-l-4 border-secondary" 
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:translate-x-1"
                      )}
                      title={item.name}
                      onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu on navigation
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm" />
                      )}
                      <Icon className={cn(
                        "w-5 h-5 transition-transform duration-200 relative z-10 mr-4",
                        isActive && "scale-110"
                      )} />
                      <span className="relative z-10 tracking-wide">
                        {item.name}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        

      </nav>
    </>
  );
}