export class ScoreBadge {
  constructor(private element: HTMLElement) {}

  setScore(score: number): void {
    this.element.textContent = `Score: ${Math.round(score)}`;
  }
}
