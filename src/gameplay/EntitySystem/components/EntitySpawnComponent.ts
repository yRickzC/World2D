import { BaseEntityComponent } from './BaseEntityComponent';

export type TimeWindowMode = 'any' | 'day' | 'night' | 'custom';

export interface SpawnTimeRule {
  /**
   * Mode: 'any' (24h), 'day' (06:00 - 18:00), 'night' (18:00 - 06:00), or 'custom'
   */
  mode: TimeWindowMode;
  /**
   * Allowed periods: e.g. ["night"] or ["day"]
   */
  allowed?: string[];
  /**
   * Start time in "HH:MM" (e.g. "18:00") or decimal hours (18.0)
   */
  startTime?: string | number;
  /**
   * End time in "HH:MM" (e.g. "06:00") or decimal hours (6.0)
   */
  endTime?: string | number;
}

export interface EntitySpawnComponentData {
  enabled?: boolean;
  time?: {
    mode?: TimeWindowMode;
    allowed?: string[];
    startTime?: string | number;
    endTime?: string | number;
  };
  biomes?: {
    allowed?: string[];
    denied?: string[];
  };
  allowedBiomes?: string[];
  deniedBiomes?: string[];
  surface?: {
    allowedBlocks?: string[];
    deniedBlocks?: string[];
    allowedTags?: string[];
    deniedTags?: string[];
  };
  allowedBlocks?: string[];
  deniedBlocks?: string[];
  allowedTags?: string[];
  deniedTags?: string[];
  allowWater?: boolean;
  allowAir?: boolean;
  allowTrees?: boolean;
  quantity?: {
    min?: number;
    max?: number;
  };
  minCount?: number;
  maxCount?: number;
  maxNearby?: number;
  rate?: number;
  spawnRate?: number;
  chance?: number;
  spawnChance?: number;
  distance?: {
    min?: number;
    max?: number;
  };
  minDistance?: number;
  maxDistance?: number;
  weight?: number;
  customConditions?: string[];
}

/**
 * Parses time strings like "18:30" or numbers into decimal hours (0.0 to 24.0).
 */
export function parseHourValue(val: string | number | undefined, defaultVal: number): number {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') return Math.max(0, Math.min(24, val));
  if (typeof val === 'string') {
    const parts = val.trim().split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return (h % 24) + Math.max(0, Math.min(59, m)) / 60;
      }
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return Math.max(0, Math.min(24, parsed));
  }
  return defaultVal;
}

/**
 * Validates whether a current decimal hour (0.0 - 24.0) fits the defined time window,
 * correctly handling circular boundaries (e.g. 18:00 -> 06:00).
 */
export function isHourInWindow(hour: number, rule: SpawnTimeRule): boolean {
  const normHour = ((hour % 24) + 24) % 24;

  if (rule.mode === 'any') {
    return true;
  }

  if (rule.mode === 'day') {
    // 06:00 to 18:00
    return normHour >= 6.0 && normHour < 18.0;
  }

  if (rule.mode === 'night') {
    // 18:00 to 06:00
    return normHour >= 18.0 || normHour < 6.0;
  }

  if (rule.mode === 'custom') {
    const start = parseHourValue(rule.startTime, 0);
    const end = parseHourValue(rule.endTime, 24);

    if (start === end) {
      return true; // 24h cycle
    }

    if (start < end) {
      // Standard linear interval (e.g. 08:00 to 16:00)
      return normHour >= start && normHour < end;
    } else {
      // Circular wrap-around interval (e.g. 18:00 to 06:00)
      return normHour >= start || normHour < end;
    }
  }

  return true;
}

export class EntitySpawnComponent extends BaseEntityComponent {
  static readonly type = 'EntitySpawnComponent';
  readonly type = 'EntitySpawnComponent';

  // 0. Toggle
  public enabled: boolean = true;

  // 1. Time
  time: SpawnTimeRule;

  // 2. Biomes
  allowedBiomes: string[];
  deniedBiomes: string[];

  // 3. Surfaces & Blocks
  allowedBlocks: string[];
  deniedBlocks: string[];
  allowedTags: string[];
  deniedTags: string[];
  allowWater: boolean;
  allowAir: boolean;
  allowTrees: boolean;

  // 4. Quantity
  minCount: number;
  maxCount: number;
  maxNearby: number;

  // 5. Rate & Chance
  spawnRate: number; // Interval in seconds between evaluation checks
  spawnChance: number; // Probability between 0.0 and 1.0 (e.g. 0.25 = 25%)

  // 6. Player distance
  minDistance: number; // Min distance in world coordinates / pixels
  maxDistance: number; // Max distance in world coordinates / pixels

  // 7. Extensible attributes
  weight: number;
  customConditions: string[];

  constructor(data?: Partial<EntitySpawnComponentData>, id?: string) {
    super(id, 80, true);

    this.enabled = data?.enabled !== false;

    // Time parsing (supports nested time.mode or time.allowed array)
    const timeData = data?.time || {};
    let mode: TimeWindowMode = timeData.mode ?? 'any';
    const allowed = Array.isArray(timeData.allowed) ? [...timeData.allowed] : [];
    if (allowed.length > 0) {
      if (allowed.includes('night') && !allowed.includes('day')) {
        mode = 'night';
      } else if (allowed.includes('day') && !allowed.includes('night')) {
        mode = 'day';
      } else {
        mode = 'any';
      }
    }
    this.time = {
      mode,
      allowed: allowed.length > 0 ? allowed : [mode],
      startTime: timeData.startTime ?? (mode === 'night' ? '18:00' : mode === 'day' ? '06:00' : '00:00'),
      endTime: timeData.endTime ?? (mode === 'night' ? '06:00' : mode === 'day' ? '18:00' : '24:00'),
    };

    // Biomes (supports flat or biomes.allowed / biomes.denied)
    const biomesObj = data?.biomes;
    const allowedB = data?.allowedBiomes ?? biomesObj?.allowed;
    const deniedB = data?.deniedBiomes ?? biomesObj?.denied;
    this.allowedBiomes = Array.isArray(allowedB) ? [...allowedB] : [];
    this.deniedBiomes = Array.isArray(deniedB) ? [...deniedB] : [];

    // Surface / Blocks (supports flat or surface object)
    const surfObj = data?.surface;
    const allowedBlk = data?.allowedBlocks ?? surfObj?.allowedBlocks;
    const deniedBlk = data?.deniedBlocks ?? surfObj?.deniedBlocks;
    const allowedTg = data?.allowedTags ?? surfObj?.allowedTags;
    const deniedTg = data?.deniedTags ?? surfObj?.deniedTags;

    this.allowedBlocks = Array.isArray(allowedBlk) ? [...allowedBlk] : [];
    this.deniedBlocks = Array.isArray(deniedBlk) ? [...deniedBlk] : [];
    this.allowedTags = Array.isArray(allowedTg) ? [...allowedTg] : [];
    this.deniedTags = Array.isArray(deniedTg) ? [...deniedTg] : [];

    this.allowWater = Boolean(data?.allowWater ?? false);
    this.allowAir = Boolean(data?.allowAir ?? false);
    this.allowTrees = Boolean(data?.allowTrees ?? false);

    // Quantity (supports flat or quantity.min / quantity.max, defaults to small groups: 1-2)
    const qtyObj = data?.quantity;
    const rawMin = data?.minCount ?? qtyObj?.min ?? 1;
    const rawMax = data?.maxCount ?? qtyObj?.max ?? (rawMin === 1 ? 2 : rawMin);
    this.minCount = Math.max(1, rawMin);
    this.maxCount = Math.max(this.minCount, rawMax);
    this.maxNearby = Math.max(1, data?.maxNearby ?? 5);

    // Rate & Chance (supports rate/spawnRate and chance/spawnChance)
    const rawRate = data?.spawnRate ?? data?.rate ?? 15.0;
    const rawChance = data?.spawnChance ?? data?.chance ?? 0.2;
    this.spawnRate = Math.max(1.0, rawRate);
    this.spawnChance = Math.max(0, Math.min(1.0, rawChance));

    // Distance (supports flat or distance.min / distance.max)
    const distObj = data?.distance;
    let rawMinDist = data?.minDistance ?? distObj?.min ?? 180;
    let rawMaxDist = data?.maxDistance ?? distObj?.max ?? 600;

    // Adapt tile units to world pixels if <= 64 (e.g., min: 20 -> 240px, min: 12 -> 144px, max: 60 -> 720px, max: 50 -> 600px)
    if (rawMinDist > 0 && rawMinDist <= 64) {
      rawMinDist = rawMinDist * 12;
    }
    if (rawMaxDist > 0 && rawMaxDist <= 64) {
      rawMaxDist = rawMaxDist * 12;
    }

    this.minDistance = Math.max(0, rawMinDist);
    this.maxDistance = Math.max(this.minDistance + 10, rawMaxDist);

    this.weight = Math.max(1, data?.weight ?? 10);
    this.customConditions = Array.isArray(data?.customConditions) ? [...data!.customConditions] : [];
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Evaluates if the current world hour matches the time rule.
   * Hostile/monsters allowed only at night reject daytime immediately without compensation.
   */
  canSpawnAtTime(hour: number): boolean {
    if (!this.time) return true;
    if (this.time.allowed && this.time.allowed.length > 0) {
      const isDayHour = hour >= 6.0 && hour < 18.0;
      const isNightHour = !isDayHour;
      if (this.time.allowed.includes('night') && !this.time.allowed.includes('day') && isDayHour) {
        return false;
      }
      if (this.time.allowed.includes('day') && !this.time.allowed.includes('night') && isNightHour) {
        return false;
      }
    }
    if (this.time.mode === 'any') return true;
    return isHourInWindow(hour, this.time);
  }

  /**
   * Evaluates if the target biome is permitted according to whitelist and blacklist.
   * If allowedBiomes is empty, any biome (except denied) is permitted (Rule 4).
   */
  canSpawnInBiome(biomeId: string): boolean {
    const cleanBiome = biomeId.toLowerCase().trim();

    if (this.deniedBiomes.length > 0) {
      const isDenied = this.deniedBiomes.some(
        (b) => b.toLowerCase().trim() === cleanBiome
      );
      if (isDenied) return false;
    }

    if (this.allowedBiomes.length > 0) {
      const isAllowed = this.allowedBiomes.some(
        (b) => b.toLowerCase().trim() === cleanBiome
      );
      if (!isAllowed) return false;
    }

    return true;
  }

  /**
   * Evaluates if the surface block and its tags are suitable for spawning.
   * If neither allowedBlocks nor allowedTags is configured, standard solid ground is allowed (Rule 4).
   */
  canSpawnOnSurface(blockId: string, blockTags: string[] = [], isWater: boolean = false): boolean {
    const cleanBlockId = blockId.toLowerCase().trim();
    const cleanTags = blockTags.map((t) => t.toLowerCase().trim());

    if (isWater && !this.allowWater) {
      return false;
    }

    // Denied blocks
    if (this.deniedBlocks.length > 0) {
      const isDenied = this.deniedBlocks.some(
        (b) => b.toLowerCase().trim() === cleanBlockId
      );
      if (isDenied) return false;
    }

    // Denied tags
    if (this.deniedTags.length > 0) {
      const hasDeniedTag = this.deniedTags.some((tag) =>
        cleanTags.includes(tag.toLowerCase().trim())
      );
      if (hasDeniedTag) return false;
    }

    // If both whitelist rules are empty, standard surface is permitted
    if (this.allowedBlocks.length === 0 && this.allowedTags.length === 0) {
      return true;
    }

    // If either whitelist is defined, match if blockId matches OR any tag matches
    const blockMatches = this.allowedBlocks.length > 0 && this.allowedBlocks.some(
      (b) => b.toLowerCase().trim() === cleanBlockId
    );

    const tagMatches = this.allowedTags.length > 0 && this.allowedTags.some((tag) =>
      cleanTags.includes(tag.toLowerCase().trim())
    );

    if (this.allowedBlocks.length > 0 && this.allowedTags.length > 0) {
      return blockMatches || tagMatches;
    }

    if (this.allowedBlocks.length > 0) return blockMatches;
    if (this.allowedTags.length > 0) return tagMatches;

    return true;
  }

  /**
   * Evaluates if a distance from player is inside the valid range.
   */
  canSpawnAtDistance(distance: number): boolean {
    return distance >= this.minDistance && distance <= this.maxDistance;
  }

  /**
   * Generates a randomized quantity of entities to spawn in this attempt.
   */
  rollSpawnCount(): number {
    return Math.floor(Math.random() * (this.maxCount - this.minCount + 1)) + this.minCount;
  }

  /**
   * Rolls probability against `spawnChance`.
   */
  rollSpawnChance(): boolean {
    return Math.random() <= this.spawnChance;
  }

  get data(): Record<string, any> {
    return {
      enabled: this.enabled,
      time: { ...this.time },
      allowedBiomes: [...this.allowedBiomes],
      deniedBiomes: [...this.deniedBiomes],
      allowedBlocks: [...this.allowedBlocks],
      deniedBlocks: [...this.deniedBlocks],
      allowedTags: [...this.allowedTags],
      deniedTags: [...this.deniedTags],
      allowWater: this.allowWater,
      allowAir: this.allowAir,
      allowTrees: this.allowTrees,
      minCount: this.minCount,
      maxCount: this.maxCount,
      maxNearby: this.maxNearby,
      spawnRate: this.spawnRate,
      spawnChance: this.spawnChance,
      minDistance: this.minDistance,
      maxDistance: this.maxDistance,
      weight: this.weight,
      customConditions: [...this.customConditions],
    };
  }
}
