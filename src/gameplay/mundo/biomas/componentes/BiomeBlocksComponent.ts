import { IBiomeComponent, BiomeComponentSerializedData } from './BiomeComponent';

export interface BiomeLayerConfig {
  block: string;
  depth?: number;
  chance?: number;
}

export interface BiomeBlocksData {
  surface: BiomeLayerConfig;
  soil: BiomeLayerConfig;
  underground: BiomeLayerConfig;
  water?: BiomeLayerConfig;
  beach?: BiomeLayerConfig;
  substitutions?: Record<string, string>; // e.g. "dirt" -> "clay"
}

export class BiomeBlocksComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'BiomeBlocks';
  public data: BiomeBlocksData;

  constructor(id: string = 'biome_blocks', data?: Partial<BiomeBlocksData>) {
    this.id = id;
    this.data = {
      surface: data?.surface ? { ...data.surface } : { block: 'grass', depth: 1 },
      soil: data?.soil ? { ...data.soil } : { block: 'dirt', depth: 3 },
      underground: data?.underground ? { ...data.underground } : { block: 'stone' },
      water: data?.water ? { ...data.water } : { block: 'water' },
      beach: data?.beach ? { ...data.beach } : { block: 'sand', depth: 2 },
      substitutions: data?.substitutions ? { ...data.substitutions } : {},
    };
  }

  clone(): BiomeBlocksComponent {
    return new BiomeBlocksComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
