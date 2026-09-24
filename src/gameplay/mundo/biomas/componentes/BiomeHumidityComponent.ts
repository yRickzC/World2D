import { IBiomeComponent, BiomeComponentSerializedData } from './BiomeComponent';

export interface BiomeHumidityData {
  min: number;
  max: number;
  base?: number;
}

export class BiomeHumidityComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Humidity';
  public data: BiomeHumidityData;

  constructor(id: string = 'biome_humidity', data?: Partial<BiomeHumidityData>) {
    this.id = id;
    this.data = {
      min: data?.min ?? 0.3,
      max: data?.max ?? 0.7,
      base: data?.base ?? ((data?.min ?? 0.3) + (data?.max ?? 0.7)) / 2,
    };
  }

  clone(): BiomeHumidityComponent {
    return new BiomeHumidityComponent(this.id, { ...this.data });
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: { ...this.data },
    };
  }
}
