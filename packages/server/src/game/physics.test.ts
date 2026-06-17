import { describe, expect, it } from 'vitest';
import { circlesOverlap, clamp, distance, moveTowards } from './physics.js';

describe('distance', () => {
  it('computes the euclidean distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('returns 0 for identical points', () => {
    expect(distance({ x: 10, y: -2 }, { x: 10, y: -2 })).toBe(0);
  });
});

describe('circlesOverlap', () => {
  it('returns true when circles intersect', () => {
    expect(circlesOverlap({ x: 0, y: 0 }, 10, { x: 15, y: 0 }, 10)).toBe(true);
  });

  it('returns false when circles are far apart', () => {
    expect(circlesOverlap({ x: 0, y: 0 }, 10, { x: 100, y: 0 }, 10)).toBe(false);
  });

  it('treats exactly-touching circles as not overlapping (strict inequality)', () => {
    expect(circlesOverlap({ x: 0, y: 0 }, 10, { x: 20, y: 0 }, 10)).toBe(false);
  });
});

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the lower bound', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to the upper bound', () => {
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

describe('moveTowards', () => {
  it('moves the position along a normalized direction scaled by speed and dt', () => {
    const result = moveTowards({ x: 0, y: 0 }, { x: 1, y: 0 }, 100, 1);
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(0);
  });

  it('normalizes diagonal directions so speed stays constant', () => {
    const result = moveTowards({ x: 0, y: 0 }, { x: 1, y: 1 }, 100, 1);
    expect(distance({ x: 0, y: 0 }, result)).toBeCloseTo(100);
  });

  it('does not move when direction is zero', () => {
    const result = moveTowards({ x: 5, y: 5 }, { x: 0, y: 0 }, 100, 1);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(5);
  });
});
