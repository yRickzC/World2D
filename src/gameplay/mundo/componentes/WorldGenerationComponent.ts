import { IWorldComponent, WorldComponentSerializedData } from './WorldComponent';

export interface WorldGenerationData {
  terrainScale: number;
  foliageDensity: number;
  seaLevelThreshold: number; // e.g. 0.38
  beachThreshold: number; // e.g. 0.43
  forestThreshold: number; // e.g. 0.70
  enableCaves: boolean;
  spawnChunkRadius: number;
  worldType: 'infinite' | 'island' | 'flat';
}

export class WorldGenerationComponent implements IWorldComponent {
  readonly id: string;
  readonly type = 'WorldGenerationComponent';
  public data: WorldGenerationData;

  constructor(id: string = 'world_gen', data?: Partial<WorldGenerationData>) {
    this.id = id;
    this.data = {
      terrainScale: data?.terrainScale ?? 0.035,
      foliageDensity: data?.foliageDensity ?? 1.0,
      seaLevelThreshold: data?.seaLevelThreshold ?? 0.38,
      beachThreshold: data?.beachThreshold ?? 0.43,
      forestThreshold: data?.forestThreshold ?? 0.7,
      enableCaves: data?.enableCaves ?? true,
      spawnChunkRadius: data?.spawnChunkRadius ?? 3,
      worldType: data?.worldType ?? 'infinite',
    };
  }

  clone(): WorldGenerationComponent {
    return new WorldGenerationComponent(this.id, { ...this.data });
  }

  toJSON(): WorldComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: { ...this.data },
    };
  }
}
