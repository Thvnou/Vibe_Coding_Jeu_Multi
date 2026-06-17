import type { GameStateSnapshot } from '@vibe-io/shared';
import { SocketClient } from '../network/SocketClient.js';
import { InputController } from '../input/InputController.js';
import { Renderer } from '../render/Renderer.js';
import { Menu } from '../ui/organisms/Menu.js';
import { Hud } from '../ui/organisms/Hud.js';
import { Leaderboard } from '../ui/organisms/Leaderboard.js';

const INPUT_SEND_INTERVAL_MS = 50;

export interface GameClientElements {
  canvas: HTMLCanvasElement;
  menuRoot: HTMLElement;
  joinForm: HTMLFormElement;
  menuMessage: HTMLElement;
  hudRoot: HTMLElement;
  hudScore: HTMLElement;
  leaderboardRoot: HTMLElement;
  leaderboardList: HTMLOListElement;
}

/** Orchestrates network, input, rendering and UI — owns no game logic itself. */
export class GameClient {
  private socket: SocketClient;
  private input: InputController;
  private renderer: Renderer;
  private menu: Menu;
  private hud: Hud;
  private leaderboard: Leaderboard;
  private selfId: string | null = null;
  private latestSnapshot: GameStateSnapshot | null = null;

  constructor(serverUrl: string, elements: GameClientElements) {
    this.socket = new SocketClient(serverUrl);
    this.input = new InputController(elements.canvas);
    this.renderer = new Renderer(elements.canvas);
    this.hud = new Hud(elements.hudRoot, elements.hudScore);
    this.leaderboard = new Leaderboard(elements.leaderboardRoot, elements.leaderboardList);
    this.menu = new Menu(elements.menuRoot, elements.joinForm, elements.menuMessage, (pseudo) =>
      this.play(pseudo),
    );

    this.socket.onJoined((id) => {
      this.selfId = id;
      this.menu.hide();
      this.hud.show();
      this.leaderboard.show();
    });

    this.socket.onState((snapshot) => {
      this.latestSnapshot = snapshot;
    });

    this.socket.onDied((killedBy) => {
      this.selfId = null;
      this.hud.hide();
      this.leaderboard.hide();
      this.menu.show(killedBy ? `Mangé par ${killedBy} !` : 'Tu es mort.');
    });

    this.menu.show();
    this.startInputLoop();
    this.startRenderLoop();
  }

  private play(pseudo: string): void {
    this.socket.join(pseudo);
  }

  private startInputLoop(): void {
    setInterval(() => {
      if (!this.selfId) return;
      this.socket.sendInput(this.input.getDirection());
    }, INPUT_SEND_INTERVAL_MS);
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.latestSnapshot) {
        this.renderer.draw(this.latestSnapshot, this.selfId);
        const self = this.latestSnapshot.players.find((p) => p.id === this.selfId);
        if (self) this.hud.setScore(self.score);
        this.leaderboard.update(this.latestSnapshot.players);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
