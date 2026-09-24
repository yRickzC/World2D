import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export type TopTexturePattern =
  | 'plain'
  | 'checker'
  | 'speckle'
  | 'wave'
  | 'blades'
  | 'wood_planks'
  | 'dirt_compact'
  | 'dug_pit'
  | 'stone_cobble'
  | 'custom';

export interface TopTextureConfig {
  id?: string;
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

export class TopTextureComponent extends BaseBlockComponent {
  static readonly type = 'TopTextureComponent';
  readonly type = 'TopTextureComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'TopTextureComponent',
    name: 'TopTextureComponent',
    version: '1.0.0',
    description: 'Renderiza a face superior isométrica do bloco com padrões visuais de alta definição.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      primaryColor: {
        label: 'Cor Principal do Topo',
        type: 'string',
        required: true,
        default: '#22c55e',
        description: 'Cor dominante do topo do bloco.',
        editor: { widget: 'color' },
      },
      secondaryColor: {
        label: 'Cor Secundária do Topo',
        type: 'string',
        required: false,
        description: 'Cor para detalhes, folhagens ou veios do topo.',
        editor: { widget: 'color' },
      },
      accentColor: {
        label: 'Cor de Realce',
        type: 'string',
        required: false,
        description: 'Cor para bordas chanfradas e realces finos.',
        editor: { widget: 'color' },
      },
      pattern: {
        label: 'Padrão do Topo',
        type: 'string',
        required: false,
        default: 'plain',
        allowedValues: [
          'plain',
          'checker',
          'speckle',
          'wave',
          'blades',
          'wood_planks',
          'dirt_compact',
          'dug_pit',
          'stone_cobble',
          'custom',
        ],
        description: 'Padrão de preenchimento da face superior.',
        editor: { widget: 'select' },
      },
    },
    runtime: {
      priority: 16,
      hooks: ['render'],
    },
    editor: {
      category: 'Visual',
      icon: 'layers',
    },
  };

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
    super(config.id || 'top_tex_01');
    this.primaryColor = config.primaryColor || '#4ade80';
    this.secondaryColor = config.secondaryColor ?? config.primaryColor;
    this.accentColor = config.accentColor;
    this.pattern = config.pattern ?? 'plain';
    this.customRender = config.customRender;
  }

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
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        const plankH = size / 4;
        ctx.fillStyle = this.secondaryColor;
        for (let i = 0; i < 4; i++) {
          const py = y + i * plankH;
          ctx.fillRect(x, py, size, 1);
          ctx.fillStyle = this.accentColor || 'rgba(0, 0, 0, 0.12)';
          ctx.fillRect(x + 4, py + 3, size - 12, 1);
          ctx.fillRect(x + 10, py + plankH - 3, size - 20, 1);
        }

        ctx.strokeStyle = this.accentColor || 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        break;
      }

      case 'dug_pit': {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, size, 4);
        ctx.fillRect(x, y, 4, size);

        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 6, y + 8, size - 12, size - 14);

        ctx.fillStyle = this.accentColor || '#29160a';
        ctx.fillRect(x + 8, y + 10, 3, 3);
        ctx.fillRect(x + 18, y + 14, 4, 3);
        ctx.fillRect(x + 12, y + 22, 3, 3);
        ctx.fillRect(x + 24, y + 26, 4, 4);

        ctx.fillStyle = '#785038';
        ctx.fillRect(x + 9, y + 18, 2, 2);
        ctx.fillRect(x + 22, y + 10, 2, 2);
        break;
      }

      case 'stone_cobble': {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

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
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        const waveOffset = Math.sin(time * 0.003 + x) * 2;
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 6 + waveOffset, y + 14, 18, 2);
        break;
      }

      case 'blades': {
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(x + 10, y + 12, 2, 5);
        ctx.fillRect(x + 13, y + 10, 2, 7);
        ctx.fillRect(x + 22, y + 20, 2, 5);
        break;
      }

      case 'speckle': {
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

  toJSON(): Record<string, any> {
    return {
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      accentColor: this.accentColor,
      pattern: this.pattern,
    };
  }
}
