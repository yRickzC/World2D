import { ResolvedClimate } from './WeatherTypes';

interface RainParticle {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

export class WeatherRenderer {
  private rainDrops: RainParticle[] = [];
  private readonly MAX_RAIN_DROPS = 300;

  constructor() {
    this.initRain();
  }

  private initRain(): void {
    this.rainDrops = [];
    for (let i = 0; i < this.MAX_RAIN_DROPS; i++) {
      this.rainDrops.push({
        x: Math.random(),
        y: Math.random(),
        length: Math.random() * 14 + 10,
        speed: Math.random() * 600 + 700,
        alpha: Math.random() * 0.4 + 0.3,
      });
    }
  }

  /**
   * Renders atmospheric weather effects (rain, fog, overcast tint) onto the canvas.
   * Can be called in screen coordinates (after camera restore) or within preview canvas.
   */
  renderWeather(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    climate: ResolvedClimate,
    deltaTime: number = 0.016,
    gameTime: number = 0
  ): void {
    // 1. Fog Overlay
    if (climate.fog > 0.01) {
      ctx.save();
      const fogAlpha = Math.min(0.85, climate.fog * 0.75);

      // Subtle fog pulsation
      const pulse = 1.0 + 0.06 * Math.sin(gameTime * 0.001);
      const effectiveAlpha = Math.min(0.9, fogAlpha * pulse);

      // Base fog wash
      ctx.fillStyle = `rgba(186, 205, 222, ${effectiveAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      // Fog volumetric vignette (clearer near screen center / player, thicker towards edges)
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.65
      );
      grad.addColorStop(0, 'rgba(200, 215, 230, 0.0)');
      grad.addColorStop(0.6, `rgba(180, 200, 220, ${(effectiveAlpha * 0.4).toFixed(3)})`);
      grad.addColorStop(1, `rgba(160, 185, 210, ${(effectiveAlpha * 0.8).toFixed(3)})`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 2. Overcast darkness from rain
    if (climate.rain > 0.05) {
      ctx.save();
      const stormTintAlpha = climate.rain * 0.32;
      ctx.fillStyle = `rgba(15, 23, 42, ${stormTintAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 3. Rain droplets
    if (climate.rain > 0.02) {
      ctx.save();
      const activeCount = Math.floor(this.MAX_RAIN_DROPS * climate.rain);
      const windOffset = (climate.wind || 0.2) * 120;

      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();

      for (let i = 0; i < activeCount; i++) {
        const drop = this.rainDrops[i];

        // Move drop downwards with wind slant
        drop.y += (drop.speed * deltaTime) / height;
        drop.x += ((windOffset * 0.5 + 40) * deltaTime) / width;

        // Wrap around screen
        if (drop.y > 1.0) {
          drop.y = -0.05;
          drop.x = Math.random();
        }
        if (drop.x > 1.0) {
          drop.x = -0.05;
        }

        const sx = drop.x * width;
        const sy = drop.y * height;
        const ex = sx + (windOffset * 0.06 + 3);
        const ey = sy + drop.length;

        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
      }
      ctx.stroke();

      // Splashes at the bottom
      ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
      for (let i = 0; i < activeCount; i += 6) {
        const drop = this.rainDrops[i];
        if (drop.y > 0.85) {
          const sx = drop.x * width;
          const sy = drop.y * height;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 3, 1, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }
}
