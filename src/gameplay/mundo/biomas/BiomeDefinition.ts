import { BiomeComponentSerializedData, IBiomeComponent } from './componentes/BiomeComponent';
import { BiomeBlocksComponent } from './componentes/BiomeBlocksComponent';
import { BiomeVegetationComponent } from './componentes/BiomeVegetationComponent';
import { BiomeTemperatureComponent } from './componentes/BiomeTemperatureComponent';
import { BiomeHumidityComponent } from './componentes/BiomeHumidityComponent';
import { BiomeClimateOverrideComponent } from './componentes/BiomeClimateOverrideComponent';
import { GroundComponent } from './componentes/GroundComponent';
import { RainComponent } from './componentes/RainComponent';
import { ScatterComponent } from './componentes/ScatterComponent';
import { PatchComponent } from './componentes/PatchComponent';
import { FogComponent } from './componentes/FogComponent';

export interface BiomeDefinitionJSON {
  id: string;
  name: string;
  category?: 'temperate' | 'aquatic' | 'arid' | 'subterranean';
  color?: string;
  tags: string[];
  components: BiomeComponentSerializedData[];
}

export class BiomeDefinition {
  public id: string;
  public name: string;
  public category: 'temperate' | 'aquatic' | 'arid' | 'subterranean';
  public color: string;
  public tags: string[];
  private components: Map<string, IBiomeComponent> = new Map();

  constructor(
    id: string,
    name: string,
    tags: string[] = [],
    components: IBiomeComponent[] = [],
    category: 'temperate' | 'aquatic' | 'arid' | 'subterranean' = 'temperate',
    color: string = '#84cc16'
  ) {
    this.id = id;
    this.name = name;
    this.tags = [...tags];
    this.category = category;
    this.color = color;
    components.forEach((c) => this.addComponent(c));
  }

  addComponent(component: IBiomeComponent): void {
    this.components.set(component.type, component);
  }

  removeComponent(type: string): boolean {
    return this.components.delete(type);
  }

  getComponent<T extends IBiomeComponent>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  getAllComponents(): IBiomeComponent[] {
    return Array.from(this.components.values());
  }

  clone(): BiomeDefinition {
    const clonedComps = this.getAllComponents().map((c) => c.clone());
    return new BiomeDefinition(
      this.id,
      this.name,
      [...this.tags],
      clonedComps,
      this.category,
      this.color
    );
  }

  toJSON(): BiomeDefinitionJSON {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      color: this.color,
      tags: [...this.tags],
      components: this.getAllComponents().map((c) => c.toJSON()),
    };
  }

  static fromJSON(json: BiomeDefinitionJSON): BiomeDefinition {
    const comps: IBiomeComponent[] = [];
    if (json.components && Array.isArray(json.components)) {
      for (const raw of json.components) {
        if (raw.type === 'BiomeBlocks') {
          comps.push(new BiomeBlocksComponent(raw.id || 'biome_blocks', raw.data));
        } else if (raw.type === 'Ground') {
          comps.push(new GroundComponent(raw.id || 'ground', raw.data));
        } else if (raw.type === 'Rain') {
          comps.push(new RainComponent(raw.id || 'rain', raw.data));
        } else if (raw.type === 'Scatter') {
          comps.push(new ScatterComponent(raw.id || 'scatter', raw.data));
        } else if (raw.type === 'Patch') {
          comps.push(new PatchComponent(raw.id || 'patch', raw.data));
        } else if (raw.type === 'Fog') {
          comps.push(new FogComponent(raw.id || 'fog', raw.data));
        } else if (raw.type === 'Vegetation') {
          comps.push(new BiomeVegetationComponent(raw.id || 'biome_vegetation', raw.data));
        } else if (raw.type === 'Temperature') {
          comps.push(new BiomeTemperatureComponent(raw.id || 'biome_temp', raw.data));
        } else if (raw.type === 'Humidity') {
          comps.push(new BiomeHumidityComponent(raw.id || 'biome_humidity', raw.data));
        } else if (raw.type === 'Climate') {
          comps.push(new BiomeClimateOverrideComponent(raw.id || 'biome_climate', raw.data));
        }
      }
    }
    return new BiomeDefinition(
      json.id,
      json.name,
      json.tags || [],
      comps,
      json.category || 'temperate',
      json.color || '#84cc16'
    );
  }
}
