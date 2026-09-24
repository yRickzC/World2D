import { TILE_SIZE } from '../../../core/configuracao/constants';
import { BlockDatabase } from '../../blocos/BlockDatabase';
import {
  ColorTextureComponent,
  FluidComponent,
  SideTextureComponent,
  TopTextureComponent,
} from '../../blocos/componentes';
import { ChunkManager } from '../chunks/ChunkManager';
import { BlockTextureDefinition } from '../../BlockSystem/types';

export class TileRenderer {
  /**
   * Renders a single block definition's visual appearance directly onto a 2D canvas context.
   * This is the real game engine visual renderer for blocks, supporting:
   * - Optional background color (transparent by default if null/undefined/'transparent')
   * - Secondary color patterns (checker, speckle, brick, wave, blades) when background is enabled
   * - Centered Emoji / Icon scaled precisely according to tile proportion size (0.1 to 1.0)
   * - Image and SVG textures
   * - Component-based fallbacks (TopTextureComponent, ColorTextureComponent)
   */
  static renderBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    block: any,
    time: number = 0
  ): void {
    if (!block) return;

    const tex: BlockTextureDefinition | undefined = block.texture;

    if (tex) {
      const bg = tex.background?.color ?? tex.backgroundColor;
      const hasBg = !!(bg && bg !== 'transparent' && bg !== 'none' && bg !== 'null');

      // 1. Draw solid background surface ONLY if explicitly configured
      if (hasBg) {
        ctx.fillStyle = bg as string;
        ctx.fillRect(x, y, size, size);

        // Pattern overlay on background
        if (tex.pattern && tex.pattern !== 'solid' && tex.secondaryColor) {
          const sec = tex.secondaryColor;
          if (tex.pattern === 'checker') {
            ctx.fillStyle = sec;
            const half = size / 2;
            ctx.fillRect(x, y, half, half);
            ctx.fillRect(x + half, y + half, half, half);
          } else if (tex.pattern === 'speckle') {
            ctx.fillStyle = sec;
            const dot = Math.max(1, Math.round(size * 0.05));
            ctx.fillRect(x + size * 0.2, y + size * 0.25, dot, dot);
            ctx.fillRect(x + size * 0.65, y + size * 0.3, dot, dot);
            ctx.fillRect(x + size * 0.35, y + size * 0.7, dot, dot);
            ctx.fillRect(x + size * 0.8, y + size * 0.65, dot, dot);
          } else if (tex.pattern === 'brick') {
            ctx.strokeStyle = sec;
            ctx.lineWidth = 1;
            const h3 = size / 3;
            ctx.beginPath();
            ctx.moveTo(x, y + h3);
            ctx.lineTo(x + size, y + h3);
            ctx.moveTo(x, y + h3 * 2);
            ctx.lineTo(x + size, y + h3 * 2);
            ctx.stroke();
          }
        }
      }

      // 2. Draw Emoji / Icon (centered in tile, scaled by proportion)
      if (tex.type === 'emoji' || (tex.value && tex.type !== 'image' && tex.type !== 'svg')) {
        const emojiVal = tex.value || '🧱';
        const sizeRatio = Math.max(0.1, Math.min(1.0, tex.size ?? 1.0));
        const fontSize = Math.round(size * sizeRatio);
        ctx.save();
        ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emojiVal, x + size / 2, y + size / 2 + 1);
        ctx.restore();
        return;
      }

      // 3. Draw Image if available
      if (tex.type === 'image' && tex.imageSrc) {
        const img = new Image();
        img.src = tex.imageSrc;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, x, y, size, size);
        }
        return;
      }

      // 4. Color type without emoji (if not already drawn via background)
      if (tex.type === 'color' && !hasBg && (tex as any).primaryColor) {
        ctx.fillStyle = (tex as any).primaryColor;
        ctx.fillRect(x, y, size, size);
      }
      return;
    }

    // Component-based rendering fallbacks
    const topComp = block.getComponent ? block.getComponent(TopTextureComponent) : null;
    if (topComp) {
      topComp.render(ctx, x, y, size, time);
      return;
    }

    const colorComp = block.getComponent ? block.getComponent(ColorTextureComponent) : null;
    const fluidComp = block.getComponent ? block.getComponent(FluidComponent) : null;

    if (!colorComp) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y, size, size);
      return;
    }

    switch (colorComp.pattern) {
      case 'wave': {
        ctx.fillStyle = colorComp.primaryColor;
        ctx.fillRect(x, y, size, size);
        if (fluidComp?.drownHazard) {
          ctx.fillStyle = colorComp.secondaryColor;
          const rip = Math.floor(time * 0.001) % 5;
          if (rip === 0) {
            ctx.fillRect(x + 8, y + 18, 14, 2);
          }
        } else {
          ctx.fillStyle = colorComp.secondaryColor;
          const waveY = y + 12 + Math.sin(time * 0.003) * 3;
          ctx.fillRect(x + 6, waveY, 18, 2);
        }
        break;
      }
      case 'speckle': {
        ctx.fillStyle = colorComp.primaryColor;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = colorComp.secondaryColor;
        ctx.fillRect(x + 10, y + 12, 2, 2);
        ctx.fillRect(x + 28, y + 32, 2, 2);
        break;
      }
      case 'blades': {
        ctx.fillStyle = colorComp.primaryColor;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x + 14, y + 20, 2, 4);
        ctx.fillRect(x + 17, y + 18, 2, 6);
        break;
      }
      default: {
        ctx.fillStyle = colorComp.primaryColor;
        ctx.fillRect(x, y, size, size);
        break;
      }
    }
  }

  /**
   * Renders ground layers (natural terrain, dug pit holes, and flush placed floor blocks).
   * Transparent blocks correctly render over the underlying terrain (e.g. Grass + Emoji Block).
   */
  renderTiles(
    ctx: CanvasRenderingContext2D,
    chunkManager: ChunkManager,
    minTx: number,
    maxTx: number,
    minTy: number,
    maxTy: number,
    time: number
  ) {
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const x = tx * TILE_SIZE;
        const y = ty * TILE_SIZE;
        const layer = chunkManager.getTileLayer(tx, ty);

        // 1. Excavated / dug pit hole without floor block
        if (layer.isDug && !layer.groundBlock) {
          const dugBlock = BlockDatabase.getBlock('dug_dirt');
          TileRenderer.renderBlock(ctx, x, y, TILE_SIZE, dugBlock, time);
          continue;
        }

        // 2. Base ground terrain (Grass, Dirt, Stone, etc.)
        const baseGroundId: string = layer.baseGround || 'grass';
        if (baseGroundId && baseGroundId !== 'void') {
          const baseBlock = BlockDatabase.getBlock(baseGroundId);
          TileRenderer.renderBlock(ctx, x, y, TILE_SIZE, baseBlock, time);
        }

        // 3. Placed block on top of base terrain (or flush floor block in trench)
        const currentTile: string = layer.groundBlock || chunkManager.getTile(tx, ty);
        if (currentTile && currentTile !== baseGroundId && currentTile !== 'void') {
          const placedBlock = BlockDatabase.getBlock(currentTile);
          // Renders placed block on top; transparent blocks let base ground show through
          TileRenderer.renderBlock(ctx, x, y, TILE_SIZE, placedBlock, time);

          if (layer.groundBlock) {
            ctx.strokeStyle = 'rgba(30, 15, 8, 0.45)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          }
        }
      }
    }
  }

  /**
   * Renders vertically stacked / elevated block structures (walls and top surface)
   * called in Y-sorted order during scene rendering.
   */
  renderElevatedLayers(
    ctx: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    upperLayers: string[],
    time: number
  ) {
    if (!upperLayers || upperLayers.length === 0) return;

    const elevation = upperLayers.length;
    const topBlockId = upperLayers[elevation - 1];
    const blockDef = BlockDatabase.getBlock(topBlockId);

    const sideComp = blockDef.getComponent(SideTextureComponent);
    const topComp = blockDef.getComponent(TopTextureComponent);

    const x = tx * TILE_SIZE;
    const groundBottomY = (ty + 1) * TILE_SIZE;
    const baseWallHeight = sideComp?.defaultWallHeight ?? 14;
    const totalWallHeight = elevation * baseWallHeight;
    const topSurfaceY = ty * TILE_SIZE - totalWallHeight;

    ctx.save();

    // 1. Soft contact shadow on the ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + TILE_SIZE / 2, groundBottomY + 2, TILE_SIZE / 2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Render lateral wall face
    if (sideComp) {
      sideComp.render(ctx, x, groundBottomY, TILE_SIZE, totalWallHeight, elevation, time);
    } else {
      // Fallback lateral wall using blockDef.texture secondaryColor if present
      ctx.fillStyle = blockDef.texture?.secondaryColor || '#78350f';
      ctx.fillRect(x, groundBottomY - totalWallHeight, TILE_SIZE, totalWallHeight);
    }

    // 3. Render upper surface using standard block rendering
    TileRenderer.renderBlock(ctx, x, topSurfaceY, TILE_SIZE, blockDef, time);

    // 4. Subtle vertical elevation badge for stacked blocks (e.g. Level 2, 3+)
    if (elevation > 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(x + TILE_SIZE - 20, topSurfaceY + 4, 16, 13, 3);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${elevation}`, x + TILE_SIZE - 12, topSurfaceY + 11);
    }

    ctx.restore();
  }
}
