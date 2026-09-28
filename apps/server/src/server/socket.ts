import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@rps/shared";
import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type { RoomManager } from "./room-manager";

export function registerSocketServer(
  httpServer: HttpServer,
  roomManager: RoomManager
): Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const roomId = socket.handshake.auth?.roomId;
    if (!roomId || typeof roomId !== "string") {
      return next(new Error("Invalid room ID"));
    }

    const game = roomManager.get(roomId);
    if (!game) return next(new Error("Room does not exist"));
    if (game.isFull) return next(new Error("Room is full"));

    socket.data.roomId = roomId;
    next();
  });

  io.on("connection", (socket) => {
    const roomId = socket.data.roomId!;
    const game = roomManager.get(roomId);
    if (!game || game.isFull) return socket.disconnect();

    socket.join(roomId);
    const slot = game.join(socket.id);
    roomManager.clearTtl(roomId);

    // Should probably emit like a snapshot of the game
    // when someone joins so that they know the other player
    socket.emit("assignedSlot", { slot: slot });
    io.to(roomId).emit("playerJoined", { snapshot: game.getSnapshot() });

    if (game.status === "READYING_UP") {
      io.to(roomId).emit("readyPhaseStarted");
    }

    socket.on("readyUp", ({ name }) => {
      try {
        const { allReady } = game.ready(socket.id, name);
        io.to(roomId).emit("readied", { playerId: socket.id });
        if (allReady) io.to(roomId).emit("allReady");
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("submitMove", ({ move }) => {
      try {
        const resolution = game.submitMove(socket.id, move);
        if (resolution) {
          // See when implementing frontend:
          // Does it make sense to emit tie or just round resolved
          // And handle the difference in the frontend
          io.to(roomId).emit("roundResolved", { resolution: resolution });
        }
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("requestReplay", () => {
      try {
        const { roundReset } = game.requestReplay(socket.id);
        io.to(roomId).emit("replayRequested", { playerId: socket.id });
        if (roundReset) io.to(roomId).emit("replayRound");
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("disconnecting", () => {
      const { remainingPlayer, isEmpty } = game.leave(socket.id);

      io.to(roomId).emit("playerLeft", { playerId: socket.id });

      if (isEmpty) {
        roomManager.delete(roomId);
      } else {
        roomManager.scheduleTtl(roomId, 30_000);
      }
    });
  });

  return io;
}