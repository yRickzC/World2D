import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export type BlockTexturePattern =
  | 'plain'
  | 'blades'
  | 'checker'
  | 'wave'
  | 'speckle'
  | 'stone_cobble'
  | 'wood_planks'
  | 'dirt_depth'
  | 'dug_pit'
  | 'custom';

export interface ColorTextureConfig {
  id?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  shadowColor?: string;
  pattern?: BlockTexturePattern;
}

export class ColorTextureComponent extends BaseBlockComponent {
  static readonly type = 'ColorTextureComponent';
  readonly type = 'ColorTextureComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'ColorTextureComponent',
    name: 'ColorTextureComponent',
    version: '1.0.0',
    description: 'Configura cores primárias, secundárias e padrões de textura processual.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      primaryColor: {
        label: 'Cor Primária',
        type: 'string',
        required: true,
        default: '#64748b',
        description: 'Cor base principal do bloco em formato hex.',
        editor: { widget: 'color' },
      },
      secondaryColor: {
        label: 'Cor Secundária',
        type: 'string',
        required: false,
        default: '#475569',
        description: 'Cor secundária para detalhes e contrastes de padrão.',
        editor: { widget: 'color' },
      },
      accentColor: {
        label: 'Cor de Destaque',
        type: 'string',
        required: false,
        description: 'Cor pontual de realce.',
        editor: { widget: 'color' },
      },
      pattern: {
        label: 'Padrão Textural',
        type: 'string',
        required: false,
        default: 'plain',
        allowedValues: [
          'plain',
          'blades',
          'checker',
          'wave',
          'speckle',
          'stone_cobble',
          'wood_planks',
          'dirt_depth',
          'dug_pit',
          'custom',
        ],
        description: 'Padrão geométrico renderizado proceduralmente sobre a superfície.',
        editor: { widget: 'select' },
      },
    },
    runtime: {
      priority: 15,
      hooks: ['render'],
    },
    editor: {
      category: 'Visual',
      icon: 'palette',
    },
  };

  readonly primaryColor: string;
  readonly secondaryColor?: string;
  readonly accentColor?: string;
  readonly shadowColor?: string;
  readonly pattern: BlockTexturePattern;

  constructor(config: ColorTextureConfig) {
    super(config.id || 'color_tex_01');
    this.primaryColor = config.primaryColor || '#64748b';
    this.secondaryColor = config.secondaryColor;
    this.accentColor = config.accentColor;
    this.shadowColor = config.shadowColor;
    this.pattern = config.pattern ?? 'plain';
  }

  toJSON(): Record<string, any> {
    return {
      primaryColor: this.primaryColor,
      secondaryColor: this.secondaryColor,
      accentColor: this.accentColor,
      shadowColor: this.shadowColor,
      pattern: this.pattern,
    };
  }
}
