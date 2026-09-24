/**
 * Unified Mod Registry Architecture
 * Organizes BlockRegistry, ItemRegistry, EntityRegistry, BiomeRegistry, SurfaceRegistry,
 * ComponentRegistry, RecipeRegistry, and TagRegistry with namespace support and patch tracking.
 */
import { ModPatch, RegisteredEntry } from './types';

export class BaseSubRegistry<T = any> {
  protected entries = new Map<string, RegisteredEntry<T>>();
  protected aliasMap = new Map<string, string>(); // 'grass' -> 'core:grass'
  protected patches = new Map<string, ModPatch[]>(); // targetId -> patches

  constructor(public readonly registryName: string) {}

  register(
    id: string,
    data: T,
    packageId: string,
    isCore: boolean = false,
    name?: string
  ): void {
    const namespace = id.includes(':') ? id.split(':')[0] : isCore ? 'core' : packageId;
    const fullId = id.includes(':') ? id : `${namespace}:${id}`;
    const cleanName = name || (data as any)?.name || (data as any)?.id || fullId;

    const entry: RegisteredEntry<T> = {
      id: fullId,
      name: cleanName,
      namespace,
      packageId,
      isCore,
      data,
      patchedBy: [],
    };

    this.entries.set(fullId, entry);

    // Provide short alias for core items (e.g. 'grass' <-> 'core:grass')
    if (isCore && id.startsWith('core:')) {
      this.aliasMap.set(id.replace('core:', ''), fullId);
    } else if (isCore && !id.includes(':')) {
      this.aliasMap.set(id, fullId);
    }
  }

  get(id: string): RegisteredEntry<T> | undefined {
    if (this.entries.has(id)) return this.entries.get(id);
    const aliased = this.aliasMap.get(id);
    if (aliased && this.entries.has(aliased)) return this.entries.get(aliased);
    // Try fallback with core:
    if (!id.includes(':') && this.entries.has(`core:${id}`)) {
      return this.entries.get(`core:${id}`);
    }
    return undefined;
  }

  getData(id: string): T | undefined {
    return this.get(id)?.data;
  }

  has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  getAll(): RegisteredEntry<T>[] {
    return Array.from(this.entries.values());
  }

  getByPackage(packageId: string): RegisteredEntry<T>[] {
    return this.getAll().filter((e) => e.packageId === packageId);
  }

  getByNamespace(namespace: string): RegisteredEntry<T>[] {
    return this.getAll().filter((e) => e.namespace === namespace);
  }

  delete(id: string): boolean {
    const entry = this.get(id);
    if (!entry) return false;
    if (entry.isCore) {
      console.warn(`[${this.registryName}] Protection: Cannot delete Core object "${entry.id}".`);
      return false;
    }
    this.entries.delete(entry.id);
    for (const [alias, target] of this.aliasMap.entries()) {
      if (target === entry.id) this.aliasMap.delete(alias);
    }
    return true;
  }

  applyPatch(patch: ModPatch, sourceModId: string): boolean {
    const entry = this.get(patch.targetId);
    if (!entry) {
      console.warn(`[${this.registryName}] Cannot apply patch: Target "${patch.targetId}" not found.`);
      return false;
    }

    if (!this.patches.has(entry.id)) {
      this.patches.set(entry.id, []);
    }
    this.patches.get(entry.id)!.push(patch);
    if (!entry.patchedBy) entry.patchedBy = [];
    if (!entry.patchedBy.includes(sourceModId)) {
      entry.patchedBy.push(sourceModId);
    }

    // Apply shallow or component-level merge
    if (patch.operation === 'PATCH' || patch.operation === 'EXTEND') {
      entry.data = {
        ...entry.data,
        ...patch.properties,
      };
    } else if (patch.operation === 'OVERRIDE') {
      entry.data = {
        ...(entry.data as any),
        ...patch.properties,
      };
    }

    return true;
  }

  getPatchesFor(id: string): ModPatch[] {
    const entry = this.get(id);
    if (!entry) return [];
    return this.patches.get(entry.id) || [];
  }

  count(): number {
    return this.entries.size;
  }

  clearNonCore(): void {
    for (const [id, entry] of this.entries.entries()) {
      if (!entry.isCore) {
        this.entries.delete(id);
      }
    }
  }
}

/**
 * Unified Registries Hub
 */
export class ModRegistryHub {
  readonly blocks = new BaseSubRegistry('BlockRegistry');
  readonly items = new BaseSubRegistry('ItemRegistry');
  readonly entities = new BaseSubRegistry('EntityRegistry');
  readonly biomes = new BaseSubRegistry('BiomeRegistry');
  readonly surfaces = new BaseSubRegistry('SurfaceRegistry');
  readonly components = new BaseSubRegistry('ComponentRegistry');
  readonly recipes = new BaseSubRegistry('RecipeRegistry');
  readonly tags = new BaseSubRegistry<string[]>('TagRegistry');

  private initialized = false;

  get isInitialized(): boolean {
    return this.initialized;
  }

  markInitialized(): void {
    this.initialized = true;
  }

  getSummary() {
    return {
      blocks: this.blocks.count(),
      items: this.items.count(),
      entities: this.entities.count(),
      biomes: this.biomes.count(),
      surfaces: this.surfaces.count(),
      components: this.components.count(),
      recipes: this.recipes.count(),
      tags: this.tags.count(),
    };
  }

  clearMods(): void {
    this.blocks.clearNonCore();
    this.items.clearNonCore();
    this.entities.clearNonCore();
    this.biomes.clearNonCore();
    this.surfaces.clearNonCore();
    this.components.clearNonCore();
    this.recipes.clearNonCore();
    this.tags.clearNonCore();
  }
}

export const globalModRegistries = new ModRegistryHub();
