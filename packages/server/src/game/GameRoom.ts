import { randomUUID } from 'node:crypto';
import {
  WORLD,
  type GameStateSnapshot,
  type PelletState,
  type PlayerState,
  type Vector2,
} from '@vibe-io/shared';
import { circlesOverlap, clamp, moveTowards } from './physics.js';
import { randomPosition, spawnPellet } from './spawn.js';
import { BASE_RADIUS, canEat, radiusFromScore, speedFromRadius } from './rules.js';

const PELLET_TARGET_COUNT = 80;

interface PlayerRuntime {
  state: PlayerState;
  direction: Vector2;
}

export interface PlayerDeath {
  victimId: string;
  killerPseudo: string;
}

export class GameRoom {
  private players = new Map<string, PlayerRuntime>();
  private pellets = new Map<string, PelletState>();
  private tick = 0;

  constructor() {
    while (this.pellets.size < PELLET_TARGET_COUNT) {
      const pellet = spawnPellet(randomUUID());
      this.pellets.set(pellet.id, pellet);
    }
  }

  /** `pseudo` is assumed already sanitized by the network layer (system boundary). */
  addPlayer(id: string, pseudo: string): void {
    this.players.set(id, {
      state: {
        id,
        pseudo,
        position: randomPosition(200),
        radius: BASE_RADIUS,
        color: randomColor(),
        score: 0,
      },
      direction: { x: 0, y: 0 },
    });
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  playerCount(): number {
    return this.players.size;
  }

  setInput(id: string, direction: Vector2): void {
    const runtime = this.players.get(id);
    if (!runtime) return;
    runtime.direction = direction;
  }

  /** Advances the simulation by `dt` seconds and returns players who died this tick. */
  update(dt: number): PlayerDeath[] {
    this.tick += 1;

    for (const runtime of this.players.values()) {
      const speed = speedFromRadius(runtime.state.radius);
      const next = moveTowards(runtime.state.position, runtime.direction, speed, dt);
      runtime.state.position = {
        x: clamp(next.x, runtime.state.radius, WORLD.WIDTH - runtime.state.radius),
        y: clamp(next.y, runtime.state.radius, WORLD.HEIGHT - runtime.state.radius),
      };
    }

    this.resolvePelletCollisions();
    return this.resolvePlayerCollisions();
  }

  getSnapshot(): GameStateSnapshot {
    return {
      tick: this.tick,
      players: Array.from(this.players.values(), (r) => r.state),
      pellets: Array.from(this.pellets.values()),
    };
  }

  private resolvePelletCollisions(): void {
    for (const runtime of this.players.values()) {
      for (const pellet of this.pellets.values()) {
        if (!circlesOverlap(runtime.state.position, runtime.state.radius, pellet.position, pellet.radius)) {
          continue;
        }
        runtime.state.score = Math.max(0, runtime.state.score + pellet.value);
        runtime.state.radius = radiusFromScore(runtime.state.score);
        this.pellets.delete(pellet.id);
        const replacement = spawnPellet(randomUUID());
        this.pellets.set(replacement.id, replacement);
      }
    }
  }

  private resolvePlayerCollisions(): PlayerDeath[] {
    const deaths: PlayerDeath[] = [];
    const entries = Array.from(this.players.values());

    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const a = entries[i]!;
        const b = entries[j]!;
        if (!circlesOverlap(a.state.position, a.state.radius, b.state.position, b.state.radius)) {
          continue;
        }

        const [bigger, smaller] = a.state.radius >= b.state.radius ? [a, b] : [b, a];
        if (!canEat(bigger.state.radius, smaller.state.radius)) continue;

        bigger.state.score += smaller.state.score;
        bigger.state.radius = radiusFromScore(bigger.state.score);
        deaths.push({ victimId: smaller.state.id, killerPseudo: bigger.state.pseudo });
        this.removePlayer(smaller.state.id);
      }
    }

    return deaths;
  }
}

function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
}
