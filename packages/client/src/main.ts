import { GameClient } from './game/GameClient.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

new GameClient(SERVER_URL, {
  canvas: requireElement('#game-canvas'),
  menuRoot: requireElement('#menu'),
  joinForm: requireElement('#join-form'),
  menuMessage: requireElement('#menu-message'),
  hudRoot: requireElement('#hud'),
  hudScore: requireElement('#hud-score'),
  leaderboardRoot: requireElement('#leaderboard'),
  leaderboardList: requireElement('#leaderboard-list'),
});
