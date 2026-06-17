export const BASE_RADIUS = 20;
export const BASE_SPEED = 220;
export const EAT_RATIO_THRESHOLD = 1.1;

export function radiusFromScore(score: number): number {
  return BASE_RADIUS + Math.sqrt(score) * 2;
}

export function speedFromRadius(radius: number): number {
  return BASE_SPEED / Math.sqrt(radius / BASE_RADIUS);
}

export function canEat(biggerRadius: number, smallerRadius: number): boolean {
  return biggerRadius >= smallerRadius * EAT_RATIO_THRESHOLD;
}
