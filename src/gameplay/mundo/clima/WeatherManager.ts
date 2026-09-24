import {
  ClimateRegionDefinition,
  ResolvedClimate,
} from './WeatherTypes';
import { WeatherEvent } from './WeatherEvent';
import { WorldClimateComponent } from '../componentes/WorldClimateComponent';
import { WorldRegionComponent } from '../componentes/WorldRegionComponent';
import { globalBiomeRegistry } from '../biomas/BiomeRegistry';
import { BiomeClimateOverrideComponent } from '../biomas/componentes/BiomeClimateOverrideComponent';
import { BiomeTemperatureComponent } from '../biomas/componentes/BiomeTemperatureComponent';
import { BiomeHumidityComponent } from '../biomas/componentes/BiomeHumidityComponent';
import { RainComponent } from '../biomas/componentes/RainComponent';
import { FogComponent } from '../biomas/componentes/FogComponent';
import { Surface } from '../superficie/Surface';
import { BiomeResolver } from '../BiomeResolver';

export class WeatherManager {
  private worldClimate?: WorldClimateComponent;
  private worldRegions?: WorldRegionComponent;
  private currentSurface?: Surface;

  // Active Weather Events
  private events: Map<string, WeatherEvent> = new Map();

  // Cycle check timer
  private cycleTimer: number = 0;
  private cycleInterval: number = 30; // seconds between weather rolls

  // Local overrides map: key "x,y" or custom point override
  private localOverrides: Map<string, Partial<ResolvedClimate>> = new Map();

  // Cached player's resolved climate
  private currentPlayerClimate: ResolvedClimate;

  constructor(
    worldClimate?: WorldClimateComponent,
    worldRegions?: WorldRegionComponent,
    surface?: Surface
  ) {
    this.currentSurface = surface;
    this.worldClimate = worldClimate || surface?.getComponent<WorldClimateComponent>('WorldClimateComponent');
    this.worldRegions = worldRegions || surface?.getComponent<WorldRegionComponent>('WorldRegionComponent');
    this.initEvents();
    this.currentPlayerClimate = this.getClimateAt(0, 0);
  }

  setSurface(surface: Surface): void {
    this.currentSurface = surface;
    this.worldClimate = surface.getComponent<WorldClimateComponent>('WorldClimateComponent');
    this.worldRegions = surface.getComponent<WorldRegionComponent>('WorldRegionComponent');
    this.initEvents();
  }

  setWorldComponents(
    worldClimate?: WorldClimateComponent,
    worldRegions?: WorldRegionComponent
  ): void {
    this.worldClimate = worldClimate;
    this.worldRegions = worldRegions;
    this.initEvents();
  }

  private initEvents(): void {
    const rainConfig = this.worldClimate?.data.rain;
    const fogConfig = this.worldClimate?.data.fog;

    this.events.set(
      'rain',
      new WeatherEvent(
        rainConfig || {
          id: 'rain',
          name: 'Chuva',
          enabled: true,
          intensity: 0.5,
          durationMin: 45,
          durationMax: 120,
          chance: 0.2,
          transitionDuration: 8,
        }
      )
    );

    this.events.set(
      'fog',
      new WeatherEvent(
        fogConfig || {
          id: 'fog',
          name: 'Neblina',
          enabled: true,
          intensity: 0.35,
          durationMin: 60,
          durationMax: 180,
          chance: 0.15,
          transitionDuration: 10,
        }
      )
    );

    if (this.worldClimate?.data.customEvents) {
      for (const ev of this.worldClimate.data.customEvents) {
        this.events.set(ev.id, new WeatherEvent(ev));
      }
    }
  }

  getEvent(id: string): WeatherEvent | undefined {
    return this.events.get(id);
  }

  getAllEvents(): WeatherEvent[] {
    return Array.from(this.events.values());
  }

  startEvent(id: string, durationSeconds?: number, intensity?: number): void {
    const ev = this.events.get(id);
    if (ev) {
      ev.start(durationSeconds, intensity);
    }
  }

  stopEvent(id: string): void {
    const ev = this.events.get(id);
    if (ev) {
      ev.stop();
    }
  }

  setLocalOverride(key: string, override: Partial<ResolvedClimate>): void {
    this.localOverrides.set(key, override);
  }

  clearLocalOverride(key: string): void {
    this.localOverrides.delete(key);
  }

  /**
   * Main per-frame simulation update.
   */
  update(deltaTime: number, playerX: number, playerY: number, timeHour: number): void {
    // 1. Update individual events (fading in/out with transitionDuration)
    for (const ev of this.events.values()) {
      ev.update(deltaTime);
    }

    // 2. Weather roll timer
    this.cycleTimer += deltaTime;
    if (this.cycleTimer >= this.cycleInterval) {
      this.cycleTimer = 0;
      this.evaluateWeatherRolls(timeHour);
    }

    // 3. Update player position climate
    this.currentPlayerClimate = this.getClimateAt(playerX, playerY, timeHour);
  }

  /**
   * Autonomous periodic weather cycle rolls.
   */
  private evaluateWeatherRolls(timeHour: number): void {
    const rain = this.events.get('rain');
    if (rain && rain.enabled && !rain.active) {
      const roll = Math.random();
      if (roll < rain.chance) {
        rain.start();
      }
    }

    const fog = this.events.get('fog');
    if (fog && fog.enabled && !fog.active) {
      // Natural fog is more likely during early morning (04:00 - 08:00) or late night
      const isMorning = timeHour >= 4.0 && timeHour <= 8.5;
      const effectiveChance = isMorning ? fog.chance * 2.2 : fog.chance;
      const roll = Math.random();
      if (roll < effectiveChance) {
        fog.start();
      }
    }
  }

  /**
   * Resolves the climate at a specific world coordinate (x, y) adhering to the strict priority:
   * 1. Local override
   * 2. Region override
   * 3. Biome override
   * 4. World Global Climate
   * 5. System default
   */
  getClimateAt(worldX: number, worldY: number, timeHour: number = 12): ResolvedClimate {
    // Step 5: System Default baseline
    let rain = 0.0;
    let fog = 0.0;
    let temperature = 22;
    let humidity = 0.5;
    let wind = 0.2;
    let resolvedSource: ResolvedClimate['resolvedSource'] = 'system_default';
    let sourceName = 'Padrão do Sistema';
    let biomeId = 'plains';
    let regionId: string | undefined = undefined;

    // Step 4: World Global Climate
    if (this.worldClimate) {
      const rainEv = this.events.get('rain');
      const fogEv = this.events.get('fog');

      if (rainEv && rainEv.currentIntensity > 0) {
        rain = rainEv.currentIntensity;
      }
      if (fogEv && fogEv.currentIntensity > 0) {
        fog = fogEv.currentIntensity;
      }

      temperature = this.worldClimate.data.baseTemperature;
      humidity = this.worldClimate.data.baseHumidity;
      wind = this.worldClimate.data.globalWind;
      resolvedSource = 'world_global';
      sourceName = 'Clima Global do Mundo';
    }

    // Step 3: Biome Override
    // Determine biome using canonical BiomeResolver or coordinate
    // For tiles, 1 tile is ~12px in our world
    const tileX = Math.floor(worldX / 12);
    const tileY = Math.floor(worldY / 12);

    // Basic procedural biome resolver check based on distance/caves
    if (tileY > 200) {
      biomeId = 'caves';
    } else if (Math.hypot(tileX, tileY) > 800) {
      biomeId = 'desert';
    } else if (Math.abs(tileX) % 300 > 180) {
      biomeId = 'forest';
    } else {
      biomeId = 'plains';
    }

    const biomeDef = this.currentSurface?.getBiome(biomeId) || globalBiomeRegistry.get(biomeId);
    if (biomeDef) {
      const climComp = biomeDef.getComponent<BiomeClimateOverrideComponent>('Climate');
      const tempComp = biomeDef.getComponent<BiomeTemperatureComponent>('Temperature');
      const humComp = biomeDef.getComponent<BiomeHumidityComponent>('Humidity');
      const rainComp = biomeDef.getComponent<RainComponent>('Rain');
      const fogComp = biomeDef.getComponent<FogComponent>('Fog');

      if (tempComp) {
        temperature = tempComp.data.base ?? (tempComp.data.min + tempComp.data.max) / 2;
      }
      if (humComp) {
        humidity = humComp.data.base ?? (humComp.data.min + humComp.data.max) / 2;
      }

      // RainComponent handling
      if (rainComp) {
        if (!rainComp.enabled) {
          rain = 0.0;
        } else if (rain > 0 || rainComp.chance > 0.5) {
          rain = Math.max(rain, rainComp.intensity);
        }
        resolvedSource = 'biome';
        sourceName = `Bioma: ${biomeDef.name}`;
      }

      // FogComponent handling
      if (fogComp) {
        if (!fogComp.enabled) {
          fog = 0.0;
        } else {
          fog = Math.max(fog, fogComp.density);
        }
        resolvedSource = 'biome';
        sourceName = `Bioma: ${biomeDef.name}`;
      }

      if (climComp) {
        if (climComp.data.blockRain) {
          rain = 0.0;
        } else if (climComp.data.forceRain) {
          rain = Math.max(rain, climComp.data.rainIntensity ?? 0.7);
        } else if (climComp.data.rainChance !== undefined && rain > 0) {
          // Modulate active rain with biome-specific factor
          rain = Math.min(1.0, rain * (climComp.data.rainChance / 0.3));
        }

        if (climComp.data.blockFog) {
          fog = 0.0;
        } else if (climComp.data.forceFog) {
          fog = Math.max(fog, climComp.data.fogDensity ?? 0.6);
        } else if (climComp.data.fogDensity !== undefined) {
          fog = Math.max(fog, climComp.data.fogDensity * 0.5);
        }

        if (climComp.data.windMultiplier) {
          wind *= climComp.data.windMultiplier;
        }

        resolvedSource = 'biome';
        sourceName = `Bioma: ${biomeDef.name}`;
      }
    }

    // Step 2: Region Override (e.g. Fog Valley)
    if (this.worldRegions) {
      const foundRegion = this.worldRegions.findRegionAt(worldX, worldY);
      if (foundRegion) {
        regionId = foundRegion.id;
        const ov = foundRegion.climateOverride;
        if (ov.forceRain) {
          rain = ov.rainIntensity ?? 0.8;
        } else if (ov.rainIntensity !== undefined) {
          rain = ov.rainIntensity;
        }

        if (ov.forceFog) {
          fog = ov.fogDensity ?? 0.8;
        } else if (ov.fogDensity !== undefined) {
          fog = ov.fogDensity;
        }

        if (ov.temperatureOffset) {
          temperature += ov.temperatureOffset;
        }
        if (ov.humidityOffset) {
          humidity = Math.min(1.0, humidity + ov.humidityOffset);
        }

        resolvedSource = 'region';
        sourceName = `Região: ${foundRegion.name}`;
      }
    }

    // Step 1: Local / Specific Coordinate Override
    const localKey = `${Math.floor(worldX / 32)},${Math.floor(worldY / 32)}`;
    const local = this.localOverrides.get(localKey);
    if (local) {
      if (local.rain !== undefined) rain = local.rain;
      if (local.fog !== undefined) fog = local.fog;
      if (local.temperature !== undefined) temperature = local.temperature;
      if (local.humidity !== undefined) humidity = local.humidity;
      if (local.wind !== undefined) wind = local.wind;
      resolvedSource = 'local';
      sourceName = `Local: [${localKey}]`;
    }

    const activeEventsList: string[] = [];
    if (rain > 0.05) activeEventsList.push('rain');
    if (fog > 0.05) activeEventsList.push('fog');

    return {
      rain: Math.max(0, Math.min(1, rain)),
      fog: Math.max(0, Math.min(1, fog)),
      temperature: Math.round(temperature),
      humidity: Math.max(0, Math.min(1, humidity)),
      wind: Math.max(0, Math.min(1, wind)),
      activeEvents: activeEventsList,
      resolvedSource,
      sourceName,
      biomeId,
      regionId,
    };
  }

  getCurrentPlayerClimate(): ResolvedClimate {
    return this.currentPlayerClimate;
  }
}
