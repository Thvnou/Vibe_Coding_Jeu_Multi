import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@vibe-io/shared';
import { GameRoom } from './game/GameRoom.js';
import { isValidDirection, sanitizePseudo } from './validation.js';

const PORT = Number(process.env.PORT ?? 3001);
const TICK_RATE_HZ = 30;
const MAX_PLAYERS = 50;
const MIN_INPUT_INTERVAL_MS = 20;

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN ?? '*' },
});

const room = new GameRoom();
const lastInputAt = new Map<string, number>();

io.on('connection', (socket) => {
  socket.on('join', (pseudo) => {
    if (room.playerCount() >= MAX_PLAYERS) return;
    room.addPlayer(socket.id, sanitizePseudo(pseudo));
    socket.emit('joined', socket.id);
  });

  socket.on('input', (direction) => {
    if (!isValidDirection(direction)) return;
    const now = Date.now();
    if (now - (lastInputAt.get(socket.id) ?? 0) < MIN_INPUT_INTERVAL_MS) return;
    lastInputAt.set(socket.id, now);
    room.setInput(socket.id, direction);
  });

  socket.on('disconnect', () => {
    room.removePlayer(socket.id);
    lastInputAt.delete(socket.id);
  });
});

const dt = 1 / TICK_RATE_HZ;
setInterval(() => {
  const deaths = room.update(dt);
  for (const death of deaths) {
    io.to(death.victimId).emit('died', death.killerPseudo);
  }
  io.emit('state', room.getSnapshot());
}, 1000 / TICK_RATE_HZ);

httpServer.listen(PORT, () => {
  console.info(`Game server listening on port ${PORT}`);
});
