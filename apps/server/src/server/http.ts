import type { IncomingMessage, ServerResponse } from "node:http";
import type { RoomManager } from "./room-manager";

export function createHttpHandler(roomManager: RoomManager) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }

    if (req.method === "POST" && req.url === "/api/games") {
      const roomId = roomManager.createRoom();
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ roomId }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
  }
}