import { TILE_SIZE } from '../../../core/configuracao/constants';
import { Player } from '../../../core/configuracao/types';
import { ChunkManager } from '../../mundo/chunks/ChunkManager';
import { BiomeResolver } from '../../mundo/BiomeResolver';
import { BlockDatabase } from '../../blocos/BlockDatabase';
import { EntityDatabase } from '../EntityDB';
import { EntityDefinition } from '../EntityDefinition';
import { EntitySpawnComponent } from '../components/EntitySpawnComponent';
import {
  ConditionEvaluationResult,
  SpawnConditionEvaluator,
  SpawnContext,
} from './SpawnConditions';

export interface SpawnAttemptReport {
  timestamp: number;
  entityId: string;
  entityName: string;
  candidatePosition: { x: number; y: number };
  playerDistance: number;
  biome: string;
  tile: string;
  timeHour: number;
  nearbyCount: number;
  conditionsPassed: boolean;
  chancePassed: boolean;
  spawnedCount: number;
  failedReason?: string;
  detailedResults: ConditionEvaluationResult[];
}

export interface ActiveSpawnEvent {
  entityDef: EntityDefinition;
  x: number;
  y: number;
  count: number;
}

export type SpawnListener = (event: ActiveSpawnEvent) => void;

export const DEBUG_SPAWN = true;

// Expose debug controls on window for testing
if (typeof window !== 'undefined') {
  (window as any).__DEBUG_SPAWN__ = DEBUG_SPAWN;
}

export class EntitySpawnerSystem {
  private static instance: EntitySpawnerSystem | null = null;
  private spawnCooldowns: Map<string, number> = new Map();
  private recentReports: SpawnAttemptReport[] = [];
  private listeners: Set<SpawnListener> = new Set();
  private isEnabled: boolean = true;

  static getInstance(): EntitySpawnerSystem {
    if (!this.instance) {
      this.instance = new EntitySpawnerSystem();
      if (typeof window !== 'undefined') {
        (window as any).__SPAWNER_SYSTEM__ = this.instance;
      }
    }
    return this.instance;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isSpawnerEnabled(): boolean {
    return this.isEnabled;
  }

  addListener(listener: SpawnListener) {
    this.listeners.add(listener);
  }

  removeListener(listener: SpawnListener) {
    this.listeners.delete(listener);
  }

  getRecentReports(): SpawnAttemptReport[] {
    return [...this.recentReports];
  }

  clearReports() {
    this.recentReports = [];
  }

  /**
   * Main runtime update tick called from the game loop.
   */
  update(
    dt: number,
    player: Player,
    chunkManager: ChunkManager,
    worldHour: number,
    currentLivingEntities: Array<{ id: string; type: string; x: number; y: number }> = []
  ) {
    if (!this.isEnabled) return;

    const allDefs = EntityDatabase.getAll();

    for (const def of allDefs) {
      // Look up spawn component flexibly
      const spawnComp: EntitySpawnComponent | null =
        (def as any).getSpawnComponent?.() ||
        def.getComponent<EntitySpawnComponent>('EntitySpawnComponent') ||
        def.getComponent<EntitySpawnComponent>('EntitySpawn');

      if (!spawnComp) continue;

      if (spawnComp.isEnabled && !spawnComp.isEnabled()) {
        continue;
      }

      // Update cooldown timer
      const currentCd = (this.spawnCooldowns.get(def.id) || 0) - dt;
      if (currentCd > 0) {
        this.spawnCooldowns.set(def.id, currentCd);
        continue;
      }

      // Reset cooldown based on spawnRate
      this.spawnCooldowns.set(def.id, spawnComp.spawnRate);

      // Attempt spawn
      this.attemptSpawn(def, spawnComp, player, chunkManager, worldHour, currentLivingEntities);
    }
  }

  /**
   * Executes a single spawn cycle for a specific entity definition.
   */
  attemptSpawn(
    def: EntityDefinition,
    spawnComp: EntitySpawnComponent,
    player: Player,
    chunkManager: ChunkManager,
    worldHour: number,
    currentLivingEntities: Array<{ id: string; type: string; x: number; y: number }> = []
  ): SpawnAttemptReport | null {
    const isDebug = typeof window !== 'undefined' ? (window as any).__DEBUG_SPAWN__ !== false : DEBUG_SPAWN;
    const timeOfDay = worldHour >= 6 && worldHour < 18 ? 'Day' : 'Night';

    // 1. Validate time first (monsters blocked during day, animals blocked during night)
    if (!spawnComp.canSpawnAtTime(worldHour)) {
      if (isDebug) {
        console.log(`[Spawn]\nEntity: ${def.name}\nTime: ${timeOfDay}\nResult: rejected`);
      }
      return null;
    }

    // 2. Early population cap check around player
    const nearbyCountAroundPlayer = currentLivingEntities.filter((e) => {
      if (e.type !== def.id) return false;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      return d <= spawnComp.maxDistance;
    }).length;

    if (nearbyCountAroundPlayer >= spawnComp.maxNearby) {
      if (isDebug) {
        console.log(`[Spawn]\nEntity: ${def.name}\nNearby: ${nearbyCountAroundPlayer}/${spawnComp.maxNearby}\nResult: rejected`);
      }
      return null;
    }

    // 3. Candidate position search - try up to 8 candidate spots in the ring
    let bestCandidate: {
      cx: number;
      cy: number;
      distance: number;
      tileType: string;
      biome: string;
      surfaceBlockId: string | null;
      surfaceBlockTags: string[];
      isWater: boolean;
      hasObstacle: boolean;
    } | null = null;

    const attempts = 8;
    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance =
        spawnComp.minDistance + Math.random() * (spawnComp.maxDistance - spawnComp.minDistance);
      const cx = player.x + Math.cos(angle) * distance;
      const cy = player.y + Math.sin(angle) * distance;

      const tx = Math.floor(cx / TILE_SIZE);
      const ty = Math.floor(cy / TILE_SIZE);

      const tileType = chunkManager.getTile(tx, ty);
      const layer = chunkManager.getTileLayer(tx, ty);
      const biome = BiomeResolver.resolveBiomeId(tileType);

      // Check biome permission
      if (!spawnComp.canSpawnInBiome(biome)) {
        continue;
      }

      const isWater = tileType === 'water' || tileType === 'deep_water';
      const hasElevatedBlock = Boolean(layer.upperLayers && layer.upperLayers.length > 0);
      const surfaceBlockId =
        layer.groundBlock || (hasElevatedBlock ? layer.upperLayers[layer.upperLayers.length - 1] : null);

      let surfaceBlockTags: string[] = [];
      if (surfaceBlockId) {
        const blockDef = BlockDatabase.get(surfaceBlockId);
        if (blockDef) {
          surfaceBlockTags = blockDef.getTags();
        }
      } else {
        if (tileType === 'grass' || tileType === 'dense_grass') {
          surfaceBlockTags = ['grass', 'natural_ground', 'solid', 'surface'];
        } else if (tileType === 'sand') {
          surfaceBlockTags = ['sand', 'natural_ground', 'solid', 'arid'];
        } else if (tileType === 'water' || tileType === 'deep_water') {
          surfaceBlockTags = ['liquid', 'water'];
        } else {
          surfaceBlockTags = ['solid'];
        }
      }

      const hasObstacle = hasElevatedBlock || (!isWater && chunkManager.isSolid(cx, cy, 10));

      if (!spawnComp.allowAir && hasObstacle) {
        continue;
      }

      if (isWater && !spawnComp.allowWater) {
        continue;
      }

      // Found a valid candidate spot!
      bestCandidate = {
        cx,
        cy,
        distance,
        tileType,
        biome,
        surfaceBlockId,
        surfaceBlockTags,
        isWater,
        hasObstacle,
      };
      break;
    }

    if (!bestCandidate) {
      if (isDebug) {
        console.log(`[Spawn] Entity: ${def.name} | Result: rejected (no valid position)`);
      }
      return null;
    }

    const {
      cx,
      cy,
      distance,
      tileType,
      biome,
      surfaceBlockId,
      surfaceBlockTags,
      isWater,
      hasObstacle,
    } = bestCandidate;

    // 4. Count existing entities of this type within maxDistance radius of candidate spot
    const nearbyCount = currentLivingEntities.filter((e) => {
      if (e.type !== def.id) return false;
      const d = Math.hypot(e.x - cx, e.y - cy);
      return d <= spawnComp.maxDistance;
    }).length;

    if (nearbyCount >= spawnComp.maxNearby) {
      if (isDebug) {
        console.log(`[Spawn]\nEntity: ${def.name}\nNearby: ${nearbyCount}/${spawnComp.maxNearby}\nResult: rejected`);
      }
      return null;
    }

    // 5. Assemble spawn evaluation context
    const ctx: SpawnContext = {
      timeHour: worldHour,
      timeOfDay: worldHour >= 6 && worldHour < 18 ? 'day' : 'night',
      biome,
      tileType,
      surfaceBlockId,
      surfaceBlockTags,
      isWater,
      isSolid: !isWater && !hasObstacle,
      hasObstacle,
      playerDistance: distance,
      playerPos: { x: player.x, y: player.y },
      candidatePos: { x: cx, y: cy },
      currentNearbyCount: nearbyCount,
    };

    // 6. Evaluate all modular conditions
    const evalResult = SpawnConditionEvaluator.evaluate(ctx, spawnComp);

    let chancePassed = false;
    let spawnedCount = 0;

    if (evalResult.canSpawn) {
      chancePassed = spawnComp.rollSpawnChance();
      if (!chancePassed) {
        if (isDebug) {
          console.log(`[Spawn]\nEntity: ${def.name}\nTime: ${timeOfDay}\nChance: ${spawnComp.spawnChance.toFixed(2)}\nResult: rejected`);
        }
      } else {
        spawnedCount = spawnComp.rollSpawnCount();

        if (isDebug) {
          console.log(`[Spawn]\nEntity: ${def.name}\nTime: ${timeOfDay}\nChance: ${spawnComp.spawnChance.toFixed(2)}\nSpawned: ${spawnedCount}\nResult: approved`);
        }

        // Trigger spawn listeners
        const event: ActiveSpawnEvent = {
          entityDef: def,
          x: cx,
          y: cy,
          count: spawnedCount,
        };
        for (const listener of this.listeners) {
          try {
            listener(event);
          } catch (err) {
            console.error('[EntitySpawnerSystem] Error in spawn listener:', err);
          }
        }
      }
    } else {
      if (isDebug) {
        console.log(`[Spawn] Condição falhou para ${def.name}:`, evalResult.failedResults[0]?.reason);
      }
    }

    const report: SpawnAttemptReport = {
      timestamp: Date.now(),
      entityId: def.id,
      entityName: def.name,
      candidatePosition: { x: Math.round(cx), y: Math.round(cy) },
      playerDistance: Math.round(distance),
      biome,
      tile: tileType,
      timeHour: Math.round(worldHour * 10) / 10,
      nearbyCount,
      conditionsPassed: evalResult.canSpawn,
      chancePassed,
      spawnedCount,
      failedReason: evalResult.failedResults[0]?.reason,
      detailedResults: [...evalResult.failedResults, ...evalResult.passedResults],
    };

    this.recentReports.unshift(report);
    if (this.recentReports.length > 50) {
      this.recentReports.pop();
    }

    return report;
  }
}
