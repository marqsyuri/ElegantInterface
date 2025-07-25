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
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Mail,
  BarChart3,
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

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
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <>
      <nav className={cn(
        "fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-40 transition-all duration-300 overflow-y-auto",
        isCollapsed ? "w-16" : "w-72"
      )}>
        {/* Modern Header with Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              {!isCollapsed && (
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-white tracking-tight">Estética Pro</h1>
                  <p className="text-sm text-slate-400 font-medium">Professional Beauty System</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-2 h-9 w-9 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden",
                        isActive 
                          ? "text-white bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25 border-l-4 border-secondary" 
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:translate-x-1"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm" />
                      )}
                      <Icon className={cn(
                        "w-5 h-5 transition-transform duration-200 relative z-10",
                        isCollapsed ? "mx-auto" : "mr-4",
                        isActive && "scale-110"
                      )} />
                      {!isCollapsed && (
                        <span className="relative z-10 tracking-wide">
                          {item.name}
                        </span>
                      )}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-600">
                          {item.name}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-600" />
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Footer with User Info (if not collapsed) */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">EP</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Professional</p>
                <p className="text-xs text-slate-400">Beauty Expert</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}