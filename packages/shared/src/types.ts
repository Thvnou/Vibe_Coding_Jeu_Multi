export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  id: string;
  pseudo: string;
  position: Vector2;
  radius: number;
  color: string;
  score: number;
}

export type PelletType = 'bonus' | 'malus';

export interface PelletState {
  id: string;
  position: Vector2;
  radius: number;
  type: PelletType;
  value: number;
}

export interface GameStateSnapshot {
  tick: number;
  players: PlayerState[];
  pellets: PelletState[];
}

export const WORLD = {
  WIDTH: 4000,
  HEIGHT: 4000,
} as const;
