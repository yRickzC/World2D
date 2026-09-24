import { TILE_SIZE } from '../../../core/configuracao/constants';
import { BlockDatabase } from '../../blocos/BlockDatabase';
import {
  ColorTextureComponent,
  FluidComponent,
  SideTextureComponent,
  TopTextureComponent,
} from '../../blocos/componentes';
import { ChunkManager } from '../chunks/ChunkManager';

export class TileRenderer {
  /**
   * Renders the bottom ground layer (natural terrain, dug pit holes, or flush floor blocks).
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

        // 1. If excavated / dug pit and NO floor block inserted: render dug dirt hole
        if (layer.isDug && !layer.groundBlock) {
          const dugBlock = BlockDatabase.getBlock('dug_dirt');
          const topComp = dugBlock.getComponent(TopTextureComponent);
          if (topComp) {
            topComp.render(ctx, x, y, TILE_SIZE, time);
          } else {
            ctx.fillStyle = '#2b1810';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          }
          continue;
        }

        // 2. If a solid floor block is inserted into the dug hole (flush with ground level)
        if (layer.groundBlock) {
          const floorBlock = BlockDatabase.getBlock(layer.groundBlock);
          const topComp = floorBlock.getComponent(TopTextureComponent);
          if (topComp) {
            topComp.render(ctx, x, y, TILE_SIZE, time);
          } else {
            const colorComp = floorBlock.getComponent(ColorTextureComponent);
            ctx.fillStyle = colorComp?.primaryColor || '#b45309';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          }

          // Subtle recessed pit border frame showing it was placed in an excavated trench
          ctx.strokeStyle = 'rgba(30, 15, 8, 0.45)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          continue;
        }

        // 3. Standard base ground terrain
        const tile = layer.baseGround || chunkManager.getTile(tx, ty);
        const block = BlockDatabase.getBlock(tile);
        const topComp = block.getComponent(TopTextureComponent);

        if (topComp) {
          topComp.render(ctx, x, y, TILE_SIZE, time);
          continue;
        }

        // Fallback to ColorTextureComponent / legacy rendering
        const colorComp = block.getComponent(ColorTextureComponent);
        const fluidComp = block.getComponent(FluidComponent);

        if (!colorComp) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          continue;
        }

        const isAlt = (tx + ty) % 2 === 0;

        switch (colorComp.pattern) {
          case 'wave': {
            ctx.fillStyle = colorComp.primaryColor;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            if (fluidComp?.drownHazard) {
              ctx.fillStyle = colorComp.secondaryColor;
              const rip = (tx * 13 + ty * 29 + Math.floor(time * 0.001)) % 5;
              if (rip === 0) {
                ctx.fillRect(x + 8, y + 18, 14, 2);
              }
            } else {
              ctx.fillStyle = colorComp.secondaryColor;
              const waveY = y + 12 + Math.sin(time * 0.003 + tx) * 3;
              ctx.fillRect(x + 6, waveY, 18, 2);
            }
            break;
          }

          case 'speckle': {
            ctx.fillStyle = colorComp.primaryColor;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = colorComp.secondaryColor;
            if ((tx + ty) % 3 === 0) {
              ctx.fillRect(x + 10, y + 12, 2, 2);
              ctx.fillRect(x + 28, y + 32, 2, 2);
            }
            break;
          }

          case 'blades': {
            ctx.fillStyle = isAlt ? colorComp.primaryColor : colorComp.secondaryColor;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#15803d';
            if ((tx * 7 + ty * 11) % 4 === 0) {
              ctx.fillRect(x + 14, y + 20, 2, 4);
              ctx.fillRect(x + 17, y + 18, 2, 6);
            }
            break;
          }

          default: {
            ctx.fillStyle = colorComp.primaryColor;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            break;
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

    // 2. Render lateral wall face (using SideTextureComponent)
    if (sideComp) {
      sideComp.render(ctx, x, groundBottomY, TILE_SIZE, totalWallHeight, elevation, time);
    } else {
      // Fallback lateral wall
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x, groundBottomY - totalWallHeight, TILE_SIZE, totalWallHeight);
    }

    // 3. Render upper surface (using TopTextureComponent)
    if (topComp) {
      topComp.render(ctx, x, topSurfaceY, TILE_SIZE, time);
    } else {
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x, topSurfaceY, TILE_SIZE, TILE_SIZE);
    }

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
