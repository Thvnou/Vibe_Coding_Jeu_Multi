import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@vibe-io/shared';
import { GameRoom } from './game/GameRoom.js';
import { isValidDirection, sanitizePseudo } from './validation.js';

const PORT = Number(process.env.PORT ?? 3001);
const TICK_RATE_HZ = 30;
const MAX_PLAYERS = 50;
const MIN_INPUT_INTERVAL_MS = 20;

const room = new GameRoom();

/** Plain HTTP requests (Render health checks, manual pings) get a JSON status instead of hanging. */
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', players: room.playerCount() }));
});
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN ?? '*' },
});
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
