import { IWorldComponent, WorldComponentSerializedData } from './WorldComponent';
import { ClimateRegionDefinition } from '../clima/WeatherTypes';

export interface WorldRegionData {
  regions: ClimateRegionDefinition[];
}

export class WorldRegionComponent implements IWorldComponent {
  readonly id: string;
  readonly type = 'WorldRegionComponent';
  public data: WorldRegionData;

  constructor(id: string = 'world_regions', data?: Partial<WorldRegionData>) {
    this.id = id;
    this.data = {
      regions: data?.regions
        ? JSON.parse(JSON.stringify(data.regions))
        : [
            {
              id: 'fog_valley',
              name: 'Vale da Neblina',
              area: {
                x: 120,
                y: -60,
                width: 320,
                height: 240,
              },
              tags: ['foggy', 'valley', 'humid'],
              climateOverride: {
                rainChance: 0.9,
                rainIntensity: 0.8,
                fogDensity: 0.8,
                forceFog: true,
                humidityOffset: 0.35,
              },
            },
          ],
    };
  }

  addRegion(region: ClimateRegionDefinition): void {
    const idx = this.data.regions.findIndex((r) => r.id === region.id);
    if (idx >= 0) {
      this.data.regions[idx] = region;
    } else {
      this.data.regions.push(region);
    }
  }

  removeRegion(id: string): boolean {
    const initialLen = this.data.regions.length;
    this.data.regions = this.data.regions.filter((r) => r.id !== id);
    return this.data.regions.length !== initialLen;
  }

  findRegionAt(x: number, y: number): ClimateRegionDefinition | undefined {
    return this.data.regions.find((r) => {
      const a = r.area;
      return x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height;
    });
  }

  clone(): WorldRegionComponent {
    return new WorldRegionComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): WorldComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
