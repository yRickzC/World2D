import { BlockComponent } from './BlockComponent';

export type TopTexturePattern =
  | 'plain'
  | 'checker'
  | 'speckle'
  | 'wave'
  | 'blades'
  | 'wood_planks'
  | 'dirt_compact'
  | 'dug_pit'
  | 'stone_cobble';

export interface TopTextureConfig {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  pattern?: TopTexturePattern;
  customRender?: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    time?: number
  ) => void;
}

/**
 * TopTextureComponent:
 * Visual component that governs the rendering of the block's top surface / ground floor face.
 * Supports swappable procedural, color, and pattern representations.
 */
export class TopTextureComponent extends BlockComponent {
  static readonly type = 'top_texture';
  readonly type = 'top_texture';

  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor?: string;
  readonly pattern: TopTexturePattern;
  readonly customRender?: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    time?: number
  ) => void;

  constructor(config: TopTextureConfig) {
    super();
    this.primaryColor = config.primaryColor;
    this.secondaryColor = config.secondaryColor ?? config.primaryColor;
    this.accentColor = config.accentColor;
    this.pattern = config.pattern ?? 'plain';
    this.customRender = config.customRender;
  }

  /**
   * Renders the top surface face onto the 2D canvas context.
   */
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    time: number = 0
  ): void {
    if (this.customRender) {
      this.customRender(ctx, x, y, size, time);
      return;
    }

    ctx.save();

    switch (this.pattern) {
      case 'wood_planks': {
        // Wooden planks / parquet surface (e.g. wood plank placed as ground floor or on top of block)
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        // Individual plank slats & grain
        const plankH = size / 4;
        ctx.fillStyle = this.secondaryColor;
        for (let i = 0; i < 4; i++) {
          const py = y + i * plankH;
          // Plank joint divider
          ctx.fillRect(x, py, size, 1);
          // Subtle wood grain streaks
          ctx.fillStyle = this.accentColor || 'rgba(0, 0, 0, 0.12)';
          ctx.fillRect(x + 4, py + 3, size - 12, 1);
          ctx.fillRect(x + 10, py + plankH - 3, size - 20, 1);
        }

        // Outer border edge bevel
        ctx.strokeStyle = this.accentColor || 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        break;
      }

      case 'dug_pit': {
        // Excavated earthen pit / chão cavado
        // Outer dark recessed boundary
        ctx.fillStyle = this.primaryColor; // e.g. #3d2314
        ctx.fillRect(x, y, size, size);

        // Depth drop shadow on top and left inner edges
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, size, 4);
        ctx.fillRect(x, y, 4, size);

        // Rough excavated clods and stones
        ctx.fillStyle = this.secondaryColor; // e.g. #5a3821
        ctx.fillRect(x + 6, y + 8, size - 12, size - 14);

        ctx.fillStyle = this.accentColor || '#29160a';
        ctx.fillRect(x + 8, y + 10, 3, 3);
        ctx.fillRect(x + 18, y + 14, 4, 3);
        ctx.fillRect(x + 12, y + 22, 3, 3);
        ctx.fillRect(x + 24, y + 26, 4, 4);

        // Highlight gravel
        ctx.fillStyle = '#785038';
        ctx.fillRect(x + 9, y + 18, 2, 2);
        ctx.fillRect(x + 22, y + 10, 2, 2);
        break;
      }

      case 'stone_cobble': {
        // Stone cobblestone / rock surface
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        // Cobblestone tiles
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 2, y + 2, size / 2 - 3, size / 2 - 3);
        ctx.fillRect(x + size / 2 + 1, y + 2, size / 2 - 3, size / 2 - 3);
        ctx.fillRect(x + 2, y + size / 2 + 1, size / 2 - 3, size / 2 - 3);
        ctx.fillRect(x + size / 2 + 1, y + size / 2 + 1, size / 2 - 3, size / 2 - 3);

        ctx.strokeStyle = this.accentColor || '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        break;
      }

      case 'wave': {
        // Water waves
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        const waveOffset = Math.sin(time * 0.003 + x) * 2;
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 6 + waveOffset, y + 14, 18, 2);
        break;
      }

      case 'blades': {
        // Grass surface
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 10, y + 12, 2, 5);
        ctx.fillRect(x + 13, y + 10, 2, 7);
        ctx.fillRect(x + 22, y + 20, 2, 5);
        break;
      }

      case 'speckle': {
        // Sand surface
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 8, y + 10, 2, 2);
        ctx.fillRect(x + 22, y + 24, 2, 2);
        break;
      }

      case 'checker': {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x, y, size / 2, size / 2);
        ctx.fillRect(x + size / 2, y + size / 2, size / 2, size / 2);
        break;
      }

      case 'dirt_compact': {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
        break;
      }

      case 'plain':
      default: {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);
        break;
      }
    }

    ctx.restore();
  }
}
