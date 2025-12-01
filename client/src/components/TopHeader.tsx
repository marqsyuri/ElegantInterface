import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import NotificationBell from "@/components/NotificationBell";

interface TopHeaderProps {
  title: string;
  subtitle?: string;
}

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return "User";
  };

  const getInitials = () => {
    const name = getUserName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">{title}</h2>
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-600 truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0">
          <NotificationBell />
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile photo" />
                <AvatarFallback className="text-xs sm:text-sm">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="ml-2 sm:ml-3 hidden sm:block">
                <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">{getUserName()}</p>
                <p className="text-xs text-slate-500">Aesthetician</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-8 h-8 sm:w-10 sm:h-10 touch-target"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              title="Log Out"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
