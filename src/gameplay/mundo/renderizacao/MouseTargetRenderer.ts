import { TILE_SIZE } from '../../../core/configuracao/constants';
import { Player } from '../../../core/configuracao/types';
import { MouseTarget } from '../../interacao/MouseInteractionSystem';

export class MouseTargetRenderer {
  /**
   * Render in-world raycast, range boundary, tile reticle, and entity highlights.
   * Call this while camera transformation is active.
   */
  renderInWorld(
    ctx: CanvasRenderingContext2D,
    player: Player,
    target: MouseTarget,
    gameTime: number
  ) {
    const { inRange, maxRange, tileX, tileY, entity, worldX, worldY, raycastEnd } = target;

    // 1. Faint Player Interaction Range Boundary Ring (very subtle guidance)
    ctx.save();
    ctx.strokeStyle = inRange ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, maxRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Raycast Line from Player to Target or Range Limit
    ctx.save();
    if (inRange) {
      // Reached target within range
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(worldX, worldY);
      ctx.stroke();

      // Target point dot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(worldX, worldY, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ray stops at max interaction range
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(raycastEnd.x, raycastEnd.y);
      ctx.stroke();

      // Perpendicular limit barrier at raycastEnd
      const angle = Math.atan2(worldY - player.y, worldX - player.x);
      const barLen = 6;
      const perpX = -Math.sin(angle) * barLen;
      const perpY = Math.cos(angle) * barLen;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(raycastEnd.x - perpX, raycastEnd.y - perpY);
      ctx.lineTo(raycastEnd.x + perpX, raycastEnd.y + perpY);
      ctx.stroke();

      // Very faint trail from limit to cursor position
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(raycastEnd.x, raycastEnd.y);
      ctx.lineTo(worldX, worldY);
      ctx.stroke();

      // Out-of-range small 'x' at cursor
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(worldX - 3.5, worldY - 3.5);
      ctx.lineTo(worldX + 3.5, worldY + 3.5);
      ctx.moveTo(worldX + 3.5, worldY - 3.5);
      ctx.lineTo(worldX - 3.5, worldY + 3.5);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Tile Highlight / Reticle
    const tx = tileX * TILE_SIZE;
    const ty = tileY * TILE_SIZE;

    ctx.save();
    if (inRange) {
      // Subtle Sky-blue corner brackets
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

      const bLen = 8;
      ctx.beginPath();
      // Top-Left
      ctx.moveTo(tx, ty + bLen);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx + bLen, ty);
      // Top-Right
      ctx.moveTo(tx + TILE_SIZE - bLen, ty);
      ctx.lineTo(tx + TILE_SIZE, ty);
      ctx.lineTo(tx + TILE_SIZE, ty + bLen);
      // Bottom-Right
      ctx.moveTo(tx + TILE_SIZE, ty + TILE_SIZE - bLen);
      ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
      ctx.lineTo(tx + TILE_SIZE - bLen, ty + TILE_SIZE);
      // Bottom-Left
      ctx.moveTo(tx + bLen, ty + TILE_SIZE);
      ctx.lineTo(tx, ty + TILE_SIZE);
      ctx.lineTo(tx, ty + TILE_SIZE - bLen);
      ctx.stroke();
    } else {
      // Muted red dashed box indicating out of reach
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
    }
    ctx.restore();

    // 4. Entity Highlight
    if (entity) {
      ctx.save();
      const baseY =
        entity.type.startsWith('tree') && !entity.isHarvested
          ? entity.y + 18
          : entity.y + 6;

      if (inRange) {
        if (!entity.isHarvested) {
          // Pulsing focus ring
          const pulse = 0.6 + 0.4 * Math.sin(gameTime * 0.008);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.ellipse(
            entity.x,
            baseY,
            entity.width * 0.44,
            entity.height * 0.22,
            0,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      } else {
        // Red dashed ring indicating entity cannot be interacted with from here
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(
          entity.x,
          baseY,
          entity.width * 0.44,
          entity.height * 0.22,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /**
   * Render screen-space prompt badge near cursor for instant feedback.
   * Call this after restoring camera transform (screen coordinates).
   */
  renderScreenBadge(
    ctx: CanvasRenderingContext2D,
    target: MouseTarget,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const { screenX, screenY, inRange, primaryAction, secondaryAction, distance, maxRange, entity } = target;

    // Only render badge if cursor is within canvas bounds
    if (screenX < 0 || screenX > canvasWidth || screenY < 0 || screenY > canvasHeight) {
      return;
    }

    // Offset badge slightly down and to the right of cursor
    let bx = screenX + 16;
    let by = screenY + 16;

    // Prevent badge overflowing right/bottom canvas edges
    if (bx + 180 > canvasWidth) {
      bx = screenX - 190;
    }
    if (by + 60 > canvasHeight) {
      by = screenY - 60;
    }

    ctx.save();

    if (inRange) {
      if (primaryAction || secondaryAction) {
        const title = primaryAction ? primaryAction.label : '';
        const sub = primaryAction?.subLabel || (secondaryAction ? secondaryAction.label : '');

        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        const titleMetrics = ctx.measureText(title);
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        const subMetrics = ctx.measureText(sub);

        const badgeW = Math.max(120, Math.max(titleMetrics.width, subMetrics.width) + 24);
        const badgeH = sub ? 36 : 24;

        // Card background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 6);
        ctx.fill();

        // Accent left border
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(bx, by, 3, badgeH, [6, 0, 0, 6]);
        ctx.fill();

        // Border outline
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 6);
        ctx.stroke();

        // Text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, bx + 10, by + (sub ? 12 : badgeH / 2));

        if (sub) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px system-ui, -apple-system, sans-serif';
          ctx.fillText(sub, bx + 10, by + 25);
        }
      }
    } else {
      // Render discreet "Fora de Alcance" warning badge
      if (entity) {
        const badgeW = 126;
        const badgeH = 22;

        ctx.fillStyle = 'rgba(24, 24, 27, 0.85)';
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 5);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(bx, by, 3, badgeH, [5, 0, 0, 5]);
        ctx.fill();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 5);
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✕ Fora de Alcance (${Math.round(distance)}px)`, bx + 8, by + 11);
      }
    }

    ctx.restore();
  }
}
