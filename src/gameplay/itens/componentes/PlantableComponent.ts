import { ItemComponent } from './ItemComponent';

export interface PlantableComponentConfig {
  targetTileTags: string[]; // e.g. ['soil', 'grass', 'plantable']
  entityTypeToSpawn: 'tall_grass' | 'flower' | 'bush' | string;
  growthTimeSeconds?: number;
}

export class PlantableComponent extends ItemComponent {
  static readonly type = 'plantable';
  readonly type = 'plantable';

  readonly targetTileTags: string[];
  readonly entityTypeToSpawn: string;
  readonly growthTimeSeconds: number;

  constructor(config: PlantableComponentConfig) {
    super();
    this.targetTileTags = config.targetTileTags;
    this.entityTypeToSpawn = config.entityTypeToSpawn;
    this.growthTimeSeconds = config.growthTimeSeconds ?? 30;
  }

  canPlantOn(tileTags: string[] | Set<string>): boolean {
    const tagSet = tileTags instanceof Set ? tileTags : new Set(tileTags);
    return this.targetTileTags.some((tag) => tagSet.has(tag));
  }
}
