import { BlockTextureDefinition } from '../../../gameplay/BlockSystem/types';
import { TileRenderer } from '../../../gameplay/mundo/renderizacao/TileRenderer';

export interface BlockRenderOptions {
  isSelected?: boolean;
  isHovered?: boolean;
  damageProgress?: number;
  hitFlash?: boolean;
  pulseEffect?: boolean;
}

/**
 * Compatibility adapter for block rendering.
 * Delegates 100% to the real engine TileRenderer.
 * No 2.5D elevation, no fake shadows, no artificial side walls.
 */
export class BlockVisualRenderer {
  static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    texture?: BlockTextureDefinition,
    _options: BlockRenderOptions = {}
  ): void {
    TileRenderer.renderBlock(ctx, x, y, size, { texture });
  }
}
