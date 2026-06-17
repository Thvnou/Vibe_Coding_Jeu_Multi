import type { GameStateSnapshot, Vector2 } from '@vibe-io/shared';

const GRID_SIZE = 100;
const GRID_COLOR = '#1f2330';
const TEXT_COLOR = '#f5f6fa';

/** Draws the world on a canvas, centered on the local player. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  draw(snapshot: GameStateSnapshot, selfId: string | null): void {
    const self = snapshot.players.find((p) => p.id === selfId);
    const camera: Vector2 = self ? self.position : { x: 0, y: 0 };

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid(camera);

    for (const pellet of snapshot.pellets) {
      const screen = this.toScreen(pellet.position, camera);
      this.ctx.fillStyle = pellet.type === 'bonus' ? '#5bff8c' : '#ff5b6e';
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, pellet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    for (const player of snapshot.players) {
      const screen = this.toScreen(player.position, camera);
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, player.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = TEXT_COLOR;
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(player.pseudo, screen.x, screen.y - player.radius - 8);
    }
  }

  private drawGrid(camera: Vector2): void {
    const { width, height } = this.canvas;
    const offsetX = -(camera.x % GRID_SIZE);
    const offsetY = -(camera.y % GRID_SIZE);

    this.ctx.strokeStyle = GRID_COLOR;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = offsetX; x < width; x += GRID_SIZE) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += GRID_SIZE) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();
  }

  private toScreen(position: Vector2, camera: Vector2): Vector2 {
    return {
      x: position.x - camera.x + this.canvas.width / 2,
      y: position.y - camera.y + this.canvas.height / 2,
    };
  }
}
