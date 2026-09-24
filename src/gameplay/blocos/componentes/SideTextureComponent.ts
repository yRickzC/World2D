import { BlockComponent } from './BlockComponent';

export type SideTexturePattern =
  | 'plain'
  | 'wood_planks'
  | 'stone_brick'
  | 'dirt_depth'
  | 'shaded_bevel';

export interface SideTextureConfig {
  primaryColor: string;
  secondaryColor?: string;
  shadowColor?: string;
  accentColor?: string;
  pattern?: SideTexturePattern;
  defaultWallHeight?: number;
  customRender?: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    wallHeight: number,
    elevation?: number,
    time?: number
  ) => void;
}

/**
 * SideTextureComponent:
 * Visual component that governs the rendering of the block's lateral / side / front wall faces.
 * Enables 2.5D visual depth, vertical construction stacking, and beveled block faces.
 */
export class SideTextureComponent extends BlockComponent {
  static readonly type = 'side_texture';
  readonly type = 'side_texture';

  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly shadowColor: string;
  readonly accentColor?: string;
  readonly pattern: SideTexturePattern;
  readonly defaultWallHeight: number;
  readonly customRender?: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    wallHeight: number,
    elevation?: number,
    time?: number
  ) => void;

  constructor(config: SideTextureConfig) {
    super();
    this.primaryColor = config.primaryColor;
    this.secondaryColor = config.secondaryColor ?? config.primaryColor;
    this.shadowColor = config.shadowColor ?? 'rgba(0, 0, 0, 0.35)';
    this.accentColor = config.accentColor;
    this.pattern = config.pattern ?? 'plain';
    this.defaultWallHeight = config.defaultWallHeight ?? 14;
    this.customRender = config.customRender;
  }

  /**
   * Renders the lateral wall face for an elevated or stacked block.
   * @param ctx Canvas 2D context
   * @param x Top-left X of the block footprint
   * @param y Front bottom Y where the wall touches the ground
   * @param width Width of the block
   * @param wallHeight Total height of the wall face (scaled by elevation)
   * @param elevation Number of stacked block layers (1, 2, 3...)
   */
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    wallHeight: number,
    elevation: number = 1,
    time: number = 0
  ): void {
    if (this.customRender) {
      this.customRender(ctx, x, y, width, width, wallHeight, elevation, time);
      return;
    }

    ctx.save();

    const wallTopY = y - wallHeight;

    switch (this.pattern) {
      case 'wood_planks': {
        // Wooden wall with horizontal courses per layer
        ctx.fillStyle = this.primaryColor; // e.g. #92400e (darker wood than top surface)
        ctx.fillRect(x, wallTopY, width, wallHeight);

        // Render distinct horizontal courses for each vertically stacked layer
        const courseHeight = wallHeight / Math.max(1, elevation);
        for (let lvl = 0; lvl < elevation; lvl++) {
          const courseY = wallTopY + lvl * courseHeight;

          // Horizontal block tier separator
          ctx.fillStyle = this.shadowColor;
          ctx.fillRect(x, courseY + courseHeight - 2, width, 2);

          // Vertical plank joints
          ctx.fillStyle = this.secondaryColor;
          const midX = (lvl % 2 === 0) ? x + width * 0.45 : x + width * 0.7;
          ctx.fillRect(midX, courseY, 2, courseHeight);

          // Wood grain horizontal highlights
          ctx.fillStyle = this.accentColor || 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(x + 2, courseY + 3, width - 4, 1);
        }

        // Left/right subtle edge bevels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x, wallTopY, 2, wallHeight);
        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(x + width - 2, wallTopY, 2, wallHeight);

        // Ground contact shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x, y - 2, width, 4);
        break;
      }

      case 'stone_brick': {
        // Stone brick lateral wall
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, wallTopY, width, wallHeight);

        const courseHeight = wallHeight / Math.max(1, elevation);
        for (let lvl = 0; lvl < elevation; lvl++) {
          const courseY = wallTopY + lvl * courseHeight;

          // Joint line between courses
          ctx.fillStyle = this.shadowColor;
          ctx.fillRect(x, courseY + courseHeight - 1, width, 1);

          // Brick seams
          ctx.fillStyle = '#1e293b';
          const seamX = (lvl % 2 === 0) ? x + width * 0.5 : x + width * 0.3;
          ctx.fillRect(seamX, courseY, 1.5, courseHeight);
        }

        // Drop shadow at the bottom
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y - 1, width, 3);
        break;
      }

      case 'dirt_depth': {
        // Trench / excavated depth wall
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, wallTopY, width, wallHeight);

        // Clods & depth gradient
        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(x, wallTopY, width, 3);
        ctx.fillRect(x + 4, wallTopY + 4, 3, 3);
        ctx.fillRect(x + 18, wallTopY + 6, 4, 2);
        break;
      }

      case 'shaded_bevel':
      case 'plain':
      default: {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, wallTopY, width, wallHeight);

        // Ambient occlusion shadow at bottom
        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(x, y - 2, width, 2);
        break;
      }
    }

    ctx.restore();
  }
}
