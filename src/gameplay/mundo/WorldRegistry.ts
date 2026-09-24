import { World, WorldJSON } from './World';
import { WorldData, WorldStorage } from './WorldStorage';

const FULL_WORLDS_STORAGE_KEY = 'craft_survival_2d_full_worlds_v1';

export class WorldRegistry {
  private worlds: Map<string, World> = new Map();

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    try {
      const raw = localStorage.getItem(FULL_WORLDS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            const world = World.fromJSON(item);
            this.worlds.set(world.id, world);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('[WorldRegistry] Failed to parse full worlds, seeding from WorldStorage', e);
    }

    // Seed from existing WorldStorage
    const baseWorlds = WorldStorage.getAll();
    for (const bw of baseWorlds) {
      const w = new World(bw.id, bw.name, bw.seed);
      w.createdAt = bw.createdAt;
      w.lastPlayedAt = bw.lastPlayedAt;
      this.worlds.set(w.id, w);
    }
    this.saveAll();
  }

  saveAll(): void {
    try {
      const list = Array.from(this.worlds.values()).map((w) => w.toJSON());
      localStorage.setItem(FULL_WORLDS_STORAGE_KEY, JSON.stringify(list));

      // Keep WorldStorage in sync
      const simpleList: WorldData[] = list.map((w) => ({
        id: w.id,
        name: w.name,
        seed: w.seed,
        createdAt: w.createdAt || Date.now(),
        lastPlayedAt: w.lastPlayedAt || Date.now(),
      }));
      localStorage.setItem('craft_survival_2d_worlds_v1', JSON.stringify(simpleList));
    } catch (e) {
      console.warn('[WorldRegistry] Failed to save worlds', e);
    }
  }

  register(world: World): void {
    this.worlds.set(world.id, world);
    this.saveAll();
  }

  get(id: string): World | undefined {
    return this.worlds.get(id);
  }

  has(id: string): boolean {
    return this.worlds.has(id);
  }

  getAll(): World[] {
    return Array.from(this.worlds.values()).sort(
      (a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0)
    );
  }

  delete(id: string): boolean {
    const res = this.worlds.delete(id);
    if (res) {
      this.saveAll();
      WorldStorage.delete(id);
    }
    return res;
  }

  create(name: string, seedInput?: string | number): World {
    const seed = WorldStorage.parseSeed(seedInput);
    const id = `world_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const world = new World(id, name.trim() || 'Novo Mundo', seed);
    this.register(world);
    return world;
  }

  duplicate(id: string, newId: string, newName: string): World | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    const cloned = existing.clone();
    cloned.id = newId;
    cloned.name = newName;
    cloned.createdAt = Date.now();
    cloned.lastPlayedAt = Date.now();
    this.register(cloned);
    return cloned;
  }
}

export const globalWorldRegistry = new WorldRegistry();
