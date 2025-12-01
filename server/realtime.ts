import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { pool, isNeonDatabase } from "./db";
import { log } from "./vite";

const CHANNEL_NAME = "notifications_channel";

export async function initNotificationStream(server: Server) {
  if (isNeonDatabase) {
    log(
      "LISTEN/NOTIFY is not supported on Neon serverless connections. Notification WebSocket disabled.",
      "notifications",
    );
    return;
  }

  const wss = new WebSocketServer({
    server,
    path: "/ws/notifications",
  });

  const clients = new Set<WebSocket>();

  const broadcast = (payload: unknown) => {
    const message = JSON.stringify(payload);
    for (const socket of clients) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  };

  wss.on("connection", (socket) => {
    clients.add(socket);
    socket.on("close", () => clients.delete(socket));
  });

  let listenerClient: any = null;

  const setupListener = async () => {
    const client = await pool.connect();
    listenerClient = client;

    await client.query(`LISTEN ${CHANNEL_NAME}`);
    log(`Subscribed to ${CHANNEL_NAME}`, "notifications");

    client.on("notification", (msg: { payload?: string | null }) => {
      if (!msg?.payload) return;

      try {
        const data = JSON.parse(msg.payload);
        broadcast(data);
      } catch (error) {
        log(
          `Failed to parse notification payload: ${(error as Error).message}`,
          "notifications",
        );
      }
    });

    client.on("error", (error: Error) => {
      log(
        `PostgreSQL listener error: ${error.message}. Retrying in 2s`,
        "notifications",
      );
      cleanupListener();
      setTimeout(() => {
        setupListener().catch((err) => {
          log(`Failed to restart listener: ${err.message}`, "notifications");
        });
      }, 2000);
    });
  };

  const cleanupListener = () => {
    if (listenerClient) {
      try {
        listenerClient.release?.();
      } catch (error) {
        log(
          `Failed to release listener client: ${(error as Error).message}`,
          "notifications",
        );
      } finally {
        listenerClient = null;
      }
    }
  };

  const shutdown = () => {
    cleanupListener();
    try {
      wss.close();
    } catch (error) {
      // ignore
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  await setupListener();
}

















