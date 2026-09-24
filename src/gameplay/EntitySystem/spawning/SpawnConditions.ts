import { EntitySpawnComponent } from '../components/EntitySpawnComponent';

export interface SpawnContext {
  timeHour: number; // 0.0 to 24.0
  timeOfDay?: 'day' | 'sunset' | 'night' | 'dawn';
  biome: string;
  tileType: string;
  surfaceBlockId?: string | null;
  surfaceBlockTags?: string[];
  isWater: boolean;
  isSolid: boolean;
  hasObstacle: boolean;
  playerDistance: number;
  playerPos: { x: number; y: number };
  candidatePos: { x: number; y: number };
  currentNearbyCount: number;
  worldData?: Record<string, any>;
}

export interface ConditionEvaluationResult {
  passed: boolean;
  conditionId: string;
  reason?: string;
}

/**
 * Base interface for extensible modular spawn conditions.
 */
export interface ISpawnCondition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  evaluate(ctx: SpawnContext, comp: EntitySpawnComponent): ConditionEvaluationResult;
}

/**
 * Validates time of day and circular time windows (e.g. 18:00 -> 06:00).
 */
export class TimeSpawnCondition implements ISpawnCondition {
  readonly id = 'time_condition';
  readonly name = 'Condição de Horário';
  readonly description = 'Verifica se o horário do mundo atende aos períodos permitidos pela entidade.';

  evaluate(ctx: SpawnContext, comp: EntitySpawnComponent): ConditionEvaluationResult {
    const passed = comp.canSpawnAtTime(ctx.timeHour);
    return {
      passed,
      conditionId: this.id,
      reason: passed
        ? undefined
        : `Horário ${ctx.timeHour.toFixed(1)}h fora do período permitido (${comp.time.mode}).`,
    };
  }
}

/**
 * Validates biomes according to allowedBiomes and deniedBiomes lists.
 */
export class BiomeSpawnCondition implements ISpawnCondition {
  readonly id = 'biome_condition';
  readonly name = 'Condição de Bioma';
  readonly description = 'Verifica se o bioma atual é permitido e não consta na lista de exclusões.';

  evaluate(ctx: SpawnContext, comp: EntitySpawnComponent): ConditionEvaluationResult {
    const passed = comp.canSpawnInBiome(ctx.biome);
    return {
      passed,
      conditionId: this.id,
      reason: passed
        ? undefined
        : `Bioma "${ctx.biome}" não permitido para spawn desta entidade.`,
    };
  }
}

/**
 * Validates surface type, block IDs, block tags, and liquid constraints.
 */
export class SurfaceSpawnCondition implements ISpawnCondition {
  readonly id = 'surface_condition';
  readonly name = 'Condição de Superfície e Bloco';
  readonly description = 'Valida o bloco de suporte, tags de bloco e integridade do piso.';

  evaluate(ctx: SpawnContext, comp: EntitySpawnComponent): ConditionEvaluationResult {
    // 1. Water check
    if (ctx.isWater && !comp.allowWater) {
      return {
        passed: false,
        conditionId: this.id,
        reason: 'Spawn aquático não permitido para esta entidade terrestre.',
      };
    }

    // 2. Obstacle check (solid walls, elevated blocks)
    if (ctx.hasObstacle && !comp.allowAir) {
      return {
        passed: false,
        conditionId: this.id,
        reason: 'Posição obstruída por bloco sólido superior ou tronco.',
      };
    }

    // 3. Surface block ID & tags check
    const surfaceId = ctx.surfaceBlockId || ctx.tileType;
    const surfaceTags = ctx.surfaceBlockTags || [];

    const passed = comp.canSpawnOnSurface(surfaceId, surfaceTags, ctx.isWater);
    return {
      passed,
      conditionId: this.id,
      reason: passed
        ? undefined
        : `Superfície "${surfaceId}" ou tags [${surfaceTags.join(', ')}] inválidas para spawn.`,
    };
  }
}

/**
 * Validates min and max distances from the player to avoid spawning on top of the player
 * or outside loaded simulation boundaries.
 */
export class DistanceSpawnCondition implements ISpawnCondition {
  readonly id = 'distance_condition';
  readonly name = 'Condição de Distância do Jogador';
  readonly description = 'Garante que o spawn ocorra em um anel seguro de distância do jogador.';

  evaluate(ctx: SpawnContext, comp: EntitySpawnComponent): ConditionEvaluationResult {
    const passed = comp.canSpawnAtDistance(ctx.playerDistance);
    return {
      passed,
      conditionId: this.id,
      reason: passed
        ? undefined
        : `Distância ${Math.round(ctx.playerDistance)}px fora do intervalo [${comp.minDistance}px .. ${comp.maxDistance}px].`,
    };
  }
}

/**
 * Validates that the entity density or nearby population has not reached maxNearby cap.
 */
export class QuantitySpawnCondition implements ISpawnCondition {
  readonly id = 'quantity_condition';
  readonly name = 'Condição de Quantidade e Lotação';
  readonly description = 'Impede superpopulação verificando o limite de entidades próximas (maxNearby).';

  evaluate(ctx: SpawnContext, comp: EntitySpawnComponent): ConditionEvaluationResult {
    const passed = ctx.currentNearbyCount < comp.maxNearby;
    return {
      passed,
      conditionId: this.id,
      reason: passed
        ? undefined
        : `Limite de entidades próximas atingido (${ctx.currentNearbyCount}/${comp.maxNearby}).`,
    };
  }
}

/**
 * Pipeline for evaluating modular conditions and registering future custom conditions.
 */
export class SpawnConditionEvaluator {
  private static readonly conditions: Map<string, ISpawnCondition> = new Map();

  static {
    this.register(new TimeSpawnCondition());
    this.register(new BiomeSpawnCondition());
    this.register(new SurfaceSpawnCondition());
    this.register(new DistanceSpawnCondition());
    this.register(new QuantitySpawnCondition());
  }

  static register(condition: ISpawnCondition) {
    this.conditions.set(condition.id, condition);
  }

  static getCondition(id: string): ISpawnCondition | undefined {
    return this.conditions.get(id);
  }

  static getAllConditions(): ISpawnCondition[] {
    return Array.from(this.conditions.values());
  }

  /**
   * Evaluates all registered conditions for a given context and entity spawn component.
   * Returns whether all conditions passed, along with any failure reasons.
   */
  static evaluate(
    ctx: SpawnContext,
    comp: EntitySpawnComponent
  ): {
    canSpawn: boolean;
    failedResults: ConditionEvaluationResult[];
    passedResults: ConditionEvaluationResult[];
  } {
    const failedResults: ConditionEvaluationResult[] = [];
    const passedResults: ConditionEvaluationResult[] = [];

    for (const condition of this.conditions.values()) {
      const res = condition.evaluate(ctx, comp);
      if (!res.passed) {
        failedResults.push(res);
      } else {
        passedResults.push(res);
      }
    }

    return {
      canSpawn: failedResults.length === 0,
      failedResults,
      passedResults,
    };
  }
}
