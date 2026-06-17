import { WORLD, type PelletState, type Vector2 } from '@vibe-io/shared';

export function randomPosition(margin = 50): Vector2 {
  return {
    x: margin + Math.random() * (WORLD.WIDTH - margin * 2),
    y: margin + Math.random() * (WORLD.HEIGHT - margin * 2),
  };
}

export function spawnPellet(id: string): PelletState {
  const isMalus = Math.random() < 0.2;
  return {
    id,
    position: randomPosition(),
    radius: isMalus ? 10 : 8,
    type: isMalus ? 'malus' : 'bonus',
    value: isMalus ? -5 : 5,
  };
}
