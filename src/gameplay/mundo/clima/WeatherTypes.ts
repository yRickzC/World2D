/**
 * Types and interfaces for the extensible climate and weather system.
 */

export interface WeatherCondition {
  type: 'humidity_min' | 'temperature_range' | 'time_hour' | 'biome_allowed';
  params: Record<string, any>;
}

export interface WeatherEventComponentData {
  type: string;
  data: Record<string, any>;
}

export interface WeatherEventJSON {
  id: string;
  name: string;
  enabled: boolean;
  intensity: number; // 0.0 to 1.0
  durationMin: number; // in seconds
  durationMax: number; // in seconds
  chance: number; // 0.0 to 1.0 probability
  transitionDuration: number; // in seconds for fade in/out
  conditions?: WeatherCondition[];
  components?: WeatherEventComponentData[];
  customParams?: Record<string, any>;
}

export interface RainEventConfig extends WeatherEventJSON {
  particleCountMultiplier?: number;
  dropletSpeed?: number;
  dropletAngle?: number;
  playAmbianceSound?: boolean;
  visibilityReduction?: number; // 0 to 1
}

export interface FogEventConfig extends WeatherEventJSON {
  density: number; // 0.0 to 1.0
  startDistance: number;
  endDistance: number;
  color?: string; // hex or rgba
}

/**
 * Spatial region definition for local/regional overrides.
 */
export interface ClimateRegionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClimateRegionDefinition {
  id: string;
  name: string;
  area: ClimateRegionArea;
  tags?: string[];
  climateOverride: {
    rainChance?: number;
    rainIntensity?: number;
    fogDensity?: number;
    temperatureOffset?: number;
    humidityOffset?: number;
    forceRain?: boolean;
    forceFog?: boolean;
    activeEvents?: string[];
  };
}

/**
 * Resolved climate characteristics at a given coordinate in the world.
 */
export interface ResolvedClimate {
  rain: number; // 0.0 (clear) to 1.0 (heavy downpour)
  fog: number; // 0.0 (no fog) to 1.0 (dense fog)
  temperature: number; // in Celsius
  humidity: number; // 0.0 to 1.0
  wind: number; // 0.0 to 1.0
  activeEvents: string[];
  resolvedSource: 'local' | 'region' | 'biome' | 'world_global' | 'system_default';
  sourceName: string;
  biomeId: string;
  regionId?: string;
}
