import { DroppedItem } from '../../../core/configuracao/types';
import { getItemDef } from '../../inventario/items/ItemDefinitions';

export class DroppedItemRenderer {
  render(ctx: CanvasRenderingContext2D, item: DroppedItem, gameTime: number, playerDist?: number) {
    const def = getItemDef(item.type);
    const bob = Math.sin(gameTime * 0.006 + item.bobOffset) * 3.5;
    const shadowScale = Math.max(0.6, 1 - Math.abs(bob) / 10);

    ctx.save();
    ctx.translate(item.x, item.y);

    // 1. Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 8 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Subtle Glow Ring
    const pulse = 0.5 + Math.sin(gameTime * 0.005 + item.bobOffset) * 0.3;
    ctx.fillStyle = `${def.accentColor}${Math.floor(pulse * 40).toString(16).padStart(2, '0')}`;
    ctx.beginPath();
    ctx.arc(0, bob - 2, 11, 0, Math.PI * 2);
    ctx.fill();

    // 3. Item Emoji / Icon
    ctx.font = '16px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow on item
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillText(def.iconEmoji, 0, bob - 2);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 4. Stack Count Badge (if count > 1)
    if (item.count > 1) {
      const text = `${item.count}`;
      ctx.font = 'bold 9px monospace';
      const m = ctx.measureText(text);
      const bgW = m.width + 6;
      const bgH = 11;
      const bx = 4;
      const by = bob + 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(bx - bgW / 2, by - bgH / 2, bgW, bgH, 4);
      ctx.fill();

      ctx.strokeStyle = `${def.accentColor}cc`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bx, by);
    }

    // 5. Name tag if player is close
    if (playerDist !== undefined && playerDist < 48) {
      const tagText = `${def.name} (${item.count})`;
      ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
      const tm = ctx.measureText(tagText);
      const tw = tm.width + 10;
      const ty = bob - 18;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-tw / 2, ty - 7, tw, 14, 5);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, 0, ty);
    }

    ctx.restore();
  }
}
