import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export type SideTexturePattern =
  | 'plain'
  | 'wood_planks'
  | 'stone_brick'
  | 'dirt_depth'
  | 'shaded_bevel'
  | 'custom';

export interface SideTextureConfig {
  id?: string;
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

export class SideTextureComponent extends BaseBlockComponent {
  static readonly type = 'SideTextureComponent';
  readonly type = 'SideTextureComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'SideTextureComponent',
    name: 'SideTextureComponent',
    version: '1.0.0',
    description: 'Renderiza as paredes verticais laterais do bloco com profundidade e perspectiva.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      primaryColor: {
        label: 'Cor da Parede',
        type: 'string',
        required: true,
        default: '#5c3a21',
        description: 'Cor principal da lateral.',
        editor: { widget: 'color' },
      },
      secondaryColor: {
        label: 'Cor Secundária da Parede',
        type: 'string',
        required: false,
        description: 'Cor para detalhes de tábuas, juntas ou fendas.',
        editor: { widget: 'color' },
      },
      shadowColor: {
        label: 'Cor da Sombra',
        type: 'string',
        required: false,
        default: 'rgba(0, 0, 0, 0.35)',
        description: 'Sombra na base e junções inferiores.',
        editor: { widget: 'color' },
      },
      defaultWallHeight: {
        label: 'Altura Padrão da Parede (px)',
        type: 'number',
        required: false,
        default: 12,
        min: 0,
        max: 64,
        description: 'Altura padrão das paredes frontais e laterais em pixels.',
        editor: { widget: 'number' },
      },
      pattern: {
        label: 'Padrão Lateral',
        type: 'string',
        required: false,
        default: 'dirt_depth',
        allowedValues: ['plain', 'wood_planks', 'stone_brick', 'dirt_depth', 'shaded_bevel', 'custom'],
        description: 'Padrão geométrico das paredes.',
        editor: { widget: 'select' },
      },
    },
    runtime: {
      priority: 14,
      hooks: ['render'],
    },
    editor: {
      category: 'Visual',
      icon: 'box',
    },
  };

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
    super(config.id || 'side_tex_01');
    this.primaryColor = config.primaryColor || '#5c3a21';
    this.secondaryColor = config.secondaryColor ?? config.primaryColor;
    this.shadowColor = config.shadowColor ?? 'rgba(0, 0, 0, 0.35)';
    this.accentColor = config.accentColor;
    this.pattern = config.pattern ?? 'dirt_depth';
    this.defaultWallHeight = config.defaultWallHeight ?? 12;
    this.customRender = config.customRender;
  }

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
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, wallTopY, width, wallHeight);

        const courseHeight = wallHeight / Math.max(1, elevation);
        for (let lvl = 0; lvl < elevation; lvl++) {
          const courseY = wallTopY + lvl * courseHeight;

          ctx.fillStyle = this.shadowColor;
          ctx.fillRect(x, courseY + courseHeight - 2, width, 2);

          ctx.fillStyle = this.secondaryColor;
          const midX = lvl % 2 === 0 ? x + width * 0.45 : x + width * 0.7;
          ctx.fillRect(midX, courseY, 2, courseHeight);

          ctx.fillStyle = this.accentColor || 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(x + 2, courseY + 3, width - 4, 1);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x, wallTopY, 2, wallHeight);
        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(x + width - 2, wallTopY, 2, wallHeight);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x, y - 2, width, 4);
        break;
      }

      case 'stone_brick': {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, wallTopY, width, wallHeight);

        const courseHeight = wallHeight / Math.max(1, elevation);
        for (let lvl = 0; lvl < elevation; lvl++) {
          const courseY = wallTopY + lvl * courseHeight;

          ctx.fillStyle = this.shadowColor;
          ctx.fillRect(x, courseY + courseHeight - 1, width, 1);

          ctx.fillStyle = '#1e293b';
          const seamX = lvl % 2 === 0 ? x + width * 0.5 : x + width * 0.3;
          ctx.fillRect(seamX, courseY, 1.5, courseHeight);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y - 1, width, 3);
        break;
      }

      case 'dirt_depth': {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, wallTopY, width, wallHeight);

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

        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(x, y - 2, width, 2);
        break;
      }
    }

    ctx.restore();
  }

  toJSON(): Record<string, any> {
    return {
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      shadowColor: this.shadowColor,
      accentColor: this.accentColor,
      pattern: this.pattern,
      defaultWallHeight: this.defaultWallHeight,
    };
  }
}
