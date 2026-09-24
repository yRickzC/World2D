import { IWorldComponent, WorldComponentSerializedData } from './componentes/WorldComponent';
import { BiomeDefinition, BiomeDefinitionJSON } from './biomas/BiomeDefinition';
import { Surface, SurfaceJSON } from './superficie/Surface';

export interface WorldJSON {
  id: string;
  name: string;
  seed: number;
  tags: string[];
  width?: number; // width in chunks, or 0 / undefined for infinite
  height?: number; // height in chunks, or 0 / undefined for infinite
  defaultSurfaceId?: string;
  surfaces?: SurfaceJSON[];
  // Legacy fields for backward compatibility
  components?: WorldComponentSerializedData[];
  biomes?: BiomeDefinitionJSON[];
  rules?: Record<string, any>;
  createdAt?: number;
  lastPlayedAt?: number;
}

export class World {
  public id: string;
  public name: string;
  public seed: number;
  public tags: string[];
  public width: number;
  public height: number;
  public defaultSurfaceId: string;
  public rules: Record<string, any>;
  public createdAt: number;
  public lastPlayedAt: number;

  private surfaces: Map<string, Surface> = new Map();

  constructor(
    id: string,
    name: string,
    seed: number,
    tags: string[] = ['survival', 'standard'],
    surfaces: Surface[] = [],
    width: number = 0,
    height: number = 0,
    rules: Record<string, any> = {},
    defaultSurfaceId: string = 'surface_main'
  ) {
    this.id = id;
    this.name = name;
    this.seed = seed;
    this.tags = [...tags];
    this.width = width;
    this.height = height;
    this.rules = { ...rules };
    this.defaultSurfaceId = defaultSurfaceId;
    this.createdAt = Date.now();
    this.lastPlayedAt = Date.now();

    surfaces.forEach((s) => this.addSurface(s));

    // Ensure at least one default surface exists
    if (this.surfaces.size === 0) {
      const defaultSurface = new Surface(
        'surface_main',
        'Main Surface',
        this.seed,
        ['standard'],
        [],
        [],
        'Superfície principal do mundo'
      );
      this.addSurface(defaultSurface);
      this.defaultSurfaceId = defaultSurface.id;
    }
  }

  // --- Surface Management ---

  getSurfaces(): Surface[] {
    return Array.from(this.surfaces.values());
  }

  getSurface(id: string): Surface | undefined {
    return this.surfaces.get(id);
  }

  addSurface(surface: Surface): void {
    this.surfaces.set(surface.id, surface);
    if (!this.surfaces.has(this.defaultSurfaceId)) {
      this.defaultSurfaceId = surface.id;
    }
  }

  removeSurface(id: string): boolean {
    if (this.surfaces.size <= 1) {
      return false; // Cannot remove the last surface
    }
    const res = this.surfaces.delete(id);
    if (id === this.defaultSurfaceId) {
      const remaining = this.getSurfaces();
      if (remaining.length > 0) {
        this.defaultSurfaceId = remaining[0].id;
      }
    }
    return res;
  }

  getDefaultSurface(): Surface {
    const s = this.surfaces.get(this.defaultSurfaceId);
    if (s) return s;
    const all = this.getSurfaces();
    if (all.length > 0) return all[0];
    const fallback = new Surface('surface_main', 'Main Surface', this.seed);
    this.addSurface(fallback);
    return fallback;
  }

  // --- Convenience & Backward Compatibility delegates (operating on Default Surface) ---

  addComponent(component: IWorldComponent): void {
    this.getDefaultSurface().addComponent(component);
  }

  removeComponent(type: string): boolean {
    return this.getDefaultSurface().removeComponent(type);
  }

  getComponent<T extends IWorldComponent>(type: string): T | undefined {
    return this.getDefaultSurface().getComponent<T>(type);
  }

  hasComponent(type: string): boolean {
    return this.getDefaultSurface().hasComponent(type);
  }

  getAllComponents(): IWorldComponent[] {
    return this.getDefaultSurface().getAllComponents();
  }

  getBiome(id: string): BiomeDefinition | undefined {
    return this.getDefaultSurface().getBiome(id);
  }

  getAllBiomes(): BiomeDefinition[] {
    return this.getDefaultSurface().getAllBiomes();
  }

  addBiome(biome: BiomeDefinition): void {
    this.getDefaultSurface().addBiome(biome);
  }

  removeBiome(id: string): boolean {
    return this.getDefaultSurface().removeBiome(id);
  }

  clone(): World {
    const clonedSurfaces = this.getSurfaces().map((s) => s.clone());
    const w = new World(
      this.id,
      this.name,
      this.seed,
      [...this.tags],
      clonedSurfaces,
      this.width,
      this.height,
      { ...this.rules },
      this.defaultSurfaceId
    );
    w.createdAt = this.createdAt;
    w.lastPlayedAt = this.lastPlayedAt;
    return w;
  }

  toJSON(): WorldJSON {
    const defaultSurf = this.getDefaultSurface();
    return {
      id: this.id,
      name: this.name,
      seed: this.seed,
      tags: [...this.tags],
      width: this.width,
      height: this.height,
      defaultSurfaceId: this.defaultSurfaceId,
      surfaces: this.getSurfaces().map((s) => s.toJSON()),
      // Backward compatibility mirror
      components: defaultSurf.getAllComponents().map((c) => c.toJSON()),
      biomes: defaultSurf.getAllBiomes().map((b) => b.toJSON()),
      rules: { ...this.rules },
      createdAt: this.createdAt,
      lastPlayedAt: this.lastPlayedAt,
    };
  }

  static fromJSON(json: WorldJSON): World {
    const surfaces: Surface[] = [];

    // Modern path: surfaces array present
    if (json.surfaces && Array.isArray(json.surfaces) && json.surfaces.length > 0) {
      for (const sJson of json.surfaces) {
        surfaces.push(Surface.fromJSON(sJson));
      }
    } else {
      // Legacy migration path: migrate top-level components & biomes into default surface
      const legacySurface = Surface.fromJSON({
        id: 'surface_main',
        name: 'Main Surface',
        seed: json.seed ?? 124816,
        tags: json.tags || ['standard'],
        components: json.components || [],
        biomes: json.biomes || [],
        description: 'Superfície principal migrada',
      });
      surfaces.push(legacySurface);
    }

    const w = new World(
      json.id,
      json.name,
      json.seed ?? 124816,
      json.tags || ['survival'],
      surfaces,
      json.width || 0,
      json.height || 0,
      json.rules || {},
      json.defaultSurfaceId || surfaces[0]?.id || 'surface_main'
    );
    if (json.createdAt) w.createdAt = json.createdAt;
    if (json.lastPlayedAt) w.lastPlayedAt = json.lastPlayedAt;
    return w;
  }
}
