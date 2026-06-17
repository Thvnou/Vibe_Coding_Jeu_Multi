import { describe, expect, it } from 'vitest';
import { isValidDirection, sanitizePseudo } from './validation.js';

describe('sanitizePseudo', () => {
  it('trims whitespace', () => {
    expect(sanitizePseudo('  Alice  ')).toBe('Alice');
  });

  it('truncates to 16 characters', () => {
    expect(sanitizePseudo('A'.repeat(50))).toBe('A'.repeat(16));
  });

  it('falls back to "Joueur" for an empty string', () => {
    expect(sanitizePseudo('   ')).toBe('Joueur');
  });

  it('falls back to "Joueur" for non-string payloads (malicious or buggy client)', () => {
    expect(sanitizePseudo(undefined)).toBe('Joueur');
    expect(sanitizePseudo(42)).toBe('Joueur');
    expect(sanitizePseudo({ pseudo: 'Alice' })).toBe('Joueur');
    expect(sanitizePseudo(['Alice'])).toBe('Joueur');
  });
});

describe('isValidDirection', () => {
  it('accepts a well-formed direction vector', () => {
    expect(isValidDirection({ x: 1, y: -1 })).toBe(true);
    expect(isValidDirection({ x: 0, y: 0 })).toBe(true);
  });

  it('rejects non-object payloads', () => {
    expect(isValidDirection(null)).toBe(false);
    expect(isValidDirection(undefined)).toBe(false);
    expect(isValidDirection('1,1')).toBe(false);
    expect(isValidDirection(42)).toBe(false);
  });

  it('rejects missing or non-numeric fields', () => {
    expect(isValidDirection({ x: 1 })).toBe(false);
    expect(isValidDirection({ x: '1', y: 1 })).toBe(false);
    expect(isValidDirection({ x: 1, y: '1' })).toBe(false);
  });

  it('rejects NaN and Infinity (would corrupt the simulation)', () => {
    expect(isValidDirection({ x: NaN, y: 0 })).toBe(false);
    expect(isValidDirection({ x: 0, y: Infinity })).toBe(false);
    expect(isValidDirection({ x: -Infinity, y: 0 })).toBe(false);
  });
});
