import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export interface TransparentConfig {
  id?: string;
  transparent: boolean;
  opacity?: number;
}

export class TransparentComponent extends BaseBlockComponent {
  static readonly type = 'TransparentComponent';
  readonly type = 'TransparentComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'TransparentComponent',
    name: 'TransparentComponent',
    version: '1.0.0',
    description: 'Permite visibilidade através do bloco (vidros, folhas ralas, líquidos translúcidos).',
    isDynamic: false,
    isSingleton: true,
    properties: {
      transparent: {
        label: 'Translúcido / Transparente',
        type: 'boolean',
        required: true,
        default: true,
        description: 'Indica se objetos atrás deste bloco são visíveis.',
        editor: { widget: 'checkbox' },
      },
      opacity: {
        label: 'Opacidade (Alfa)',
        type: 'number',
        required: false,
        default: 0.6,
        min: 0,
        max: 1.0,
        step: 0.05,
        description: 'Nível de opacidade de 0.0 (totalmente transparente) a 1.0 (opaco).',
        editor: { widget: 'slider' },
      },
    },
    runtime: {
      priority: 6,
    },
    editor: {
      category: 'Visual',
      icon: 'eye',
    },
  };

  readonly transparent: boolean;
  readonly opacity: number;

  constructor(config: TransparentConfig | boolean) {
    const id = typeof config === 'object' && config.id ? config.id : 'transparent_01';
    super(id);
    this.transparent = typeof config === 'boolean' ? config : config.transparent ?? true;
    this.opacity = typeof config === 'object' && config.opacity !== undefined ? config.opacity : 0.6;
  }

  toJSON(): Record<string, any> {
    return {
      transparent: this.transparent,
      opacity: this.opacity,
    };
  }
}
