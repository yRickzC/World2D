import { BlockComponentRegistry } from '../components/BlockComponentRegistry';
import { BlockDefinitionJSON, BlockSystemError, BlockValidationReport } from '../types';

export interface BlockPropertySchema {
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  allowedValues?: any[];
  description: string;
}

export interface BlockComponentSchemaDefinition {
  type: string;
  name: string;
  version: string;
  description: string;
  isDynamic: boolean;
  isSingleton?: boolean;
  incompatibleWith?: string[];
  requires?: string[];
  properties: Record<string, BlockPropertySchema>;
}

export const OFFICIAL_BLOCK_COMPONENT_SCHEMAS: BlockComponentSchemaDefinition[] = [
  {
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
      },
    },
  },
  {
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
      },
      requiredToolTag: {
        label: 'Ferramenta Necessária',
        type: 'string',
        required: false,
        allowedValues: ['', 'pickaxe', 'axe', 'shovel', 'hoe'],
        description: 'Tag da ferramenta necessária para minerar este bloco eficazmente.',
      },
      minToolStrength: {
        label: 'Força Mínima de Ferramenta',
        type: 'number',
        required: false,
        default: 1,
        min: 1,
        max: 10,
        description: 'Nível mínimo de força da ferramenta (ex: 1 madeira, 2 pedra, 3 ferro).',
      },
    },
  },
  {
    type: 'FluidComponent',
    name: 'FluidComponent',
    version: '1.0.0',
    description: 'Configura comportamento líquido (nadar, correnteza, afogamento).',
    isDynamic: false,
    isSingleton: true,
    incompatibleWith: ['SolidComponent'],
    properties: {
      isFluid: {
        label: 'É Fluido',
        type: 'boolean',
        required: true,
        default: true,
        description: 'Permite imersão de entidades.',
      },
      swimSpeedMultiplier: {
        label: 'Multiplicador de Nado',
        type: 'number',
        required: false,
        default: 0.6,
        min: 0.1,
        max: 2.0,
        description: 'Modificador de velocidade ao se deslocar no fluido.',
      },
      drownHazard: {
        label: 'Perigo de Afogamento',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Causa dano de asfixia se submerso por muito tempo.',
      },
    },
  },
  {
    type: 'LightComponent',
    name: 'LightComponent',
    version: '1.0.0',
    description: 'Emite iluminação dinâmica no mundo ao redor do bloco.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      intensity: {
        label: 'Intensidade da Luz',
        type: 'number',
        required: true,
        default: 1.0,
        min: 0,
        max: 1,
        description: 'Brilho da fonte de luz entre 0 e 1.',
      },
      radius: {
        label: 'Raio de Luz (px)',
        type: 'number',
        required: true,
        default: 120,
        min: 10,
        max: 500,
        description: 'Raio em pixels do alcance da iluminação.',
      },
      color: {
        label: 'Cor da Luz',
        type: 'string',
        required: false,
        default: '#f59e0b',
        description: 'Matiz da luz emitida em formato hex.',
      },
    },
  },
  {
    type: 'TransparentComponent',
    name: 'TransparentComponent',
    version: '1.0.0',
    description: 'Determina se o bloco permite passagem de luz e visão através dele.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      transparent: {
        label: 'Transparente',
        type: 'boolean',
        required: true,
        default: true,
        description: 'Permite visibilidade de camadas subjacentes.',
      },
      opacity: {
        label: 'Opacidade',
        type: 'number',
        required: false,
        default: 0.6,
        min: 0,
        max: 1,
        description: 'Nível de opacidade visual.',
      },
    },
  },
  {
    type: 'CollisionComponent',
    name: 'CollisionComponent',
    version: '1.0.0',
    description: 'Caixa delimitadora (AABB) de colisão física personalizada.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      enabled: {
        label: 'Colisão Ativa',
        type: 'boolean',
        required: true,
        default: true,
        description: 'Se ativo, entidades físicas colidem com a caixa.',
      },
    },
  },
  {
    type: 'DynamicBlockComponent',
    name: 'DynamicBlockComponent',
    version: '1.0.0',
    description: 'Ativa simulação ativa, ticks dinâmicos e mutabilidade de estado no mundo.',
    isDynamic: true,
    isSingleton: true,
    properties: {
      tickRate: {
        label: 'Taxa de Ticks (segundos)',
        type: 'number',
        required: false,
        default: 1,
        min: 0.05,
        max: 60,
        description: 'Intervalo entre chamadas de onTick pelo DynamicBlockManager.',
      },
      interactable: {
        label: 'Interagível',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Permite interação direta por clique/tecla.',
      },
    },
  },
];

export class BlockSchemaRegistry {
  private static readonly schemas = new Map<string, BlockComponentSchemaDefinition>();

  static {
    for (const schema of OFFICIAL_BLOCK_COMPONENT_SCHEMAS) {
      this.register(schema);
    }
    this.syncWithComponentRegistry();
  }

  static syncWithComponentRegistry(): void {
    const all = BlockComponentRegistry.getAllSchemas();
    for (const schema of all) {
      this.register(schema);
    }
  }

  static register(schema: BlockComponentSchemaDefinition): void {
    this.schemas.set(schema.type, schema);
    this.schemas.set(schema.type.toLowerCase(), schema);
  }

  static getSchema(type: string): BlockComponentSchemaDefinition | undefined {
    return (
      this.schemas.get(type) ||
      this.schemas.get(type.toLowerCase()) ||
      BlockComponentRegistry.getSchema(type)
    );
  }

  static getAllSchemas(): BlockComponentSchemaDefinition[] {
    this.syncWithComponentRegistry();
    return Array.from(new Set(this.schemas.values()));
  }

  /**
   * Validates a BlockDefinitionJSON according to all architectural rules.
   */
  static validateDefinition(def: Partial<BlockDefinitionJSON>): BlockValidationReport {
    this.syncWithComponentRegistry();

    const errors: string[] = [];
    const warnings: string[] = [];
    const errorDetails: BlockSystemError[] = [];

    const addError = (reason: string, component?: string) => {
      errors.push(reason);
      errorDetails.push({
        system: 'BlockSystem',
        object_id: def.id || 'unknown_block',
        component,
        reason,
      });
    };

    // 1. Root ID validation
    if (!def.id || typeof def.id !== 'string') {
      addError('O bloco deve possuir um "id" string válido.');
    } else {
      const isModId = def.id.startsWith('@');
      if (isModId) {
        // Must follow @mod_id:object_id
        const match = /^@[a-z0-9_]+:[a-z0-9_]+$/.test(def.id);
        if (!match) {
          addError(`ID de Mod inválido "${def.id}". Deve seguir o formato @mod_id:object_id.`);
        }
      } else {
        // Core must follow snake_case
        const match = /^[a-z0-9_]+$/.test(def.id);
        if (!match) {
          addError(`ID do bloco "${def.id}" deve utilizar snake_case (letras minúsculas e underline).`);
        }
      }
    }

    // 2. Root Name validation
    if (!def.name || typeof def.name !== 'string' || def.name.trim().length === 0) {
      addError(`Bloco "${def.id || 'desconhecido'}" deve possuir um "name" legível válido.`);
    }

    // 3. Components structure
    const rawComponents = Array.isArray(def.components) ? def.components : [];
    if (rawComponents.length === 0) {
      warnings.push(`Bloco "${def.id}" foi declarado sem componentes. Considere adicionar pelo menos um ColorTextureComponent ou EmojiIconComponent.`);
    }

    const componentIds = new Set<string>();
    const presentTypes = new Set<string>();

    for (const c of rawComponents) {
      if (!c.id || typeof c.id !== 'string') {
        addError('Componente sem "id" interno definido.', c.type);
      } else if (componentIds.has(c.id)) {
        addError(`ID de componente duplicado "${c.id}" no mesmo bloco.`, c.type);
      } else {
        componentIds.add(c.id);
      }

      if (!c.type || typeof c.type !== 'string') {
        addError('Componente sem declaração de "type".');
        continue;
      }

      const schema = this.getSchema(c.type);
      if (!schema) {
        addError(`Tipo de componente desconhecido ou não suportado no Core: "${c.type}". Mods não podem criar componentes novos.`, c.type);
        continue;
      }

      const canonicalType = schema.type;
      if (schema.isSingleton && presentTypes.has(canonicalType)) {
        addError(`Componente "${canonicalType}" é de instância única e foi adicionado mais de uma vez.`, canonicalType);
      }
      presentTypes.add(canonicalType);

      // Validate required properties and value types
      for (const [propName, propDef] of Object.entries(schema.properties)) {
        const val = c.data ? c.data[propName] : undefined;
        if (propDef.required && (val === undefined || val === null || val === '')) {
          addError(`Campo obrigatório "${propName}" ausente no componente "${canonicalType}".`, canonicalType);
        }

        if (val !== undefined && val !== null && val !== '') {
          if (propDef.type === 'number') {
            const num = Number(val);
            if (isNaN(num)) {
              addError(`Campo "${propName}" no componente "${canonicalType}" deve ser numérico.`, canonicalType);
            } else {
              if (propDef.min !== undefined && num < propDef.min) {
                addError(`Campo "${propName}" no componente "${canonicalType}" deve ser maior ou igual a ${propDef.min}.`, canonicalType);
              }
              if (propDef.max !== undefined && num > propDef.max) {
                addError(`Campo "${propName}" no componente "${canonicalType}" deve ser menor ou igual a ${propDef.max}.`, canonicalType);
              }
            }
          } else if (propDef.type === 'string' && propDef.allowedValues) {
            if (!propDef.allowedValues.includes(val)) {
              addError(`Campo "${propName}" no componente "${canonicalType}" possui valor inválido ("${val}").`, canonicalType);
            }
          }
        }
      }
    }

    // 4. Mod assets namespace validation: @mod_id/assets/...
    if (def.id && def.id.startsWith('@')) {
      const match = def.id.match(/^@([a-z0-9_]+):/);
      const modId = match ? match[1] : '';
      const expectedAssetPrefix = `@${modId}/assets/`;

      const checkAssetString = (val: any, compType?: string) => {
        if (typeof val !== 'string') return;
        const isAssetRef =
          val.includes('/assets/') ||
          /\.(png|jpe?g|webp|svg|json|ogg|mp3|wav)$/i.test(val);
        if (isAssetRef && !val.startsWith(expectedAssetPrefix)) {
          addError(
            `Asset "${val}" não respeita o namespace de mods. Deve obrigatoriamente iniciar com "${expectedAssetPrefix}".`,
            compType
          );
        }
      };

      for (const c of rawComponents) {
        if (c.data && typeof c.data === 'object') {
          for (const key of Object.keys(c.data)) {
            checkAssetString(c.data[key], c.type);
          }
        }
      }
    }

    // 5. Incompatibilities check (e.g. Solid vs Fluid)
    for (const type of presentTypes) {
      const schema = this.getSchema(type);
      if (schema?.incompatibleWith) {
        for (const incomp of schema.incompatibleWith) {
          if (presentTypes.has(incomp)) {
            addError(`Conflito de exclusividade: "${type}" é incompatível com "${incomp}".`, type);
          }
        }
      }
    }

    // 6. Dependency check (requires)
    for (const type of presentTypes) {
      const schema = this.getSchema(type);
      if (schema?.requires) {
        for (const req of schema.requires) {
          if (!presentTypes.has(req)) {
            addError(`Dependência obrigatória ausente: "${type}" exige a presença de "${req}".`, type);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      errorDetails,
    };
  }
}
