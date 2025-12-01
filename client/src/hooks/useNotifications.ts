import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationMetadata } from "@shared/schema";

export interface AppNotification {
  id: number;
  userId: number;
  clientId: number | null;
  appointmentId: number | null;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  metadata: NotificationMetadata;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchNotifications(): Promise<AppNotification[]> {
  const response = await fetch("/api/notifications", { credentials: "include" });

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<AppNotification[]>({
    queryKey: ["/api/notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/mark-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markNotificationAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      apiRequest("POST", `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    isFetching: notificationsQuery.isFetching,
    isError: notificationsQuery.isError,
    refetch: notificationsQuery.refetch,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    markNotificationAsRead: markNotificationAsReadMutation.mutateAsync,
    markAllStatus: markAllAsReadMutation.status,
    markSingleStatus: markNotificationAsReadMutation.status,
  };
}

