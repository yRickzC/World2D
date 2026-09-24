import { IBiomeComponent, BiomeComponentSerializedData } from './BiomeComponent';

export interface BiomeClimateOverrideData {
  rainChance?: number; // 0 to 1 (overrides world global rain chance for this biome)
  rainIntensity?: number; // 0 to 1
  fogDensity?: number; // 0 to 1
  fogChance?: number; // 0 to 1
  fogColor?: string;
  forceRain?: boolean;
  forceFog?: boolean;
  blockRain?: boolean; // e.g. desert or caves
  blockFog?: boolean;
  windMultiplier?: number;
}

export class BiomeClimateOverrideComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Climate';
  public data: BiomeClimateOverrideData;

  constructor(id: string = 'biome_climate', data?: Partial<BiomeClimateOverrideData>) {
    this.id = id;
    this.data = {
      rainChance: data?.rainChance,
      rainIntensity: data?.rainIntensity,
      fogDensity: data?.fogDensity,
      fogChance: data?.fogChance,
      fogColor: data?.fogColor,
      forceRain: data?.forceRain,
      forceFog: data?.forceFog,
      blockRain: data?.blockRain,
      blockFog: data?.blockFog,
      windMultiplier: data?.windMultiplier ?? 1.0,
    };
  }

  clone(): BiomeClimateOverrideComponent {
    return new BiomeClimateOverrideComponent(this.id, { ...this.data });
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: { ...this.data },
    };
  }
}
