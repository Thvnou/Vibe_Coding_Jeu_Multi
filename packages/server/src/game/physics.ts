import type { Vector2 } from '@vibe-io/shared';

export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function circlesOverlap(
  posA: Vector2,
  radiusA: number,
  posB: Vector2,
  radiusB: number,
): boolean {
  return distance(posA, posB) < radiusA + radiusB;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function moveTowards(
  position: Vector2,
  direction: Vector2,
  speed: number,
  dt: number,
): Vector2 {
  const length = Math.hypot(direction.x, direction.y) || 1;
  const normalized = { x: direction.x / length, y: direction.y / length };
  return {
    x: position.x + normalized.x * speed * dt,
    y: position.y + normalized.y * speed * dt,
  };
}
