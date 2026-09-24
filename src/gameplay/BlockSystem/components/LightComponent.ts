import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export interface BlockLightConfig {
  id?: string;
  intensity: number; // 0 to 1
  radius: number;    // light radius in pixels
  color?: string;    // CSS color e.g. '#f59e0b'
}

export class LightComponent extends BaseBlockComponent {
  static readonly type = 'LightComponent';
  readonly type = 'LightComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'LightComponent',
    name: 'LightComponent',
    version: '1.0.0',
    description: 'Emite iluminação dinâmica e altera a atmosfera no ciclo dia/noite.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      intensity: {
        label: 'Intensidade da Luz',
        type: 'number',
        required: true,
        default: 1.0,
        min: 0,
        max: 1.0,
        step: 0.1,
        description: 'Potência da fonte luminosa (de 0.0 a 1.0).',
        editor: { widget: 'slider' },
      },
      radius: {
        label: 'Raio de Iluminação (px)',
        type: 'number',
        required: true,
        default: 120,
        min: 10,
        max: 800,
        step: 10,
        description: 'Distância em pixels até onde a luz alcança.',
        editor: { widget: 'number' },
      },
      color: {
        label: 'Cor da Luz',
        type: 'string',
        required: false,
        default: '#f59e0b',
        description: 'Tom de cor emitido pela fonte (ex: tocha amarela, cristal azul).',
        editor: { widget: 'color' },
      },
    },
    runtime: {
      priority: 8,
    },
    editor: {
      category: 'Ambiente',
      icon: 'sun',
    },
  };

  readonly intensity: number;
  readonly radius: number;
  readonly color: string;

  constructor(config: BlockLightConfig) {
    super(config.id || 'light_01');
    this.intensity = config.intensity ?? 1.0;
    this.radius = config.radius ?? 120;
    this.color = config.color || '#f59e0b';
  }

  toJSON(): Record<string, any> {
    return {
      intensity: this.intensity,
      radius: this.radius,
      color: this.color,
    };
  }
}
