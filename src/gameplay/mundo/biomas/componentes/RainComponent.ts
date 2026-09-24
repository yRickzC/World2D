import { BiomeComponentSerializedData, IBiomeComponent } from './BiomeComponent';

export type WeatherRainType = 'normal' | 'heavy' | 'drizzle' | 'storm';

export interface RainComponentData {
  enabled: boolean;
  chance: number; // 0.0 to 1.0 (e.g. 0.35)
  intensity: number; // 0.0 to 1.0 (e.g. 0.5)
  duration: {
    min: number; // seconds (e.g. 30)
    max: number; // seconds (e.g. 120)
  };
  frequency: {
    min: number; // seconds (e.g. 60)
    max: number; // seconds (e.g. 180)
  };
  weatherType: WeatherRainType;
  conditions?: Record<string, any>;
}

export class RainComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Rain';
  public data: RainComponentData;

  constructor(id: string = 'rain', initialData?: Partial<RainComponentData>) {
    this.id = id;
    this.data = {
      enabled: initialData?.enabled ?? true,
      chance: initialData?.chance ?? 0.35,
      intensity: initialData?.intensity ?? 0.5,
      duration: initialData?.duration ?? { min: 30, max: 120 },
      frequency: initialData?.frequency ?? { min: 60, max: 180 },
      weatherType: initialData?.weatherType ?? 'normal',
      conditions: initialData?.conditions ? { ...initialData.conditions } : undefined,
    };
  }

  get enabled(): boolean {
    return this.data.enabled;
  }
  set enabled(v: boolean) {
    this.data.enabled = v;
  }

  get chance(): number {
    return this.data.chance;
  }
  set chance(v: number) {
    this.data.chance = Math.max(0, Math.min(1, v));
  }

  get intensity(): number {
    return this.data.intensity;
  }
  set intensity(v: number) {
    this.data.intensity = Math.max(0, Math.min(1, v));
  }

  get weatherType(): WeatherRainType {
    return this.data.weatherType;
  }
  set weatherType(v: WeatherRainType) {
    this.data.weatherType = v;
  }

  clone(): RainComponent {
    return new RainComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
