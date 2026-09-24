export interface WorldData {
  id: string;
  name: string;
  seed: number;
  createdAt: number;
  lastPlayedAt: number;
}

const STORAGE_KEY = 'craft_survival_2d_worlds_v1';

const DEFAULT_WORLDS: WorldData[] = [
  {
    id: 'world_default_01',
    name: 'Mundo Sobrevivência',
    seed: 124816,
    createdAt: Date.now() - 3600000 * 24,
    lastPlayedAt: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'world_default_02',
    name: 'Ilhas Selvagens',
    seed: 987654,
    createdAt: Date.now() - 3600000 * 48,
    lastPlayedAt: Date.now() - 3600000 * 6,
  },
];

export class WorldStorage {
  /**
   * Generates a random 6-digit seed.
   */
  static generateRandomSeed(): number {
    return Math.floor(Math.random() * 900000) + 100000;
  }

  /**
   * Parses a seed input:
   * - If positive number, keeps it.
   * - If string of digits, parses as integer.
   * - If string of characters, hashes to numeric seed.
   * - If empty/falsy, generates a random seed.
   */
  static parseSeed(input?: string | number): number {
    if (typeof input === 'number' && !isNaN(input) && input > 0) {
      return Math.floor(input);
    }
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) {
        return this.generateRandomSeed();
      }
      const parsedNum = parseInt(trimmed, 10);
      if (!isNaN(parsedNum) && parsedNum.toString() === trimmed && parsedNum > 0) {
        return parsedNum;
      }
      // String hashing to integer
      let hash = 0;
      for (let i = 0; i < trimmed.length; i++) {
        hash = (hash << 5) - hash + trimmed.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) || this.generateRandomSeed();
    }
    return this.generateRandomSeed();
  }

  /**
   * Retrieves all saved worlds, sorted by last played (most recent first).
   */
  static getAll(): WorldData[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Initialize default worlds
        this.saveAll(DEFAULT_WORLDS);
        return [...DEFAULT_WORLDS];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
      }
      // If parsed was empty array, re-seed defaults
      this.saveAll(DEFAULT_WORLDS);
      return [...DEFAULT_WORLDS];
    } catch (e) {
      console.warn('[WorldStorage] Failed to read worlds from localStorage, using memory defaults', e);
      return [...DEFAULT_WORLDS];
    }
  }

  /**
   * Find a single world by ID.
   */
  static get(id: string): WorldData | undefined {
    return this.getAll().find((w) => w.id === id);
  }

  /**
   * Creates a new world and persists it.
   */
  static create(name: string, rawSeed?: string | number): WorldData {
    const trimmedName = name.trim() || 'Novo Mundo';
    const seed = this.parseSeed(rawSeed);
    const newWorld: WorldData = {
      id: `world_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      seed,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };

    const worlds = this.getAll();
    worlds.unshift(newWorld);
    this.saveAll(worlds);
    return newWorld;
  }

  /**
   * Deletes a world by ID.
   */
  static delete(id: string): boolean {
    const worlds = this.getAll();
    const filtered = worlds.filter((w) => w.id !== id);
    if (filtered.length !== worlds.length) {
      this.saveAll(filtered);
      return true;
    }
    return false;
  }

  /**
   * Updates last played timestamp of a world.
   */
  static touch(id: string): void {
    const worlds = this.getAll();
    const world = worlds.find((w) => w.id === id);
    if (world) {
      world.lastPlayedAt = Date.now();
      this.saveAll(worlds);
    }
  }

  /**
   * Internal helper to persist worlds to localStorage.
   */
  private static saveAll(worlds: WorldData[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(worlds));
    } catch (e) {
      console.warn('[WorldStorage] Failed to write worlds to localStorage', e);
    }
  }
}
