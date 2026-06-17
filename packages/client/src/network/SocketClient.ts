import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  GameStateSnapshot,
  ServerToClientEvents,
  Vector2,
} from '@vibe-io/shared';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class SocketClient {
  private socket: AppSocket;

  constructor(serverUrl: string) {
    this.socket = io(serverUrl, { transports: ['websocket'] });
  }

  join(pseudo: string): void {
    this.socket.emit('join', pseudo);
  }

  sendInput(direction: Vector2): void {
    this.socket.emit('input', direction);
  }

  onJoined(callback: (selfId: string) => void): void {
    this.socket.on('joined', callback);
  }

  onState(callback: (snapshot: GameStateSnapshot) => void): void {
    this.socket.on('state', callback);
  }

  onDied(callback: (killedBy: string | null) => void): void {
    this.socket.on('died', callback);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
