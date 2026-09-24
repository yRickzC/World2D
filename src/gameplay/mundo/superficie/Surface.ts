import { IWorldComponent, WorldComponentSerializedData } from '../componentes/WorldComponent';
import { WorldClimateComponent } from '../componentes/WorldClimateComponent';
import { WorldGenerationComponent } from '../componentes/WorldGenerationComponent';
import { WorldRegionComponent } from '../componentes/WorldRegionComponent';
import { WorldEnvironmentComponent } from '../componentes/WorldEnvironmentComponent';
import { BiomeDefinition, BiomeDefinitionJSON } from '../biomas/BiomeDefinition';
import { globalBiomeRegistry } from '../biomas/BiomeRegistry';

export interface SurfaceJSON {
  id: string;
  name: string;
  seed: number;
  description?: string;
  tags?: string[];
  defaultBiomeId?: string;
  components: WorldComponentSerializedData[];
  biomes?: BiomeDefinitionJSON[];
  rules?: Record<string, any>;
}

export class Surface {
  public id: string;
  public name: string;
  public seed: number;
  public description: string;
  public tags: string[];
  public defaultBiomeId: string;
  public rules: Record<string, any>;

  private components: Map<string, IWorldComponent> = new Map();
  private biomes: Map<string, BiomeDefinition> = new Map();

  constructor(
    id: string,
    name: string,
    seed: number = 124816,
    tags: string[] = ['standard'],
    components: IWorldComponent[] = [],
    biomes: BiomeDefinition[] = [],
    description: string = '',
    defaultBiomeId: string = 'plains',
    rules: Record<string, any> = {}
  ) {
    this.id = id;
    this.name = name;
    this.seed = seed;
    this.tags = [...tags];
    this.description = description;
    this.defaultBiomeId = defaultBiomeId;
    this.rules = { ...rules };

    components.forEach((c) => this.addComponent(c));
    biomes.forEach((b) => this.biomes.set(b.id, b));

    // Ensure essential components exist per surface
    if (!this.hasComponent('WorldClimateComponent')) {
      this.addComponent(new WorldClimateComponent());
    }
    if (!this.hasComponent('WorldGenerationComponent')) {
      this.addComponent(new WorldGenerationComponent());
    }
    if (!this.hasComponent('WorldRegionComponent')) {
      this.addComponent(new WorldRegionComponent());
    }
    if (!this.hasComponent('WorldEnvironmentComponent')) {
      this.addComponent(new WorldEnvironmentComponent());
    }

    // Default biomes if none provided
    if (this.biomes.size === 0) {
      globalBiomeRegistry.getAll().forEach((b) => this.biomes.set(b.id, b.clone()));
    }
  }

  addComponent(component: IWorldComponent): void {
    this.components.set(component.type, component);
  }

  removeComponent(type: string): boolean {
    return this.components.delete(type);
  }

  getComponent<T extends IWorldComponent>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  getAllComponents(): IWorldComponent[] {
    return Array.from(this.components.values());
  }

  // Biome management
  getBiome(id: string): BiomeDefinition | undefined {
    return this.biomes.get(id);
  }

  getAllBiomes(): BiomeDefinition[] {
    return Array.from(this.biomes.values());
  }

  addBiome(biome: BiomeDefinition): void {
    this.biomes.set(biome.id, biome);
  }

  removeBiome(id: string): boolean {
    return this.biomes.delete(id);
  }

  clone(): Surface {
    const clonedComps = this.getAllComponents().map((c) => c.clone());
    const clonedBiomes = this.getAllBiomes().map((b) => b.clone());
    return new Surface(
      this.id,
      this.name,
      this.seed,
      [...this.tags],
      clonedComps,
      clonedBiomes,
      this.description,
      this.defaultBiomeId,
      { ...this.rules }
    );
  }

  toJSON(): SurfaceJSON {
    return {
      id: this.id,
      name: this.name,
      seed: this.seed,
      description: this.description,
      tags: [...this.tags],
      defaultBiomeId: this.defaultBiomeId,
      components: this.getAllComponents().map((c) => c.toJSON()),
      biomes: this.getAllBiomes().map((b) => b.toJSON()),
      rules: { ...this.rules },
    };
  }

  static fromJSON(json: SurfaceJSON): Surface {
    const comps: IWorldComponent[] = [];
    if (json.components && Array.isArray(json.components)) {
      for (const raw of json.components) {
        if (raw.type === 'WorldClimateComponent') {
          comps.push(new WorldClimateComponent(raw.id || 'world_climate', raw.data));
        } else if (raw.type === 'WorldGenerationComponent') {
          comps.push(new WorldGenerationComponent(raw.id || 'world_gen', raw.data));
        } else if (raw.type === 'WorldRegionComponent') {
          comps.push(new WorldRegionComponent(raw.id || 'world_regions', raw.data));
        } else if (raw.type === 'WorldEnvironmentComponent') {
          comps.push(new WorldEnvironmentComponent(raw.id || 'world_env', raw.data));
        }
      }
    }

    const biomes: BiomeDefinition[] = [];
    if (json.biomes && Array.isArray(json.biomes)) {
      for (const bJson of json.biomes) {
        biomes.push(BiomeDefinition.fromJSON(bJson));
      }
    }

    return new Surface(
      json.id,
      json.name,
      json.seed ?? 124816,
      json.tags || ['standard'],
      comps,
      biomes,
      json.description || '',
      json.defaultBiomeId || 'plains',
      json.rules || {}
    );
  }
}
