import type { ClientToServerEvents, ServerToClientEvents } from '@rps/shared';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: 'http://localhost:5173' },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

httpServer.listen(3000, () => {
  console.log('Socket.io server listening on http://localhost:3000');
});