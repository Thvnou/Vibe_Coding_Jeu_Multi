import { describe, expect, it } from 'vitest';
import type { PelletState, Vector2 } from '@vibe-io/shared';
import { GameRoom, type PlayerDeath } from './GameRoom.js';
import { distance } from './physics.js';
import { BASE_RADIUS, radiusFromScore, speedFromRadius } from './rules.js';

/**
 * Deterministically moves a player onto an exact target position in a single
 * `update` call, bypassing the randomness of spawn positions so collision
 * scenarios can be asserted without flaky timing.
 */
function teleportPlayer(room: GameRoom, playerId: string, target: Vector2): PlayerDeath[] {
  const before = room.getSnapshot().players.find((p) => p.id === playerId);
  if (!before) return [];
  const dist = distance(before.position, target);
  if (dist === 0) return [];

  const direction = { x: target.x - before.position.x, y: target.y - before.position.y };
  const speed = speedFromRadius(before.radius);
  room.setInput(playerId, direction);
  const deaths = room.update(dist / speed);
  room.setInput(playerId, { x: 0, y: 0 });
  return deaths;
}

/**
 * Picks a bonus pellet with no neighbour nearby, so teleporting a player onto
 * it cannot incidentally also sweep up another (possibly malus) pellet.
 */
function findIsolatedBonusPellet(pellets: PelletState[], minSeparation = 80): PelletState {
  const bonus = pellets.filter((p) => p.type === 'bonus');
  const isolated = bonus.find((candidate) =>
    pellets.every(
      (other) => other.id === candidate.id || distance(other.position, candidate.position) >= minSeparation,
    ),
  );
  if (!isolated) throw new Error('No isolated bonus pellet found for deterministic test setup');
  return isolated;
}

/** Asserts no pellet sits close enough to `position` to be swept up incidentally. */
function expectNoPelletNear(pellets: PelletState[], position: Vector2, minSeparation = 80): void {
  const tooClose = pellets.some((p) => distance(p.position, position) < minSeparation);
  if (tooClose) throw new Error('A pellet is too close to the target position for a deterministic test');
}

describe('GameRoom', () => {
  it('adds a player with default stats visible in the snapshot', () => {
    const room = new GameRoom();
    room.addPlayer('p1', 'Alice');

    const [player] = room.getSnapshot().players;
    expect(player).toMatchObject({ id: 'p1', pseudo: 'Alice', score: 0, radius: BASE_RADIUS });
  });

  it('removes a player from the snapshot', () => {
    const room = new GameRoom();
    room.addPlayer('p1', 'Alice');
    room.removePlayer('p1');

    expect(room.getSnapshot().players).toHaveLength(0);
  });

  it('ignores input for unknown players', () => {
    const room = new GameRoom();
    expect(() => room.setInput('ghost', { x: 1, y: 0 })).not.toThrow();
  });

  it('increments the tick counter on every update', () => {
    const room = new GameRoom();
    room.update(1 / 30);
    room.update(1 / 30);

    expect(room.getSnapshot().tick).toBe(2);
  });

  it('does not let two equally-sized players eat each other', () => {
    const room = new GameRoom();
    room.addPlayer('a', 'A');
    room.addPlayer('b', 'B');
    const b = room.getSnapshot().players.find((p) => p.id === 'b')!;

    const deaths = teleportPlayer(room, 'a', b.position);

    expect(deaths).toHaveLength(0);
    expect(room.getSnapshot().players).toHaveLength(2);
  });

  it('grows score and radius when eating a bonus pellet, and respawns it', () => {
    const room = new GameRoom();
    room.addPlayer('a', 'A');
    const pelletsBefore = room.getSnapshot().pellets;
    const bonus = findIsolatedBonusPellet(pelletsBefore);

    teleportPlayer(room, 'a', bonus.position);

    const snapshot = room.getSnapshot();
    const player = snapshot.players.find((p) => p.id === 'a')!;
    expect(player.score).toBe(bonus.value);
    expect(player.radius).toBeCloseTo(radiusFromScore(bonus.value));
    expect(snapshot.pellets.find((p) => p.id === bonus.id)).toBeUndefined();
    expect(snapshot.pellets).toHaveLength(pelletsBefore.length);
  });

  it('lets a bigger player eat a smaller one and inherit its score', () => {
    const room = new GameRoom();
    room.addPlayer('a', 'Predator');
    room.addPlayer('b', 'Prey');

    const bonus = findIsolatedBonusPellet(room.getSnapshot().pellets);
    teleportPlayer(room, 'a', bonus.position);

    const b = room.getSnapshot().players.find((p) => p.id === 'b')!;
    expectNoPelletNear(room.getSnapshot().pellets, b.position);
    const deaths = teleportPlayer(room, 'a', b.position);

    expect(deaths).toEqual([{ victimId: 'b', killerPseudo: 'Predator' }]);
    const snapshot = room.getSnapshot();
    expect(snapshot.players.map((p) => p.id)).toEqual(['a']);
    expect(snapshot.players[0]?.score).toBe(bonus.value);
  });
});
