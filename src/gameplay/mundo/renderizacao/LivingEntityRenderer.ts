import { WorldEntity } from '../../../core/configuracao/types';

export class LivingEntityRenderer {
  /**
   * Renders a living entity (creature, mob, npc, animal) with animations,
   * ground shadows, hit effects, nametags, and health indicators.
   */
  render(
    ctx: CanvasRenderingContext2D,
    ent: WorldEntity,
    gameTime: number,
    isHighlighted: boolean = false
  ) {
    ctx.save();
    ctx.translate(ent.x, ent.y);

    const width = ent.width || 36;
    const height = ent.height || 36;
    const size = ent.styleSize || 36;

    // 1. Soft Ground Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, height * 0.38, width * 0.42, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Target Highlight Circle (when hovered or targeted)
    if (isHighlighted) {
      ctx.save();
      ctx.strokeStyle = ent.behavior === 'hostile' ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(0, height * 0.38, width * 0.55, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Hit Shake and Vertical Walking / Idle Bounce
    const hitShake = ent.hitShake || 0;
    const shakeX = hitShake > 0 ? Math.sin(gameTime * 0.08) * hitShake * 5 : 0;
    const shakeY = hitShake > 0 ? Math.cos(gameTime * 0.08) * hitShake * 3 : 0;

    const swayOffset = ent.swayOffset || 0;
    const isMoving = ent.state === 'wander' || ent.state === 'chase';
    const bounceFreq = isMoving ? 0.012 : 0.004;
    const bounceAmp = isMoving ? 3.5 : 1.5;
    const bounce = Math.abs(Math.sin(gameTime * bounceFreq + swayOffset)) * bounceAmp;

    ctx.translate(shakeX, shakeY - bounce);

    // 4. Facing Direction (Flip horizontal)
    if (ent.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // 5. Visual Emoji / Sprite Rendering
    ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ent.styleEmoji || '👾', 0, 0);

    // Reset horizontal scale for UI overlays (nametag & health bar shouldn't be mirrored)
    if (ent.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // 6. Floating Nametag and Behavior Tag
    const name = ent.name || ent.type;
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    const textMetrics = ctx.measureText(name);
    const tagW = Math.max(textMetrics.width + 16, 44);
    const tagH = 15;
    const tagY = -height * 0.65 - 8;

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.beginPath();
    ctx.roundRect(-tagW / 2, tagY, tagW, tagH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Behavior status dot
    const dotColor =
      ent.behavior === 'hostile'
        ? '#ef4444'
        : ent.behavior === 'neutral'
        ? '#f59e0b'
        : '#22c55e';
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(-tagW / 2 + 7, tagY + tagH / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Nametag Text
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, -tagW / 2 + 13, tagY + tagH / 2 + 0.5);

    // 7. Health Bar (if damaged or highlighted)
    const isDamaged = ent.health < ent.maxHealth;
    if (isDamaged || isHighlighted) {
      const barW = Math.max(tagW, 36);
      const barH = 3.5;
      const barY = tagY - 6;
      const hpRatio = Math.max(0, Math.min(1, ent.health / ent.maxHealth));

      // Bar background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(-barW / 2, barY, barW, barH, 2);
      ctx.fill();

      // HP fill
      let hpColor = '#22c55e';
      if (hpRatio < 0.3) hpColor = '#ef4444';
      else if (hpRatio < 0.6) hpColor = '#f59e0b';

      ctx.fillStyle = hpColor;
      ctx.beginPath();
      ctx.roundRect(-barW / 2, barY, barW * hpRatio, barH, 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
