import type { PlayerState } from '@vibe-io/shared';

const MAX_ROWS = 10;

export class Leaderboard {
  constructor(
    private root: HTMLElement,
    private listEl: HTMLOListElement,
  ) {}

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }

  update(players: PlayerState[]): void {
    const ranked = [...players].sort((a, b) => b.score - a.score).slice(0, MAX_ROWS);
    this.listEl.replaceChildren(
      ...ranked.map((player) => {
        const li = document.createElement('li');
        li.textContent = `${player.pseudo} — ${Math.round(player.score)}`;
        return li;
      }),
    );
  }
}
