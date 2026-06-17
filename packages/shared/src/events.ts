import type { GameStateSnapshot, Vector2 } from './types.js';

export interface ClientToServerEvents {
  join: (pseudo: string) => void;
  input: (direction: Vector2) => void;
}

export interface ServerToClientEvents {
  state: (snapshot: GameStateSnapshot) => void;
  joined: (selfId: string) => void;
  died: (killedBy: string | null) => void;
}
