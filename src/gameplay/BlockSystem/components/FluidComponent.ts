import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export interface FluidConfig {
  id?: string;
  isFluid: boolean;
  swimSpeedMultiplier?: number;
  drownHazard?: boolean;
  flowSpeed?: number;
}

export class FluidComponent extends BaseBlockComponent {
  static readonly type = 'FluidComponent';
  readonly type = 'FluidComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'FluidComponent',
    name: 'FluidComponent',
    version: '1.0.0',
    description: 'Transforma o bloco em um líquido (água, lava, etc.) com física de nado ou correnteza.',
    isDynamic: false,
    isSingleton: true,
    incompatibleWith: ['SolidComponent'],
    properties: {
      isFluid: {
        label: 'É Fluido',
        type: 'boolean',
        required: true,
        default: true,
        description: 'Indica se este bloco atua como volume de líquido.',
        editor: { widget: 'checkbox' },
      },
      swimSpeedMultiplier: {
        label: 'Multiplicador de Velocidade ao Nadar',
        type: 'number',
        required: false,
        default: 0.6,
        min: 0.1,
        max: 2.0,
        step: 0.05,
        description: 'Fator de arrasto que afeta a locomoção do jogador ou criaturas no líquido.',
        editor: { widget: 'slider' },
      },
      drownHazard: {
        label: 'Risco de Afogamento',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Se verdadeiro, consome fôlego de entidades submersas.',
        editor: { widget: 'checkbox' },
      },
      flowSpeed: {
        label: 'Velocidade de Fluxo',
        type: 'number',
        required: false,
        default: 0,
        min: 0,
        max: 10,
        description: 'Força de arrasto da correnteza.',
        editor: { widget: 'number' },
      },
    },
    runtime: {
      priority: 12,
    },
    editor: {
      category: 'Física',
      icon: 'droplet',
    },
  };

  readonly isFluid: boolean;
  readonly swimSpeedMultiplier: number;
  readonly drownHazard: boolean;
  readonly flowSpeed: number;

  override readonly incompatibleWith = ['SolidComponent'];

  constructor(config: FluidConfig) {
    super(config.id || 'fluid_01');
    this.isFluid = config.isFluid ?? true;
    this.swimSpeedMultiplier = config.swimSpeedMultiplier ?? 0.6;
    this.drownHazard = config.drownHazard ?? false;
    this.flowSpeed = config.flowSpeed ?? 0;
  }

  toJSON(): Record<string, any> {
    return {
      isFluid: this.isFluid,
      swimSpeedMultiplier: this.swimSpeedMultiplier,
      drownHazard: this.drownHazard,
      flowSpeed: this.flowSpeed,
    };
  }
}
