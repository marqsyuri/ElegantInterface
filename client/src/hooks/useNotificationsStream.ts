import { useMemo } from "react";
import useWebSocket from "react-use-websocket";
import { useQueryClient } from "@tanstack/react-query";

const WS_PATH = "/ws/notifications";

function getWebSocketUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const hostname = window.location.hostname;

  // Em dev com localhost, aponta direto para a porta do servidor
  if (import.meta.env.DEV && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return `${protocol}://${hostname}:5000${WS_PATH}`;
  }

  // Em produção ou quando acessado via domínio, usa o host atual (nginx faz o proxy)
  return `${protocol}://${window.location.host}${WS_PATH}`;
}

export function useNotificationsStream() {
  const queryClient = useQueryClient();
  const socketUrl = useMemo(getWebSocketUrl, []);

  useWebSocket(socketUrl ?? null, {
    shouldReconnect: () => true,
    reconnectInterval: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10_000),
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event === "notification.new") {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        }
      } catch (error) {
        console.error("Failed to handle notification event:", error);
      }
    },
    onError: (event) => {
      console.error("Notification WebSocket error:", event);
    },
  });
}
