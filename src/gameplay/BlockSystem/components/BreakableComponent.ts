import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export interface BlockDropItem {
  type: string;
  count: number;
  chance?: number;
}

export interface BreakableConfig {
  id?: string;
  hardness: number;
  dropItems?: BlockDropItem[];
  requiredToolTag?: string;
  minToolStrength?: number;
}

export class BreakableComponent extends BaseBlockComponent {
  static readonly type = 'BreakableComponent';
  readonly type = 'BreakableComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'BreakableComponent',
    name: 'BreakableComponent',
    version: '1.0.0',
    description: 'Define as propriedades de quebra, resistência e drops do bloco.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      hardness: {
        label: 'Dureza / Resistência',
        type: 'number',
        required: true,
        default: 1,
        min: 0,
        max: 100,
        description: 'Tempo e esforço necessários para quebrar o bloco.',
        editor: { widget: 'number' },
      },
      requiredToolTag: {
        label: 'Ferramenta Necessária',
        type: 'string',
        required: false,
        allowedValues: ['', 'pickaxe', 'axe', 'shovel', 'hoe'],
        description: 'Tag da ferramenta necessária para minerar este bloco eficazmente.',
        editor: { widget: 'select' },
      },
      minToolStrength: {
        label: 'Força Mínima de Ferramenta',
        type: 'number',
        required: false,
        default: 1,
        min: 1,
        max: 10,
        description: 'Nível mínimo de força da ferramenta (ex: 1 madeira, 2 pedra, 3 ferro).',
        editor: { widget: 'number' },
      },
      dropItems: {
        label: 'Drops ao Quebrar',
        type: 'array',
        required: false,
        description: 'Lista de itens gerados no chão ao quebrar o bloco.',
      },
    },
    runtime: {
      priority: 20,
      hooks: ['onDestroyed'],
    },
    editor: {
      category: 'Interação',
      icon: 'hammer',
    },
  };

  readonly hardness: number;
  readonly dropItems: BlockDropItem[];
  readonly requiredToolTag?: string;
  readonly minToolStrength: number;

  constructor(config: BreakableConfig) {
    super(config.id || 'breakable_01');
    this.hardness = config.hardness ?? 1;
    this.dropItems = config.dropItems ?? [];
    this.requiredToolTag = config.requiredToolTag;
    this.minToolStrength = config.minToolStrength ?? 1;
  }

  canBeHarvestedWith(toolTag?: string, toolStrength: number = 1): boolean {
    if (!this.requiredToolTag) return true;
    if (this.requiredToolTag !== toolTag) return false;
    return toolStrength >= this.minToolStrength;
  }

  toJSON(): Record<string, any> {
    return {
      hardness: this.hardness,
      dropItems: this.dropItems,
      requiredToolTag: this.requiredToolTag,
      minToolStrength: this.minToolStrength,
    };
  }
}
