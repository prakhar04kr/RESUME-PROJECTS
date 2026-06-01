import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";
import { logger } from "./logger";

interface GameRoom {
  clients: Map<string, WebSocket>;
  interval?: ReturnType<typeof setInterval>;
  startTime?: number;
}

const rooms = new Map<string, GameRoom>();

function getOrCreateRoom(gameId: string): GameRoom {
  if (!rooms.has(gameId)) {
    rooms.set(gameId, { clients: new Map() });
  }
  return rooms.get(gameId)!;
}

function broadcast(room: GameRoom, senderId: string, msg: object): void {
  const data = JSON.stringify(msg);
  room.clients.forEach((client, id) => {
    if (id !== senderId && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let currentGameId: string | null = null;
    let clientId: string | null = null;

    ws.on("message", (raw) => {
      let msg: { type: string; gameId?: string | number; userId?: string | number; wpm?: number; accuracy?: number };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "START" && msg.gameId && msg.userId) {
        currentGameId = String(msg.gameId);
        clientId = String(msg.userId) + "_" + Date.now();
        const room = getOrCreateRoom(currentGameId);
        room.clients.set(clientId, ws);

        if (!room.interval) {
          room.startTime = Date.now();
          room.interval = setInterval(() => {
            const elapsed = Date.now() - (room.startTime ?? Date.now());
            room.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "TICK", elapsed_ms: elapsed }));
              }
            });
          }, 500);
        }

        logger.debug({ gameId: currentGameId, clientId }, "WS client joined game");
      }

      if (msg.type === "WPM_UPDATE" && currentGameId && clientId) {
        const room = rooms.get(currentGameId);
        if (room) {
          broadcast(room, clientId, { type: "WPM_UPDATE", wpm: msg.wpm, accuracy: msg.accuracy, userId: clientId });
        }
      }
    });

    ws.on("close", () => {
      if (currentGameId && clientId) {
        const room = rooms.get(currentGameId);
        if (room) {
          room.clients.delete(clientId);
          if (room.clients.size === 0) {
            if (room.interval) clearInterval(room.interval);
            rooms.delete(currentGameId);
          }
        }
      }
    });
  });

  logger.info("WebSocket server attached at /ws");
  return wss;
}
