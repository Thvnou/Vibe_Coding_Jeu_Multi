import type { Vector2 } from '@vibe-io/shared';

/** Tracks the pointer position relative to the screen center and exposes it as a direction vector. */
export class InputController {
  private direction: Vector2 = { x: 0, y: 0 };

  constructor(target: HTMLElement) {
    target.addEventListener('mousemove', (event) => {
      this.direction = {
        x: event.clientX - window.innerWidth / 2,
        y: event.clientY - window.innerHeight / 2,
      };
    });
  }

  getDirection(): Vector2 {
    return this.direction;
  }
}
