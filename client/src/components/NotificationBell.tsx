import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { useNotificationsStream } from "@/hooks/useNotificationsStream";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import { getDateLocale } from "@/lib/dateLocale";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const { language } = useLocale();
  const dateLocale = useMemo(() => getDateLocale(language), [language]);
  const { notifications, unreadCount, isLoading, markAllAsRead, markAllStatus } = useNotifications();
  const [location, setLocation] = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();

  useNotificationsStream();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  }, [location, queryClient]);

  const handleNotificationsOpenChange = useCallback(
    (open: boolean) => {
      setIsNotificationsOpen(open);

      if (open && unreadCount > 0 && markAllStatus !== "pending") {
        markAllAsRead().catch((error) => {
          console.error("Failed to mark notifications as read:", error);
        });
      }
    },
    [markAllAsRead, markAllStatus, unreadCount],
  );

  const handleNotificationClick = useCallback(
    (notification: AppNotification) => {
      setIsNotificationsOpen(false);
      const target = notification.appointmentId
        ? `/appointments?appointmentId=${notification.appointmentId}`
        : "/appointments";
      setLocation(target);
    },
    [setLocation],
  );

  const renderNotification = useCallback(
    (notification: AppNotification) => {
      const metadata = notification.metadata || { procedures: [] };

      const appointmentDate = metadata?.appointmentDate ? new Date(metadata.appointmentDate) : null;
      const createdAtDate = notification.createdAt ? new Date(notification.createdAt) : null;

      const appointmentDateLabel = appointmentDate && !Number.isNaN(appointmentDate.getTime())
        ? format(appointmentDate, "dd/MM/yyyy", { locale: dateLocale })
        : null;

      const createdAtLabel = createdAtDate && !Number.isNaN(createdAtDate.getTime())
        ? formatDistanceToNow(createdAtDate, { addSuffix: true, locale: dateLocale })
        : null;

      const proceduresLabel = Array.isArray(metadata?.procedures)
        ? metadata.procedures
            .map((proc) => proc?.name)
            .filter(Boolean)
            .join(", ")
        : "";

      const staffLabel = metadata?.staffName;

      return (
        <button
          key={notification.id}
          type="button"
          className={`w-full text-left p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            notification.isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/70 hover:bg-blue-100"
          }`}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start gap-3">
            {!notification.isRead && (
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                {createdAtLabel && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{createdAtLabel}</span>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-snug">{notification.message}</p>
              {proceduresLabel && (
                <p className="text-xs text-muted-foreground">
                  Procedimentos: <span className="text-slate-900">{proceduresLabel}</span>
                </p>
              )}
              {staffLabel && (
                <p className="text-xs text-muted-foreground">
                  Profissional: <span className="text-slate-900">{staffLabel}</span>
                </p>
              )}
              {(appointmentDateLabel || metadata?.appointmentTime) && (
                <p className="text-xs text-muted-foreground">
                  {appointmentDateLabel}
                  {metadata?.appointmentTime ? ` • ${metadata.appointmentTime}` : ""}
                </p>
              )}
            </div>
          </div>
        </button>
      );
    },
    [dateLocale, handleNotificationClick],
  );

  return (
    <Popover open={isNotificationsOpen} onOpenChange={handleNotificationsOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative w-8 h-8 sm:w-10 sm:h-10 touch-target ${className ?? ""}`}
          title="Notificações"
          aria-label="Abrir notificações"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] px-1 py-0.5 bg-rose-500 text-white text-[10px] sm:text-xs font-semibold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0 shadow-lg">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Notificações</p>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} pendente${unreadCount > 1 ? "s" : ""}` : "Você está em dia!"}
          </p>
        </div>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Carregando notificações...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Nenhuma notificação por aqui. Assim que novos agendamentos chegarem você verá tudo aqui.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(renderNotification)}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

