import { ItemDefinitionJSON } from '../types';

export interface ComponentPropertySchema {
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  allowedValues?: any[];
  description: string;
  dependsOn?: { field: string; value: any };
}

export interface ComponentSchemaDefinition {
  type: string;
  name: string;
  version: string;
  description: string;
  isDynamic: boolean;
  isSingleton?: boolean;
  incompatibleWith?: string[];
  requires?: string[];
  properties: Record<string, ComponentPropertySchema>;
}

export interface ItemValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const VALID_ITEM_CATEGORIES_LIST = [
  'weapons',
  'tools',
  'armor',
  'accessories',
  'consumables',
  'backpacks',
] as const;

export const VALID_RARITIES_LIST = [
  'Comum',
  'Raro',
  'Épico',
  'Lendário',
] as const;

// The 16 official components of ItemSystem in explicit order
export const OFFICIAL_COMPONENT_SCHEMAS: ComponentSchemaDefinition[] = [
  {
    type: 'IdentityComponent',
    name: 'IdentityComponent',
    version: '2.0.0',
    description: 'Define a identidade única e os metadados fundamentais do item.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      displayName: {
        label: 'Nome Exibido',
        type: 'string',
        required: true,
        default: 'Novo Item',
        description: 'Nome do item exibido para o jogador na interface e inventário.',
      },
      description: {
        label: 'Descrição',
        type: 'string',
        required: false,
        default: 'Descrição do item.',
        description: 'Texto descritivo com informações úteis e lore do item.',
      },
      icon: {
        label: 'Símbolo / Tag de Ícone',
        type: 'string',
        required: false,
        default: 'item_icon',
        description: 'Identificador textual ou chave simbólica de busca rápida.',
      },
    },
  },
  {
    type: 'RarityComponent',
    name: 'RarityComponent',
    version: '2.0.0',
    description: 'Define a raridade do Item e influencia sua classificação e qualidade.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      rarity: {
        label: 'Raridade',
        type: 'string',
        required: true,
        default: 'Comum',
        allowedValues: ['Comum', 'Raro', 'Épico', 'Lendário'],
        description: 'Define a raridade do Item e influencia sua classificação e qualidade.',
      },
    },
  },
  {
    type: 'LevelComponent',
    name: 'LevelComponent',
    version: '2.0.0',
    description: 'Permite que o Item possua níveis e evolua através da combinação de duplicatas.',
    isDynamic: true,
    isSingleton: true,
    incompatibleWith: ['StackComponent', 'stack'],
    properties: {
      currentLevel: {
        label: 'Nível Atual',
        type: 'number',
        required: true,
        default: 1,
        min: 1,
        max: 100,
        description: 'Nível inicial básico do item ao ser obtido.',
      },
      maxLevel: {
        label: 'Nível Máximo',
        type: 'number',
        required: true,
        default: 10,
        min: 1,
        max: 100,
        description: 'Limite máximo de níveis que o item pode atingir após fusões e aprimoramentos.',
      },
      experience: {
        label: 'Experiência Base',
        type: 'number',
        required: false,
        default: 0,
        min: 0,
        description: 'Pontos de experiência acumulados para progressão rumo ao próximo nível.',
      },
    },
  },
  {
    type: 'StackComponent',
    name: 'StackComponent',
    version: '2.0.0',
    description: 'Permite armazenar múltiplas unidades do mesmo Item em uma única pilha. O limite depende do peso do Item e da mochila equipada.',
    isDynamic: true,
    isSingleton: true,
    incompatibleWith: ['LevelComponent', 'level'],
    properties: {
      weight: {
        label: 'Weight',
        type: 'number',
        required: true,
        default: 2.0,
        min: 0.1,
        max: 100,
        step: 0.1,
        description: 'Define o peso usado para calcular quantas unidades deste Item podem ser armazenadas em uma única pilha. O limite final depende da mochila equipada.',
      },
    },
  },
  {
    type: 'TagComponent',
    name: 'TagComponent',
    version: '2.0.0',
    description: 'Atribui etiquetas conceituais ao item para filtragem, crafting e interações no mundo.',
    isDynamic: false,
    properties: {
      tags: {
        label: 'Tags / Etiquetas',
        type: 'array',
        required: false,
        default: ['crafting', 'material'],
        description: 'Lista de tags separadas por vírgula que descrevem propriedades do item.',
      },
    },
  },
  {
    type: 'StatsComponent',
    name: 'StatsComponent',
    version: '2.0.0',
    description: 'Define atributos numéricos base concedidos ou possuídos pelo item.',
    isDynamic: true,
    isSingleton: true,
    properties: {
      attack: {
        label: 'Ataque',
        type: 'number',
        required: false,
        default: 10,
        min: 0,
        description: 'Poder de ataque e dano direto infligido ao utilizar o item.',
      },
      defense: {
        label: 'Defesa',
        type: 'number',
        required: false,
        default: 5,
        min: 0,
        description: 'Armadura e redução de dano concedidas ao personagem.',
      },
      speed: {
        label: 'Velocidade',
        type: 'number',
        required: false,
        default: 1.0,
        min: 0.1,
        step: 0.1,
        description: 'Modificador de velocidade de ataque ou movimento ao empunhar o item.',
      },
      durability: {
        label: 'Durabilidade Máxima',
        type: 'number',
        required: false,
        default: 100,
        min: 1,
        description: 'Pontos de integridade estrutural do item antes de sofrer quebra.',
      },
    },
  },
  {
    type: 'EquipmentComponent',
    name: 'EquipmentComponent',
    version: '2.0.0',
    description: 'Permite que o item seja equipado pelo jogador em um slot de vestuário ou combate.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      slot: {
        label: 'Slot de Equipamento',
        type: 'string',
        required: true,
        default: 'main_hand',
        allowedValues: ['head', 'chest', 'legs', 'feet', 'main_hand', 'off_hand', 'accessory'],
        description: 'Espaço do corpo ou da mão onde este item deve ser equipado.',
      },
      requiredLevel: {
        label: 'Nível Requerido',
        type: 'number',
        required: false,
        default: 1,
        min: 1,
        description: 'Nível mínimo exigido do personagem para poder equipar o item.',
      },
    },
  },
  {
    type: 'WeaponComponent',
    name: 'WeaponComponent',
    version: '2.0.0',
    description: 'Configura comportamentos ofensivos específicos de armas de combate.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      damageType: {
        label: 'Tipo de Dano',
        type: 'string',
        required: true,
        default: 'physical',
        allowedValues: ['physical', 'magical', 'fire', 'pierce'],
        description: 'Elemento ou natureza do dano causado pelos golpes desta arma.',
      },
      criticalRate: {
        label: 'Taxa Crítica (%)',
        type: 'number',
        required: false,
        default: 5,
        min: 0,
        max: 100,
        description: 'Probabilidade percentual de desferir acertos críticos com dano ampliado.',
      },
      range: {
        label: 'Alcance (Metros)',
        type: 'number',
        required: false,
        default: 2,
        min: 1,
        max: 50,
        description: 'Distância física máxima permitida para acertar alvos inimigos.',
      },
    },
  },
  {
    type: 'ToolComponent',
    name: 'ToolComponent',
    version: '2.0.0',
    description: 'Permite que o item funcione como ferramenta de coleta e modificação do mundo.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      toolType: {
        label: 'Tipo de Ferramenta',
        type: 'string',
        required: true,
        default: 'pickaxe',
        allowedValues: ['pickaxe', 'axe', 'shovel', 'hoe'],
        description: 'Especialidade de mineração ou manipulação de blocos da ferramenta.',
      },
      miningLevel: {
        label: 'Poder de Coleta (Tier)',
        type: 'number',
        required: true,
        default: 1,
        min: 1,
        max: 10,
        description: 'Nível de dureza de blocos que a ferramenta consegue quebrar eficientemente.',
      },
      harvestSpeed: {
        label: 'Velocidade de Mineração',
        type: 'number',
        required: true,
        default: 1.2,
        min: 0.1,
        max: 10.0,
        step: 0.1,
        description: 'Multiplicador de velocidade aplicado ao quebrar blocos compatíveis.',
      },
    },
  },
  {
    type: 'ConsumableComponent',
    name: 'ConsumableComponent',
    version: '2.0.0',
    description: 'Permite que o item seja consumido pelo jogador para receber efeitos imediatos.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      restoreAmount: {
        label: 'Quantidade Restaurada',
        type: 'number',
        required: true,
        default: 20,
        min: 0,
        description: 'Pontos de vida ou estamina instantaneamente recuperados ao consumir.',
      },
      consumeTime: {
        label: 'Tempo de Consumo (Segundos)',
        type: 'number',
        required: true,
        default: 1.5,
        min: 0,
        max: 10,
        step: 0.1,
        description: 'Intervalo de tempo segurando a ação para concluir a ingestão do item.',
      },
      consumeEffect: {
        label: 'Efeito Especial',
        type: 'string',
        required: true,
        default: 'heal',
        allowedValues: ['heal', 'energy', 'speed_boost', 'strength'],
        description: 'Bônus temporário ou restauração concedida após o término do consumo.',
      },
    },
  },
  {
    type: 'PassiveComponent',
    name: 'PassiveComponent',
    version: '2.0.0',
    description: 'Concede efeitos passivos contínuos enquanto o item estiver em posse ou equipado.',
    isDynamic: false,
    properties: {
      passiveName: {
        label: 'Nome da Passiva',
        type: 'string',
        required: true,
        default: 'Vitalidade Ancestral',
        description: 'Denominação do efeito passivo concedido.',
      },
      effectMultiplier: {
        label: 'Multiplicador de Efeito',
        type: 'number',
        required: true,
        default: 1.15,
        min: 0.1,
        step: 0.05,
        description: 'Fator percentual de amplificação aplicado aos atributos passivos.',
      },
      triggerCondition: {
        label: 'Condição de Ativação',
        type: 'string',
        required: true,
        default: 'always',
        allowedValues: ['always', 'low_health', 'night_time', 'in_combat'],
        description: 'Circunstância em que o efeito passivo é ligado e aplicado ao jogador.',
      },
    },
  },
  {
    type: 'ValueComponent',
    name: 'ValueComponent',
    version: '2.0.0',
    description: 'Determina o valor econômico do item para negociação em mercadores e lojas.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      buyPrice: {
        label: 'Preço de Compra',
        type: 'number',
        required: true,
        default: 50,
        min: 0,
        description: 'Custo em moedas para o jogador adquirir este item nos mercadores.',
      },
      sellPrice: {
        label: 'Preço de Venda',
        type: 'number',
        required: true,
        default: 25,
        min: 0,
        description: 'Valor em moedas recebido pelo jogador ao vender este item.',
      },
    },
  },
  {
    type: 'VisualComponent',
    name: 'VisualComponent',
    version: '2.0.0',
    description: 'Define a representação visual utilizada pelo Item, como Emoji ou SVG.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      visualType: {
        label: 'Tipo',
        type: 'string',
        required: true,
        default: 'Emoji',
        allowedValues: ['Emoji', 'SVG'],
        description: 'Formato da fonte visual primária do item.',
      },
      source: {
        label: 'Source',
        type: 'string',
        required: true,
        default: '⚔️',
        description: 'Glifo emoji (ex: ⚔️), caminho do arquivo SVG (assets/...) ou código <svg> inline.',
      },
      svgSourceType: {
        label: 'Source Type',
        type: 'string',
        required: false,
        default: 'SVG Code',
        allowedValues: ['SVG Code', 'SVG Path'],
        description: 'Especifica se o SVG é um código XML inline (<svg>...</svg>) ou caminho no disco.',
        dependsOn: { field: 'visualType', value: 'SVG' },
      },
      accentColor: {
        label: 'Cor de Destaque',
        type: 'string',
        required: false,
        default: '#38bdf8',
        description: 'Cor temática em hexadecimal (#hex) utilizada para brilho e fundo do item.',
      },
    },
  },
  {
    type: 'RenderComponent',
    name: 'RenderComponent',
    version: '2.0.0',
    description: 'Define como a representação visual do Item será renderizada.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      renderer: {
        label: 'Renderer',
        type: 'string',
        required: true,
        default: 'label_emoji',
        allowedValues: ['label', 'label_icon', 'label_emoji', 'svg_renderer'],
        description: 'Modo de desenho visual na interface (Label simples, Label + Ícone, Label + Emoji, ou SVG Renderer).',
      },
      showLabel: {
        label: 'Exibir Rótulo',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Determina se o texto com nome ou sigla deve ser renderizado ao lado do visual.',
      },
      scale: {
        label: 'Escala de Renderização',
        type: 'number',
        required: false,
        default: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        description: 'Multiplicador de escala do ícone no centro dos slots (1.0 = 100%).',
      },
    },
  },
];

export class SchemaRegistry {
  private readonly schemas: Map<string, ComponentSchemaDefinition> = new Map();
  private readonly schemaAliases: Map<string, string> = new Map();

  constructor() {
    for (const schema of OFFICIAL_COMPONENT_SCHEMAS) {
      this.registerSchema(schema);
    }
    this.registerLegacyAliases();
  }

  private registerLegacyAliases(): void {
    // Map legacy types to corresponding official schemas
    this.schemaAliases.set('stack', 'StackComponent');
    this.schemaAliases.set('render', 'RenderComponent');
    this.schemaAliases.set('tool', 'ToolComponent');
    this.schemaAliases.set('weapon', 'WeaponComponent');
    this.schemaAliases.set('food', 'ConsumableComponent');
    this.schemaAliases.set('consumable', 'ConsumableComponent');
    this.schemaAliases.set('description', 'IdentityComponent');
    this.schemaAliases.set('durability', 'StatsComponent');
  }

  registerSchema(schema: ComponentSchemaDefinition): void {
    this.schemas.set(schema.type, schema);
    this.schemas.set(schema.type.toLowerCase(), schema);
  }

  getSchema(type: string): ComponentSchemaDefinition | undefined {
    if (!type) return undefined;
    if (this.schemas.has(type)) return this.schemas.get(type);
    const lower = type.toLowerCase();
    if (this.schemas.has(lower)) return this.schemas.get(lower);
    if (this.schemaAliases.has(lower)) {
      const canonical = this.schemaAliases.get(lower)!;
      return this.schemas.get(canonical);
    }
    return undefined;
  }

  getAllSchemas(): ComponentSchemaDefinition[] {
    return OFFICIAL_COMPONENT_SCHEMAS;
  }

  /**
   * Returns the 16 official components available for dropdown selection in the editor.
   */
  getUserCreatableSchemas(): ComponentSchemaDefinition[] {
    return OFFICIAL_COMPONENT_SCHEMAS;
  }

  generateDefaultData(type: string): Record<string, any> {
    const schema = this.getSchema(type);
    if (!schema) return {};

    const data: Record<string, any> = {};
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      if (propDef.default !== undefined) {
        data[propName] = Array.isArray(propDef.default)
          ? [...propDef.default]
          : propDef.default;
      } else if (propDef.type === 'number') {
        data[propName] = propDef.min ?? 0;
      } else if (propDef.type === 'string') {
        data[propName] = propDef.allowedValues ? propDef.allowedValues[0] : '';
      } else if (propDef.type === 'boolean') {
        data[propName] = true;
      } else if (propDef.type === 'array') {
        data[propName] = [];
      }
    }
    return data;
  }

  /**
   * Validates an item definition against ItemSystem rules:
   * - LevelComponent + StackComponent is forbidden
   * - Singletons cannot appear multiple times
   * - Categories must be within allowed set
   * - Rarities must be Comum, Raro, Épico, Lendário
   */
  validateItem(item: Partial<ItemDefinitionJSON>): ItemValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Root fields validation
    if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
      errors.push('O campo "ID" é obrigatório e não pode ser vazio.');
    } else {
      if (!/^[a-z0-9_]+$/.test(item.id)) {
        warnings.push('O "ID" deve conter preferencialmente letras minúsculas, números e sublinhados (snake_case).');
      }
    }

    if (!item.nome || typeof item.nome !== 'string' || item.nome.trim() === '') {
      errors.push('O campo "Nome" é obrigatório.');
    }

    const allowedCategories = new Set<string>([
      ...VALID_ITEM_CATEGORIES_LIST,
      // Core backward-compatible categories
      'tool',
      'weapon',
      'food',
      'material',
      'nature',
      'block',
      'utility',
    ]);

    if (!item.categoria || !allowedCategories.has(item.categoria)) {
      errors.push(
        `Categoria inválida: "${item.categoria}". Permitidas: ${VALID_ITEM_CATEGORIES_LIST.join(', ')}`
      );
    }

    // 2. Components inspection
    const components = item.components || [];
    const idSet = new Set<string>();
    const typeCount = new Map<string, number>();

    let hasLevel = false;
    let hasStack = false;
    let visualCount = 0;
    let renderCount = 0;

    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      const prefix = `Componente #${i + 1}`;

      if (!comp.id || comp.id.trim() === '') {
        errors.push(`${prefix} não possui um ID interno definido.`);
      } else {
        if (idSet.has(comp.id)) {
          errors.push(`ID interno duplicado detectado: "${comp.id}". Cada componente na entity deve possuir um ID exclusivo.`);
        }
        idSet.add(comp.id);
      }

      if (!comp.type) {
        errors.push(`${prefix} não possui um tipo declarado.`);
        continue;
      }

      const schema = this.getSchema(comp.type);
      const canonicalType = schema ? schema.type : comp.type;

      typeCount.set(canonicalType, (typeCount.get(canonicalType) || 0) + 1);

      if (canonicalType === 'LevelComponent' || comp.type.toLowerCase() === 'level') {
        hasLevel = true;
      }
      if (canonicalType === 'StackComponent' || comp.type.toLowerCase() === 'stack') {
        hasStack = true;
      }
      if (canonicalType === 'VisualComponent') {
        visualCount++;
      }
      if (canonicalType === 'RenderComponent' || comp.type.toLowerCase() === 'render') {
        renderCount++;
      }

      if (schema) {
        // Validate singletons
        if (schema.isSingleton && (typeCount.get(canonicalType) || 0) > 1) {
          errors.push(`Erro: Um Item pode possuir somente uma instância de ${schema.name}.`);
        }

        // Validate properties against schema
        const data = comp.data || {};
        for (const [propName, propDef] of Object.entries(schema.properties)) {
          const val = data[propName];

          if (propDef.required && (val === undefined || val === null || val === '')) {
            errors.push(`[${schema.name}] O campo "${propDef.label}" (${propName}) é obrigatório.`);
          }

          if (val !== undefined && val !== null && val !== '') {
            if (propDef.type === 'number') {
              const num = Number(val);
              if (isNaN(num)) {
                errors.push(`[${schema.name}] "${propDef.label}" deve ser um número válido.`);
              } else {
                if (propDef.min !== undefined && num < propDef.min) {
                  errors.push(`[${schema.name}] "${propDef.label}" deve ser maior ou igual a ${propDef.min}.`);
                }
                if (propDef.max !== undefined && num > propDef.max) {
                  errors.push(`[${schema.name}] "${propDef.label}" deve ser menor ou igual a ${propDef.max}.`);
                }
              }
            } else if (propDef.type === 'string' && propDef.allowedValues) {
              if (!propDef.allowedValues.includes(val)) {
                errors.push(
                  `[${schema.name}] "${propDef.label}" possui valor inválido ("${val}"). Permitidos: ${propDef.allowedValues.join(', ')}`
                );
              }
            }
          }
        }
      }
    }

    // 3. Rule: LevelComponent + StackComponent is forbidden
    if (hasLevel && hasStack) {
      errors.push('Erro: Um Item não pode possuir LevelComponent e StackComponent ao mesmo tempo.');
    }

    // 4. Rule: Visual exclusivity (do not allow multiple conflicting visual or render definitions)
    if (visualCount > 1) {
      errors.push('Erro: Um Item pode possuir no máximo um VisualComponent.');
    }
    if (renderCount > 1) {
      errors.push('Erro: Um Item pode possuir no máximo um RenderComponent.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const globalSchemaRegistry = new SchemaRegistry();
