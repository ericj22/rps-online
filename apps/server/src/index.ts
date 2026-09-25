import type { ClientToServerEvents, Game, Player, ServerToClientEvents, SocketData } from '@rps/shared';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomUUID } from "node:crypto";
import { resolveGame } from './game';

const games = new Map<string, Game>();

const httpServer = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /games -> create a new game room
  if (req.method === "POST" && req.url === "/api/games") {
    const roomId = randomUUID().slice(0, 6);

    games.set(roomId, {
      id: roomId,
      idToRole: new Map<string, number>,
      players: [],
      status: "SETTING_UP",
    })

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ roomId }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
})


const io = new Server<
  ClientToServerEvents, 
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: { origin: '*' },
});

// Some middleware for error cases
io.use((socket, next) => {
  const roomId = socket.handshake.auth?.roomId;

  if (!roomId || typeof roomId !== "string") {
    return next(new Error("Missing or invalid roomId in handshake auth"));
  }

  const game = games.get(roomId);

  if (!game) {
    return next(new Error("Game room doesn't exist"));
  }

  if (game.players.length >= 2) {
    return next(new Error("Game room is full"));
  }

  socket.data.roomId = roomId;
  next();
})

// Happy Path?
io.on('connection', (socket) => {
  const roomId = socket.data.roomId!;
  const game = games.get(roomId);

  if (!game) {
    socket.disconnect();
    return;
  }

  socket.join(roomId);
  game.players.push({
    id: socket.id,
    name: "", // randomly generate name?
    role: game.players.length,
    ready: false,
    score: 0,
  });

  game.idToRole.set(socket.id, game.players.length-1);

  if (game.players.length === 2) {
    game.status = "SETTING_UP";
    io.to(roomId).emit("gameStart");
  }

  socket.on("readyUp", (data) => {
    const roomId = socket.data.roomId!;
    const game = games.get(roomId);

    if (!game || game.status !== "SETTING_UP") {
      return;
    }

    const role = game.idToRole.get(socket.id);

    if (!role) {
      return;
    }

    const player = game.players[role];
    if (!player) {
      return;
    }
    player.name = data.name;
    player.ready = true;

    io.to(roomId).emit("readied", { playerId: socket.id });

    const p1 = game.players[0];
    const p2 = game.players[1];
    
    // Event back for single ready???
    if (p1 && p2 && p1.ready && p2.ready) {
      game.status = "CHOOSING";
      io.to(roomId).emit("allReady");
    }
  });

  socket.on('submitMove', (data) => {
    const roomId = socket.data.roomId!;
    const game = games.get(roomId);

    if (!game || game.status !== "CHOOSING") return;

    const role = game.idToRole.get(socket.id);
    if (!role) {
      return;
    }

    const player = game.players[role];

    if (!player) {
      return;
    }
    player.move = data.move;

    const p1 = game.players[0];
    const p2 = game.players[1];

    if (p1 && p2 && p1.move && p2.move) {
      // Calculate result
      const result = resolveGame(p1, p2);
      if (result === "ERROR" || result === "TIE") {
        p1.move = undefined;
        p2.move = undefined;
        io.to(roomId).emit('replayRound');
      } else {
        game.status = "FINISHED";
        if (result === "PLAYER1_WIN") {
          p1.score += 1;
        } else {
          p2.score += 1;
        }
        io.to(roomId).emit('roundResolved', { players: game.players, result: result });
      }
    }
  });

  socket.on('replay', () => {
    const roomId = socket.data.roomId!;
    const game = games.get(roomId);

    if (!game || game.status !== "FINISHED") return;

    const p1 = game.players[0];
    const p2 = game.players[1];
    
    if (!p1 || !p2) {
      return; // Can't replay if someone disconnected - have to handle this state
    }

    p1.move = undefined;
    p2.move = undefined;
    game.status = "CHOOSING";
    io.to(roomId).emit('replayRound');
  });

  socket.on('disconnecting', () => {
    const activeGame = games.get(roomId);
    if (!activeGame) return;

    const targetRole = activeGame.idToRole.get(socket.id);
    if (!targetRole) return;

    activeGame.players.splice(targetRole, 1);

    // Set game state to complete? Forfeit other player?
    io.to(roomId).emit("playerLeft", {playerId: socket.id});

    if (activeGame.players.length === 0) {
      games.delete(roomId);
    } else {
      const otherPlayer = activeGame.players[0];
      game.status = "SETTING_UP";
      
      if (otherPlayer) {
        activeGame.idToRole.set(otherPlayer?.id, 0);
        otherPlayer.role = 0;
      }
    }
  });
});



// httpServer.listen(3000, () => {
//   console.log('Socket.io server listening on http://localhost:3000');
// });