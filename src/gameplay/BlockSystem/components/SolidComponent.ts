import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export interface SolidConfig {
  id?: string;
  solid: boolean;
}

export class SolidComponent extends BaseBlockComponent {
  static readonly type = 'SolidComponent';
  readonly type = 'SolidComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'SolidComponent',
    name: 'SolidComponent',
    version: '1.0.0',
    description: 'Determina a solidez física do bloco para colisão e passagem de entidades.',
    isDynamic: false,
    isSingleton: true,
    incompatibleWith: ['FluidComponent'],
    properties: {
      solid: {
        label: 'Sólido',
        type: 'boolean',
        required: true,
        default: true,
        description: 'Se verdadeiro, impede a passagem de entidades a pé.',
        editor: {
          widget: 'checkbox',
        },
      },
    },
    runtime: {
      priority: 10,
    },
    editor: {
      category: 'Física',
      icon: 'box',
    },
  };

  readonly solid: boolean;
  override readonly incompatibleWith = ['FluidComponent'];

  constructor(config: SolidConfig | boolean) {
    const id = typeof config === 'object' && config.id ? config.id : 'solid_01';
    super(id);
    this.solid = typeof config === 'boolean' ? config : config.solid ?? true;
  }

  toJSON(): Record<string, any> {
    return {
      solid: this.solid,
    };
  }
}
