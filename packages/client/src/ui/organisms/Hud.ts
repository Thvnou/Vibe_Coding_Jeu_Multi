import { ScoreBadge } from '../atoms/ScoreBadge.js';

export class Hud {
  private scoreBadge: ScoreBadge;

  constructor(
    private root: HTMLElement,
    scoreEl: HTMLElement,
  ) {
    this.scoreBadge = new ScoreBadge(scoreEl);
  }

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }

  setScore(score: number): void {
    this.scoreBadge.setScore(score);
  }
}
