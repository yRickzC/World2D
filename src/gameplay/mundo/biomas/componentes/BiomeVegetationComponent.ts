import { IBiomeComponent, BiomeComponentSerializedData } from './BiomeComponent';

export interface VegetationEntry {
  id: string; // e.g. 'tree_oak', 'tree_pine', 'bush', 'flower', 'tall_grass', 'rock'
  chance: number; // 0.0 to 1.0
  density?: number; // density in tiles
  variantMin?: number;
  variantMax?: number;
  conditions?: Record<string, any>;
}

export interface BiomeVegetationData {
  entries: VegetationEntry[];
}

export class BiomeVegetationComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Vegetation';
  public data: BiomeVegetationData;

  constructor(id: string = 'biome_vegetation', data?: Partial<BiomeVegetationData>) {
    this.id = id;
    this.data = {
      entries: data?.entries ? JSON.parse(JSON.stringify(data.entries)) : [],
    };
  }

  clone(): BiomeVegetationComponent {
    return new BiomeVegetationComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
