import { Camera, Player } from '../../../core/configuracao/types';

interface Star {
  xPct: number;
  yPct: number;
  size: number;
  speed: number;
  phase: number;
}

export class LightingRenderer {
  private stars: Star[] = [];

  constructor() {
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        xPct: Math.random(),
        yPct: Math.random(),
        size: Math.random() * 1.6 + 0.8,
        speed: Math.random() * 0.003 + 0.001,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  renderLighting(
    ctx: CanvasRenderingContext2D,
    player: Player | null | undefined,
    camera: Camera,
    width: number,
    height: number,
    zoom: number,
    timeHour: number,
    time: number
  ) {
    const screenFocusX = player ? width / 2 + (player.x - camera.x) * zoom : width / 2;
    const screenFocusY = player ? height / 2 + (player.y - camera.y) * zoom : height / 2;

    // Night factor: 1.0 between 21:00 and 04:30
    let night = 0;
    if (timeHour < 4.5 || timeHour >= 21.0) {
      night = 1.0;
    } else if (timeHour >= 4.5 && timeHour < 7.0) {
      night = 1.0 - (timeHour - 4.5) / 2.5;
    } else if (timeHour >= 17.5 && timeHour < 21.0) {
      night = (timeHour - 17.5) / 3.5;
    }

    // Dawn factor
    let dawn = 0;
    if (timeHour >= 4.5 && timeHour < 6.2) {
      dawn = (timeHour - 4.5) / 1.7;
    } else if (timeHour >= 6.2 && timeHour < 8.0) {
      dawn = 1.0 - (timeHour - 6.2) / 1.8;
    }

    // Sunset factor
    let sunset = 0;
    if (timeHour >= 16.5 && timeHour < 18.5) {
      sunset = (timeHour - 16.5) / 2.0;
    } else if (timeHour >= 18.5 && timeHour < 20.8) {
      sunset = 1.0 - (timeHour - 18.5) / 2.3;
    }

    // 1. Dawn morning glow
    if (dawn > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(251, 146, 60, ${(dawn * 0.16).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = `rgba(244, 114, 182, ${(dawn * 0.08).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 2. Sunset golden hour glow
    if (sunset > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(245, 158, 11, ${(sunset * 0.2).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = `rgba(139, 92, 246, ${(sunset * 0.1).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(
        screenFocusX,
        screenFocusY,
        width * 0.22,
        screenFocusX,
        screenFocusY,
        width * 0.8
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, `rgba(124, 45, 18, ${(sunset * 0.26).toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 3. Night darkness with twinkling stars, fireflies, and player lantern
    if (night > 0.01) {
      ctx.save();

      // Twinkling stars
      if (night > 0.25) {
        ctx.fillStyle = '#ffffff';
        const starAlphaBase = (night - 0.25) / 0.75;
        for (let i = 0; i < this.stars.length; i++) {
          const s = this.stars[i];
          const sx = s.xPct * width;
          const sy = s.yPct * height;

          const distToFocus = Math.hypot(sx - screenFocusX, sy - screenFocusY);
          if (player && distToFocus < 120 * zoom) continue;

          const twinkle = 0.4 + 0.6 * Math.sin(time * s.speed + s.phase);
          ctx.globalAlpha = starAlphaBase * twinkle * 0.85;
          ctx.beginPath();
          ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Ambient Fireflies
      if (night > 0.3) {
        ctx.fillStyle = '#fef08a';
        for (let f = 0; f < 10; f++) {
          const fx = screenFocusX + Math.sin(time * 0.001 + f * 1.5) * (140 + f * 22) * zoom;
          const fy = screenFocusY + Math.cos(time * 0.0012 + f * 2.1) * (100 + f * 18) * zoom;
          const fGlow = 0.3 + 0.7 * Math.sin(time * 0.003 + f * 2.0);
          ctx.globalAlpha = night * fGlow * 0.75;
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (player) {
        // Player Lantern + Night Darkness Radial Cutout
        const flicker = Math.sin(time * 0.008) * 3 + Math.cos(time * 0.016) * 2;
        const lanternRadius = (165 + flicker) * zoom;

        const lightGrad = ctx.createRadialGradient(
          screenFocusX,
          screenFocusY,
          15 * zoom,
          screenFocusX,
          screenFocusY,
          lanternRadius
        );

        lightGrad.addColorStop(0, `rgba(254, 240, 138, ${(0.18 * night).toFixed(3)})`);
        lightGrad.addColorStop(0.25, `rgba(253, 224, 71, ${(0.06 * night).toFixed(3)})`);
        lightGrad.addColorStop(0.65, `rgba(15, 23, 42, ${(0.68 * night).toFixed(3)})`);
        lightGrad.addColorStop(1, `rgba(8, 14, 30, ${(0.91 * night).toFixed(3)})`);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Free-camera ambient night overlay
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = `rgba(10, 16, 32, ${(0.82 * night).toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
    }
  }
}
