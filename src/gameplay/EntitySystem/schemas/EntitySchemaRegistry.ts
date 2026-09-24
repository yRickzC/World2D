import { EntityDefinitionJSON, EntityValidationReport } from '../types';

export interface EntityPropertySchema {
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

export interface EntityComponentSchemaDefinition {
  type: string;
  name: string;
  version: string;
  description: string;
  isSingleton?: boolean;
  incompatibleWith?: string[];
  requires?: string[];
  properties: Record<string, EntityPropertySchema>;
}

export const OFFICIAL_ENTITY_COMPONENT_SCHEMAS: EntityComponentSchemaDefinition[] = [
  {
    type: 'NameComponent',
    name: 'NameComponent',
    version: '1.0.0',
    description: 'Define o nome de exibição e identidade nominal da entidade.',
    isSingleton: true,
    properties: {
      name: {
        label: 'Nome de Exibição',
        type: 'string',
        required: true,
        default: 'Entidade',
        description: 'Nome visível sobre a cabeça da entidade ou na interface.',
      },
    },
  },
  {
    type: 'HealthComponent',
    name: 'HealthComponent',
    version: '1.0.0',
    description: 'Gerencia a vitalidade, vida máxima e estado de invulnerabilidade.',
    isSingleton: true,
    properties: {
      maxHealth: {
        label: 'Vida Máxima (HP)',
        type: 'number',
        required: true,
        default: 100,
        min: 1,
        max: 10000,
        description: 'Total de pontos de vida máximos da entidade.',
      },
      currentHealth: {
        label: 'Vida Inicial',
        type: 'number',
        default: 100,
        min: 1,
        max: 10000,
        description: 'Pontos de vida com os quais a entidade nasce no mundo.',
      },
      invulnerable: {
        label: 'Invulnerável',
        type: 'boolean',
        default: false,
        description: 'Se ativo, a entidade não sofre dano de ataques ou perigos.',
      },
    },
  },
  {
    type: 'MovementComponent',
    name: 'MovementComponent',
    version: '1.0.0',
    description: 'Controla a capacidade de locomoção, velocidade e travessia.',
    isSingleton: true,
    properties: {
      speed: {
        label: 'Velocidade de Movimento',
        type: 'number',
        required: true,
        default: 2.5,
        min: 0,
        max: 20,
        step: 0.1,
        description: 'Velocidade de deslocamento da entidade em pixels/tick.',
      },
      canFly: {
        label: 'Capacidade de Voo',
        type: 'boolean',
        default: false,
        description: 'Permite sobrevoar obstáculos e terrenos acidentados.',
      },
      canSwim: {
        label: 'Capacidade de Nado',
        type: 'boolean',
        default: true,
        description: 'Permite nadar em corpos de água sem sofrer afogamento imediato.',
      },
    },
  },
  {
    type: 'StyleComponent',
    name: 'StyleComponent',
    version: '1.0.0',
    description: 'Configura a renderização visual e estética gráfica (Emoji, SVG ou Cor).',
    isSingleton: true,
    properties: {
      mode: {
        label: 'Modo de Estilo',
        type: 'string',
        required: true,
        default: 'emoji',
        allowedValues: ['emoji', 'svg', 'color'],
        description: 'Tipo de representação gráfica da entidade no mundo.',
      },
      value: {
        label: 'Valor Visual (Emoji / SVG / Hex)',
        type: 'string',
        required: true,
        default: '🧟',
        description: 'Emoji (ex: 🧟, 🧑), código XML do SVG ou cor hexadecimal.',
      },
      size: {
        label: 'Tamanho Base (px)',
        type: 'number',
        default: 40,
        min: 12,
        max: 128,
        description: 'Dimensão do avatar em pixels na tela.',
      },
      scale: {
        label: 'Escala de Renderização',
        type: 'number',
        default: 1.0,
        min: 0.2,
        max: 4.0,
        step: 0.1,
        description: 'Fator multiplicador do tamanho da entidade.',
      },
      tint: {
        label: 'Cor de Aura / Tonalidade',
        type: 'string',
        default: '',
        description: 'Cor hexadecimal de iluminação ou filtro (ex: #ef4444).',
      },
    },
  },
  {
    type: 'CombatComponent',
    name: 'CombatComponent',
    version: '1.0.0',
    description: 'Habilidades ofensivas, poder de ataque, alcance e recarga.',
    isSingleton: true,
    properties: {
      damage: {
        label: 'Dano de Ataque',
        type: 'number',
        required: true,
        default: 10,
        min: 0,
        max: 1000,
        description: 'Quantidade de dano infligido a cada golpe bem-sucedido.',
      },
      attackRange: {
        label: 'Alcance de Ataque (px)',
        type: 'number',
        required: true,
        default: 32,
        min: 8,
        max: 500,
        description: 'Distância máxima em pixels para iniciar um ataque.',
      },
      attackCooldown: {
        label: 'Tempo de Recarga (s)',
        type: 'number',
        required: true,
        default: 1.0,
        min: 0.1,
        max: 10.0,
        step: 0.1,
        description: 'Intervalo em segundos entre ataques consecutivos.',
      },
    },
  },
  {
    type: 'AIComponent',
    name: 'AIComponent',
    version: '1.0.0',
    description: 'Comportamento autônomo, rotinas de IA e raio de percepção.',
    isSingleton: true,
    properties: {
      behavior: {
        label: 'Comportamento Base',
        type: 'string',
        required: true,
        default: 'passive',
        allowedValues: ['passive', 'hostile', 'neutral', 'fleeing'],
        description: 'Postura da inteligência artificial frente a outras criaturas.',
      },
      detectionRadius: {
        label: 'Raio de Percepção (px)',
        type: 'number',
        required: true,
        default: 128,
        min: 0,
        max: 1000,
        description: 'Distância máxima para detectar e reagir a alvos ou ameaças.',
      },
    },
  },
  {
    type: 'InventoryComponent',
    name: 'InventoryComponent',
    version: '1.0.0',
    description: 'Capacidade de transporte de itens e drops pós-morte.',
    isSingleton: true,
    properties: {
      capacity: {
        label: 'Capacidade de Slots',
        type: 'number',
        required: true,
        default: 16,
        min: 1,
        max: 64,
        description: 'Quantidade de slots de inventário suportados.',
      },
      dropOnDeath: {
        label: 'Dropar ao Morrer',
        type: 'boolean',
        default: true,
        description: 'Se verdadeiro, solta todos os pertences no solo ao morrer.',
      },
    },
  },
  {
    type: 'PhysicsComponent',
    name: 'PhysicsComponent',
    version: '1.0.0',
    description: 'Propriedades físicas, colisão rígida e resposta a empurrões.',
    isSingleton: true,
    properties: {
      solid: {
        label: 'Corpo Sólido',
        type: 'boolean',
        default: true,
        description: 'Se a entidade colide com outros corpos sólidos e blocos.',
      },
      mass: {
        label: 'Massa Física (kg)',
        type: 'number',
        default: 1.0,
        min: 0.1,
        max: 100,
        step: 0.1,
        description: 'Inércia da entidade contra forças e repulsões.',
      },
      pushable: {
        label: 'Empurrável',
        type: 'boolean',
        default: true,
        description: 'Se a entidade pode ser empurrada por outras criaturas.',
      },
    },
  },
  {
    type: 'EntitySpawnComponent',
    name: 'EntitySpawnComponent',
    version: '1.0.0',
    description: 'Controla regras declarativas de nascimento: horário, biomas, superfície, distância e taxas.',
    isSingleton: true,
    properties: {
      time: {
        label: 'Janela de Horário',
        type: 'object',
        default: { mode: 'any', startTime: '00:00', endTime: '24:00' },
        description: 'Configuração de horário permitido (any, day, night ou custom com startTime e endTime).',
      },
      allowedBiomes: {
        label: 'Biomas Permitidos',
        type: 'array',
        default: ['plains', 'forest'],
        description: 'Lista de identificadores de biomas onde a entidade pode nascer (vazio = todos).',
      },
      deniedBiomes: {
        label: 'Biomas Proibidos',
        type: 'array',
        default: [],
        description: 'Lista de biomas estritamente proibidos para spawn.',
      },
      allowedBlocks: {
        label: 'Blocos / Pisos Permitidos',
        type: 'array',
        default: ['grass', 'dense_grass'],
        description: 'Lista de IDs de blocos/pisos permitidos para sustentar o spawn.',
      },
      deniedBlocks: {
        label: 'Blocos / Pisos Proibidos',
        type: 'array',
        default: ['water', 'deep_water'],
        description: 'Lista de blocos sobre os quais a entidade jamais pode surgir.',
      },
      allowedTags: {
        label: 'Tags de Bloco Permitidas',
        type: 'array',
        default: ['solid', 'natural_ground'],
        description: 'Tags que o bloco da superfície deve possuir para validar o spawn.',
      },
      deniedTags: {
        label: 'Tags de Bloco Proibidas',
        type: 'array',
        default: ['liquid'],
        description: 'Tags de bloco que impedem o nascimento.',
      },
      allowWater: {
        label: 'Permitir Spawn na Água',
        type: 'boolean',
        default: false,
        description: 'Se verdadeiro, permite nascimento em lagos e rios (ex: peixes).',
      },
      allowAir: {
        label: 'Permitir Spawn Aéreo',
        type: 'boolean',
        default: false,
        description: 'Se verdadeiro, permite nascimento no ar para criaturas voadoras.',
      },
      minCount: {
        label: 'Quantidade Mínima por Grupo',
        type: 'number',
        required: true,
        default: 1,
        min: 1,
        max: 20,
        description: 'Menor número de indivíduos gerados em uma tentativa bem-sucedida.',
      },
      maxCount: {
        label: 'Quantidade Máxima por Grupo',
        type: 'number',
        required: true,
        default: 3,
        min: 1,
        max: 50,
        description: 'Maior número de indivíduos gerados em uma tentativa bem-sucedida.',
      },
      maxNearby: {
        label: 'Limite Máximo na Região (Cap)',
        type: 'number',
        required: true,
        default: 8,
        min: 1,
        max: 100,
        description: 'Limite máximo de entidades deste tipo na vizinhança para evitar superpopulação.',
      },
      spawnRate: {
        label: 'Taxa / Intervalo de Tentativa (s)',
        type: 'number',
        required: true,
        default: 5.0,
        min: 0.5,
        max: 300,
        step: 0.5,
        description: 'Frequência em segundos com que o sistema tenta realizar um spawn.',
      },
      spawnChance: {
        label: 'Chance de Sucesso (0.0 a 1.0)',
        type: 'number',
        required: true,
        default: 0.25,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        description: 'Probabilidade (0.25 = 25%) de uma tentativa válida efetivamente gerar a criatura.',
      },
      minDistance: {
        label: 'Distância Mínima do Jogador (px)',
        type: 'number',
        required: true,
        default: 160,
        min: 0,
        max: 2000,
        description: 'Raio de exclusão em torno do jogador para impedir spawn em cima da câmera.',
      },
      maxDistance: {
        label: 'Distância Máxima do Jogador (px)',
        type: 'number',
        required: true,
        default: 550,
        min: 50,
        max: 3000,
        description: 'Raio externo máximo para manter o spawn dentro da simulação ativa.',
      },
    },
  },
];

export class EntitySchemaRegistry {
  private static readonly schemas = new Map<string, EntityComponentSchemaDefinition>();

  static {
    for (const schema of OFFICIAL_ENTITY_COMPONENT_SCHEMAS) {
      this.schemas.set(schema.type, schema);
      this.schemas.set(schema.type.toLowerCase(), schema);
    }
  }

  static getAllSchemas(): EntityComponentSchemaDefinition[] {
    return OFFICIAL_ENTITY_COMPONENT_SCHEMAS;
  }

  static getSchema(type: string): EntityComponentSchemaDefinition | undefined {
    return this.schemas.get(type) || this.schemas.get(type.toLowerCase());
  }

  static validateDefinition(def: EntityDefinitionJSON): EntityValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!def.id || def.id.trim() === '') {
      errors.push('O ID da entidade é obrigatório.');
    } else if (!/^[a-z0-9_]+$/.test(def.id)) {
      errors.push('O ID da entidade deve conter apenas letras minúsculas, números e sublinhados (_).');
    }

    if (!def.name || def.name.trim() === '') {
      errors.push('O Nome da entidade é obrigatório.');
    }

    if (!Array.isArray(def.components) || def.components.length === 0) {
      warnings.push('A entidade não possui nenhum componente registrado.');
    }

    const typeCounts = new Map<string, number>();
    for (const comp of def.components || []) {
      const type = comp.type;
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

      const schema = this.getSchema(type);
      if (schema && schema.isSingleton && (typeCounts.get(type) || 0) > 1) {
        errors.push(`Componente "${type}" é singleton e não pode ser duplicado.`);
      }
    }

    const hasStyle = def.components?.some((c) => c.type === 'StyleComponent');
    if (!hasStyle) {
      warnings.push('Adicione um StyleComponent para que a entidade possua representação visual (Emoji/SVG).');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
