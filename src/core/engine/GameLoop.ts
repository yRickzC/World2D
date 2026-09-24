export class GameLoop {
  private rafId: number | null = null;
  private lastTime: number = 0;
  private running: boolean = false;
  private onUpdate: (dt: number) => void;
  private onRender: () => void;

  constructor(onUpdate: (dt: number) => void, onRender: () => void) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (timestamp: number) => {
    if (!this.running) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp dt to maximum 0.1s to avoid physics tunneling on frame drops or tab switching
    const dt = Math.min(rawDt, 0.1);

    this.onUpdate(dt);
    this.onRender();

    this.rafId = requestAnimationFrame(this.tick);
  };
}
