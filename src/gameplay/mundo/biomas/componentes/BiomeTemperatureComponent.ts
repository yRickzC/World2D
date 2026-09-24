import { IBiomeComponent, BiomeComponentSerializedData } from './BiomeComponent';

export interface BiomeTemperatureData {
  min: number;
  max: number;
  base?: number;
}

export class BiomeTemperatureComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Temperature';
  public data: BiomeTemperatureData;

  constructor(id: string = 'biome_temp', data?: Partial<BiomeTemperatureData>) {
    this.id = id;
    this.data = {
      min: data?.min ?? 18,
      max: data?.max ?? 28,
      base: data?.base ?? ((data?.min ?? 18) + (data?.max ?? 28)) / 2,
    };
  }

  clone(): BiomeTemperatureComponent {
    return new BiomeTemperatureComponent(this.id, { ...this.data });
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: { ...this.data },
    };
  }
}
