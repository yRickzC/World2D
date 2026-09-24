import { WorldEntity } from '../../../core/configuracao/types';

export class FoliageRenderer {
  renderEntity(
    ctx: CanvasRenderingContext2D,
    ent: WorldEntity,
    time: number,
    wind: number,
    isHighlighted: boolean = false
  ) {
    const sway = Math.sin(time * 0.002 + ent.swayOffset) * 2 * (1 + wind * 0.5);
    const shakeX = ent.hitShake ? Math.sin(time * 0.05) * ent.hitShake * 6 : 0;

    ctx.save();
    ctx.translate(ent.x + shakeX, ent.y);

    // Subtle highlight indicator for nearest interactable
    if (isHighlighted && !ent.isHarvested) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.008);
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.globalAlpha = 0.5 + pulse * 0.4;
      ctx.beginPath();
      const baseY = ent.type.startsWith('tree') ? 22 : 6;
      ctx.ellipse(0, baseY, ent.width * 0.42, ent.height * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Harvested State
    if (ent.isHarvested) {
      if (ent.type === 'tree_oak' || ent.type === 'tree_pine') {
        // Tree Stump
        ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 20, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stump base
        ctx.fillStyle = ent.type === 'tree_pine' ? '#5c2707' : '#78350f';
        ctx.beginPath();
        ctx.roundRect(-8, 10, 16, 12, 3);
        ctx.fill();

        // Stump cut top face with rings
        ctx.fillStyle = '#a16207';
        ctx.beginPath();
        ctx.ellipse(0, 10, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 10, 4, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ent.type === 'bush') {
        // Trimmed bush twigs
        ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#4d7c0f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.lineTo(-6, -2);
        ctx.moveTo(4, 4);
        ctx.lineTo(6, -2);
        ctx.stroke();
      } else if (ent.type === 'tall_grass') {
        // Cut grass blade stubs
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, 6);
        ctx.lineTo(-4, 2);
        ctx.moveTo(2, 6);
        ctx.lineTo(3, 3);
        ctx.stroke();
      } else if (ent.type === 'flower') {
        // Small stem bud regrowing
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(0, 2);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    switch (ent.type) {
      case 'tree_oak': {
        // Ground Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 24, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(-7, 2, 14, 26, 4);
        ctx.fill();

        // Trunk bark detail
        ctx.fillStyle = '#5c2707';
        ctx.fillRect(-4, 8, 3, 14);

        // Foliage Crown (Swaying with wind)
        ctx.translate(sway, 0);

        // Lower foliage shadow
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, -10, 28, 0, Math.PI * 2);
        ctx.fill();

        // Middle foliage
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(-10, -18, 22, 0, Math.PI * 2);
        ctx.arc(10, -18, 22, 0, Math.PI * 2);
        ctx.arc(0, -26, 24, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(-6, -28, 14, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'tree_pine': {
        // Ground Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 24, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#713f12';
        ctx.fillRect(-5, 12, 10, 16);

        // Pine Tiers (Triangular evergreen)
        ctx.translate(sway * 0.8, 0);

        // Tier 1 (bottom)
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-24, 16);
        ctx.lineTo(24, 16);
        ctx.closePath();
        ctx.fill();

        // Tier 2 (middle)
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(-20, -2);
        ctx.lineTo(20, -2);
        ctx.closePath();
        ctx.fill();

        // Tier 3 (top)
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(-14, -18);
        ctx.lineTo(14, -18);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'bush': {
        // Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bush foliage clusters
        ctx.translate(sway * 0.5, 0);
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(-8, 0, 12, 0, Math.PI * 2);
        ctx.arc(8, 0, 12, 0, Math.PI * 2);
        ctx.arc(0, -6, 13, 0, Math.PI * 2);
        ctx.fill();

        // Bush highlight
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(-4, -6, 7, 0, Math.PI * 2);
        ctx.arc(4, -4, 6, 0, Math.PI * 2);
        ctx.fill();

        // Berry dots
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(6, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(2, 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'tall_grass': {
        ctx.translate(sway, 0);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Blade 1
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.quadraticCurveTo(-10, 0, -12 + sway, -8);
        ctx.stroke();

        // Blade 2 (center)
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.quadraticCurveTo(2, -2, 1 + sway * 1.2, -12);
        ctx.stroke();

        // Blade 3 (right)
        ctx.strokeStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(6, 8);
        ctx.quadraticCurveTo(8, 2, 11 + sway, -6);
        ctx.stroke();
        break;
      }

      case 'flower': {
        const colors = ['#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];
        const petalColor = colors[ent.variant % colors.length];

        // Stem
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(sway * 0.4, -2);
        ctx.stroke();

        // Petals
        ctx.fillStyle = petalColor;
        ctx.beginPath();
        ctx.arc(sway * 0.4, -3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Center pistil
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sway * 0.4, -3, 1.8, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}
