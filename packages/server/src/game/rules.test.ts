import { describe, expect, it } from 'vitest';
import { BASE_RADIUS, BASE_SPEED, canEat, radiusFromScore, speedFromRadius } from './rules.js';

describe('radiusFromScore', () => {
  it('returns the base radius for a score of 0', () => {
    expect(radiusFromScore(0)).toBe(BASE_RADIUS);
  });

  it('grows with score but with diminishing returns (sqrt curve)', () => {
    const radiusAt100 = radiusFromScore(100);
    const radiusAt200 = radiusFromScore(200);
    const radiusAt300 = radiusFromScore(300);
    expect(radiusAt100).toBeGreaterThan(BASE_RADIUS);
    // Equal score increments (+100 each) yield shrinking radius increments.
    expect(radiusAt300 - radiusAt200).toBeLessThan(radiusAt200 - radiusAt100);
  });
});

describe('speedFromRadius', () => {
  it('returns the base speed at the base radius', () => {
    expect(speedFromRadius(BASE_RADIUS)).toBe(BASE_SPEED);
  });

  it('slows down larger players', () => {
    expect(speedFromRadius(BASE_RADIUS * 4)).toBeLessThan(BASE_SPEED);
  });

  it('speeds up smaller-than-base radii', () => {
    expect(speedFromRadius(BASE_RADIUS / 4)).toBeGreaterThan(BASE_SPEED);
  });
});

describe('canEat', () => {
  it('forbids eating same-size players (ratio exactly 1)', () => {
    expect(canEat(20, 20)).toBe(false);
  });

  it('forbids eating when just under the threshold', () => {
    expect(canEat(21, 20)).toBe(false);
  });

  it('allows eating once the size ratio reaches the threshold', () => {
    expect(canEat(22, 20)).toBe(true);
  });

  it('allows eating much smaller players', () => {
    expect(canEat(100, 20)).toBe(true);
  });
});
