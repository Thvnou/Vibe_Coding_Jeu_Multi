const MAX_PSEUDO_LENGTH = 16;

/** Server never trusts client-typed payloads at runtime — sockets can send arbitrary JSON. */
export function sanitizePseudo(input: unknown): string {
  if (typeof input !== 'string') return 'Joueur';
  const trimmed = input.trim().slice(0, MAX_PSEUDO_LENGTH);
  return trimmed.length > 0 ? trimmed : 'Joueur';
}

export function isValidDirection(input: unknown): input is { x: number; y: number } {
  if (typeof input !== 'object' || input === null) return false;
  const { x, y } = input as Record<string, unknown>;
  return typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y);
}
