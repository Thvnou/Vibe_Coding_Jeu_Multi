import { describe, expect, it } from 'vitest';
import { WORLD, type PelletState, type Vector2 } from '@vibe-io/shared';
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

/**
 * Finds a point with no pellet nearby, so two players can rendezvous there
 * without either of them incidentally sweeping up a pellet on arrival.
 */
function findClearPoint(pellets: PelletState[], minSeparation = 80): Vector2 {
  const candidates: Vector2[] = [
    { x: WORLD.WIDTH / 2, y: WORLD.HEIGHT / 2 },
    { x: WORLD.WIDTH / 4, y: WORLD.HEIGHT / 4 },
    { x: (WORLD.WIDTH * 3) / 4, y: WORLD.HEIGHT / 4 },
    { x: WORLD.WIDTH / 4, y: (WORLD.HEIGHT * 3) / 4 },
    { x: (WORLD.WIDTH * 3) / 4, y: (WORLD.HEIGHT * 3) / 4 },
  ];
  const clear = candidates.find((point) => pellets.every((p) => distance(p.position, point) >= minSeparation));
  if (!clear) throw new Error('No clear point found for deterministic test setup');
  return clear;
}

/**
 * `GameRoom.update` resolves pellet collisions for every player each tick,
 * including ones not being intentionally moved in a given test step. A
 * player whose random spawn happens to land near a pellet would eat it
 * incidentally the first time *any* player's movement triggers an update.
 * Retrying spawn placement until every player starts clear of all pellets
 * removes that source of flakiness instead of just narrowing its window.
 */
function createRoomWithPlayersAwayFromPellets(
  players: Array<readonly [id: string, pseudo: string]>,
  minSeparation = 80,
): GameRoom {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const room = new GameRoom();
    for (const [id, pseudo] of players) room.addPlayer(id, pseudo);

    const snapshot = room.getSnapshot();
    const allClear = snapshot.players.every((player) =>
      snapshot.pellets.every((pellet) => distance(player.position, pellet.position) >= minSeparation),
    );
    if (allClear) return room;
  }
  throw new Error('Could not spawn players away from all pellets for a deterministic test');
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
    const room = createRoomWithPlayersAwayFromPellets([
      ['a', 'A'],
      ['b', 'B'],
    ]);
    const meetingPoint = findClearPoint(room.getSnapshot().pellets);
    teleportPlayer(room, 'b', meetingPoint);

    const deaths = teleportPlayer(room, 'a', meetingPoint);

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
    const room = createRoomWithPlayersAwayFromPellets([
      ['a', 'Predator'],
      ['b', 'Prey'],
    ]);

    const pellets = room.getSnapshot().pellets;
    const bonus = findIsolatedBonusPellet(pellets);
    const meetingPoint = findClearPoint(pellets);

    // Both rendezvous on a pellet-free point so the final collision can only
    // be the predator/prey encounter — never an incidental pellet pickup.
    teleportPlayer(room, 'b', meetingPoint);
    teleportPlayer(room, 'a', bonus.position);
    const deaths = teleportPlayer(room, 'a', meetingPoint);

    expect(deaths).toEqual([{ victimId: 'b', killerPseudo: 'Predator' }]);
    const snapshot = room.getSnapshot();
    expect(snapshot.players.map((p) => p.id)).toEqual(['a']);
    expect(snapshot.players[0]?.score).toBe(bonus.value);
  });
});
