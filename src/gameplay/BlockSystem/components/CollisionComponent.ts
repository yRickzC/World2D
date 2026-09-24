import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export interface CollisionConfig {
  id?: string;
  enabled: boolean;
  boxWidth?: number;
  boxHeight?: number;
  offsetX?: number;
  offsetY?: number;
}

export class CollisionComponent extends BaseBlockComponent {
  static readonly type = 'CollisionComponent';
  readonly type = 'CollisionComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'CollisionComponent',
    name: 'CollisionComponent',
    version: '1.0.0',
    description: 'Define a caixa delimitadora de colisão física personalizada do bloco.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      enabled: {
        label: 'Colisão Ativa',
        type: 'boolean',
        required: true,
        default: true,
        description: 'Se a caixa de colisão física está ativa.',
        editor: { widget: 'checkbox' },
      },
      boxWidth: {
        label: 'Largura da Caixa (px)',
        type: 'number',
        required: false,
        default: 32,
        min: 1,
        max: 64,
        description: 'Largura da hitbox em pixels.',
        editor: { widget: 'number' },
      },
      boxHeight: {
        label: 'Altura da Caixa (px)',
        type: 'number',
        required: false,
        default: 32,
        min: 1,
        max: 64,
        description: 'Altura da hitbox em pixels.',
        editor: { widget: 'number' },
      },
      offsetX: {
        label: 'Deslocamento X (px)',
        type: 'number',
        required: false,
        default: 0,
        description: 'Deslocamento horizontal da hitbox.',
        editor: { widget: 'number' },
      },
      offsetY: {
        label: 'Deslocamento Y (px)',
        type: 'number',
        required: false,
        default: 0,
        description: 'Deslocamento vertical da hitbox.',
        editor: { widget: 'number' },
      },
    },
    runtime: {
      priority: 11,
    },
    editor: {
      category: 'Física',
      icon: 'shield',
    },
  };

  readonly enabled: boolean;
  readonly boxWidth: number;
  readonly boxHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;

  constructor(config: CollisionConfig | boolean) {
    const id = typeof config === 'object' && config.id ? config.id : 'collision_01';
    super(id);
    if (typeof config === 'boolean') {
      this.enabled = config;
      this.boxWidth = 32;
      this.boxHeight = 32;
      this.offsetX = 0;
      this.offsetY = 0;
    } else {
      this.enabled = config.enabled ?? true;
      this.boxWidth = config.boxWidth ?? 32;
      this.boxHeight = config.boxHeight ?? 32;
      this.offsetX = config.offsetX ?? 0;
      this.offsetY = config.offsetY ?? 0;
    }
  }

  toJSON(): Record<string, any> {
    return {
      enabled: this.enabled,
      boxWidth: this.boxWidth,
      boxHeight: this.boxHeight,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
  }
}
