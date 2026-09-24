import { IWorldComponent, WorldComponentSerializedData } from './WorldComponent';
import { RainEventConfig, FogEventConfig, WeatherEventJSON } from '../clima/WeatherTypes';

export interface WorldClimateData {
  rain: RainEventConfig;
  fog: FogEventConfig;
  customEvents?: WeatherEventJSON[];
  baseTemperature: number; // default 22°C
  baseHumidity: number; // default 0.5 (50%)
  globalWind: number; // 0.1 to 1.0
  cycleIntervalSeconds: number; // how often weather checks roll
}

export class WorldClimateComponent implements IWorldComponent {
  readonly id: string;
  readonly type = 'WorldClimateComponent';
  public data: WorldClimateData;

  constructor(id: string = 'world_climate', data?: Partial<WorldClimateData>) {
    this.id = id;
    this.data = {
      rain: {
        id: 'rain',
        name: 'Chuva',
        enabled: true,
        intensity: 0.5,
        durationMin: 45,
        durationMax: 120,
        chance: 0.20,
        transitionDuration: 8,
        particleCountMultiplier: 1.0,
        dropletSpeed: 600,
        playAmbianceSound: true,
        visibilityReduction: 0.15,
        ...(data?.rain || {}),
      },
      fog: {
        id: 'fog',
        name: 'Neblina',
        enabled: true,
        intensity: 0.35,
        density: 0.35,
        startDistance: 10,
        endDistance: 80,
        durationMin: 60,
        durationMax: 180,
        chance: 0.15,
        transitionDuration: 12,
        color: '#94a3b8',
        ...(data?.fog || {}),
      },
      customEvents: data?.customEvents ? [...data.customEvents] : [],
      baseTemperature: data?.baseTemperature ?? 22,
      baseHumidity: data?.baseHumidity ?? 0.5,
      globalWind: data?.globalWind ?? 0.2,
      cycleIntervalSeconds: data?.cycleIntervalSeconds ?? 30,
    };
  }

  clone(): WorldClimateComponent {
    return new WorldClimateComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): WorldComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
