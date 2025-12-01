import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { 
  Home, 
  Calendar, 
  Users, 
  ClipboardList, 
  CreditCard, 
  MessageCircle, 
  ShieldCheck, 
  Stethoscope, 
  Gift, 
  Settings,
  Sparkles,
  UserCheck,
  Mail,
  BarChart3,
  Package,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  TrendingUp,
  Briefcase,
  Megaphone,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocale } from "@/contexts/LocaleContext";

// Tipo para grupo de navegação
type NavigationGroupType = {
  name: string;
  icon: any;
  key: string;
  items: Array<{ name: string; href: string; icon: any; key: string }>;
};

// Componente para grupo de navegação colapsável
function NavigationGroup({ 
  group, 
  location, 
  onNavigate 
}: { 
  group: NavigationGroupType, 
  location: string, 
  onNavigate: () => void 
}) {
  const hasActiveItem = group.items.some(item => item.href === location);
  const [isOpen, setIsOpen] = useState(hasActiveItem); // Abre apenas se tiver item ativo
  const GroupIcon = group.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-3">
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer group",
          hasActiveItem 
            ? "text-pink-600 bg-pink-50/80 shadow-sm" 
            : "text-slate-500 hover:text-pink-600 hover:bg-pink-50/50"
        )}>
          <div className="flex items-center">
            <GroupIcon className="w-4 h-4 mr-2.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-xs font-bold tracking-wider uppercase">
              {group.name}
            </span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-all duration-300",
            isOpen && "transform rotate-180",
            hasActiveItem && "text-pink-500"
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5">
        <div className="space-y-1 pl-1">
          {group.items.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center rounded-xl font-medium transition-all duration-300 cursor-pointer group relative overflow-hidden px-3 py-2.5",
                    isActive 
                      ? "text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-md scale-[1.02]"
                      : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 hover:translate-x-2"
                  )}
                  onClick={onNavigate}
                  style={isActive ? { 
                    boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                  } : {}}
                >
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-rose-400/10" />
                      <div className="absolute -left-1 top-0 bottom-0 w-1 bg-white rounded-r-full shadow-lg"></div>
                    </>
                  )}
                  <Icon className={cn(
                    "w-4 h-4 mr-3 flex-shrink-0 transition-all duration-300 relative z-10",
                    isActive && "scale-110 drop-shadow-lg"
                  )} />
                  <span className="relative z-10 text-sm tracking-wide transition-opacity duration-300">
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isExpanded, toggleExpanded } = useSidebar();
  const { t } = useLocale();

  const mainItems = useMemo(() => ([
    { name: t('dashboard_menu'), href: "/", icon: Home, key: 'dashboard' },
    { name: t('appointments_menu'), href: "/appointments", icon: Calendar, key: 'appointments' },
  ]), [t]);

  const navigationGroups = useMemo<NavigationGroupType[]>(() => ([
    {
      name: t('registry_menu'),
      icon: FolderOpen,
      key: 'registry',
      items: [
        { name: t('clients_menu'), href: "/clients", icon: Users, key: 'clients' },
        { name: t('procedures_menu'), href: "/procedures", icon: Sparkles, key: 'procedures' },
        { name: t('products_menu'), href: "/products", icon: Package, key: 'products' },
        { name: t('staff_menu'), href: "/staff", icon: UserCheck, key: 'staff' },
      ]
    },
    {
      name: t('clinical_menu'),
      icon: Stethoscope,
      key: 'clinical',
      items: [
        { name: t('clinical_records_menu'), href: "/clinical", icon: ClipboardList, key: 'clinical_records' },
        { name: t('inventory_menu'), href: "/materials", icon: ShieldCheck, key: 'materials' },
      ]
    },
    {
      name: t('management_menu'),
      icon: Briefcase,
      key: 'management',
      items: [
        { name: t('financial_menu'), href: "/financial", icon: CreditCard, key: 'financial' },
        { name: "Payslip", href: "/payslip", icon: FileText, key: 'payslip' },
        { name: "Communication", href: "/communication", icon: MessageCircle, key: 'communication' },
        { name: "Campaigns", href: "/campaigns", icon: Megaphone, key: 'campaigns' },
            { name: t('loyalty'), href: "/loyalty", icon: Gift, key: 'loyalty' },
        { name: t('packages_menu'), href: "/packages", icon: Package, key: 'packages' },
        { name: "Marketing", href: "/marketing", icon: Mail, key: 'marketing' },
      ]
    },
    {
      name: t('analytics_menu'),
      icon: TrendingUp,
      key: 'analytics',
      items: [
        { name: t('analytics_menu'), href: "/analytics", icon: BarChart3, key: 'analytics' },
      ]
    },
  ]), [t]);

  const settingsItem = useMemo(() => ({ name: t('settings_menu'), href: "/settings", icon: Settings }), [t]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-2xl shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{ boxShadow: '0 8px 32px rgba(236, 72, 153, 0.3)' }}
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Desktop Expand/Collapse Button */}
      <button
        className="fixed top-4 left-4 z-50 hidden lg:block bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-xl shadow-lg transition-all duration-300 hover:shadow-pink-500/50 hover:scale-105"
        style={{ 
          left: isExpanded ? '260px' : '60px',
          boxShadow: '0 4px 20px rgba(236, 72, 153, 0.25)'
        }}
        onClick={toggleExpanded}
      >
        {isExpanded ? (
          <ChevronLeft className="w-5 h-5 text-white" />
        ) : (
          <ChevronRight className="w-5 h-5 text-white" />
        )}
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
        "fixed left-0 top-0 h-screen backdrop-blur-xl bg-white/95 border-r border-pink-100/50 shadow-xl z-40 flex flex-col transition-all duration-300 scrollbar-hide overflow-y-auto",
        // Dynamic width based on expansion state
        isExpanded ? "w-72" : "w-16 lg:w-16",
        // Desktop: always visible, Mobile: slide in/out
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fff1f2 100%)',
      }}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-pink-400 hover:text-pink-600 transition-colors rounded-lg hover:bg-pink-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modern Header with Logo */}
        <div className={cn(
          "p-6 border-b border-pink-100 transition-all duration-300",
          !isExpanded && "p-3"
        )}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
              style={{ boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)' }}
            >
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
              <Sparkles className="w-7 h-7 text-white relative z-10 animate-pulse" />
            </div>
            {isExpanded && (
              <div className="ml-4 transition-opacity duration-300">
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent tracking-tight">Estética Pro</h1>
                <p className="text-sm text-slate-500 font-medium">Professional Beauty System</p>
              </div>
            )}
          </div>
        </div>
        
        <div className={cn(
          "flex-1 overflow-hidden flex flex-col",
          isExpanded ? "p-4" : "p-2"
        )}>
          <div className={cn(
            "space-y-2 overflow-y-auto flex-1 custom-scrollbar",
            isExpanded ? "pr-2" : "pr-1"
          )}>
            {/* Main Items - Always Visible */}
            <div className="space-y-2 mb-6">
              {mainItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center rounded-2xl font-medium transition-all duration-300 cursor-pointer group relative overflow-hidden",
                        isExpanded ? "px-4 py-3.5" : "px-2 py-3 justify-center items-center min-h-[44px] min-w-[44px]",
                        isActive 
                          ? "text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg scale-[1.02]" 
                          : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/80" + (isExpanded ? " hover:translate-x-1" : "")
                      )}
                      title={item.name}
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={isActive ? { 
                        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                      } : {}}
                    >
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 backdrop-blur-sm" />
                          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                        </>
                      )}
                      <Icon className={cn(
                        "w-5 h-5 transition-all duration-300 relative z-10 flex-shrink-0",
                        isExpanded ? "mr-4" : "mr-0 mx-auto",
                        isActive && "scale-110 drop-shadow-lg"
                      )} />
                      {isExpanded && (
                        <span className="relative z-10 tracking-wide transition-opacity duration-300 font-semibold">
                          {item.name}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Grouped Items - Collapsible */}
            {isExpanded ? (
              navigationGroups.map((group) => (
                <NavigationGroup
                  key={group.name}
                  group={group}
                  location={location}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              ))
            ) : (
              // When collapsed, show all items without groups
              <div className="space-y-2">
                {navigationGroups.flatMap(group => group.items).map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link key={item.name} href={item.href}>
                      <div 
                        className={cn(
                          "flex items-center rounded-2xl font-medium transition-all duration-300 cursor-pointer group relative overflow-hidden px-2 py-3 justify-center items-center min-h-[44px] min-w-[44px]",
                          isActive 
                            ? "text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg scale-[1.02]"
                            : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/80"
                        )}
                        title={item.name}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={isActive ? { 
                          boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)' 
                        } : {}}
                      >
                        {isActive && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20" />
                            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur opacity-30"></div>
                          </>
                        )}
                        <Icon className={cn(
                          "w-5 h-5 transition-all duration-300 relative z-10 mx-auto flex-shrink-0",
                          isActive && "scale-110 drop-shadow-lg"
                        )} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Settings - Always at Bottom */}
            <div className="mt-6 pt-4 border-t border-pink-100">
              <Link href={settingsItem.href}>
                <div 
                  className={cn(
                    "flex items-center rounded-2xl font-medium transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    isExpanded ? "px-4 py-3.5" : "px-2 py-3 justify-center items-center min-h-[44px] min-w-[44px]",
                    location === settingsItem.href
                      ? "text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg scale-[1.02]"
                      : "text-slate-600 hover:text-pink-600 hover:bg-pink-50/80" + (isExpanded ? " hover:translate-x-1" : "")
                  )}
                  title={settingsItem.name}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={location === settingsItem.href ? { 
                    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                  } : {}}
                >
                  {location === settingsItem.href && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 backdrop-blur-sm" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                    </>
                  )}
                  <settingsItem.icon className={cn(
                    "w-5 h-5 transition-all duration-300 relative z-10 flex-shrink-0",
                    isExpanded ? "mr-4" : "mr-0 mx-auto",
                    location === settingsItem.href && "scale-110 drop-shadow-lg"
                  )} />
                  {isExpanded && (
                    <span className="relative z-10 tracking-wide transition-opacity duration-300 font-semibold">
                      {settingsItem.name}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
        

      </nav>
    </>
  );
}