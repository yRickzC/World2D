import { ItemDefinition } from './ItemDefinition';

/**
 * Registry and database for ItemDefinitions.
 * Resolves definitions by ID and stores verified core and mod items.
 */
export class ItemDB {
  private readonly definitions: Map<string, ItemDefinition> = new Map();

  /**
   * Register a verified ItemDefinition into the database.
   */
  register(def: ItemDefinition): void {
    if (this.definitions.has(def.id)) {
      console.warn(`[ItemDB] Overwriting item definition for "${def.id}".`);
    }
    this.definitions.set(def.id, def);
  }

  /**
   * Resolve an ItemDefinition by ID.
   */
  get(id: string): ItemDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Check if an ItemDefinition ID exists.
   */
  has(id: string): boolean {
    return this.definitions.has(id);
  }

  /**
   * Retrieve all registered ItemDefinitions.
   */
  getAll(): ItemDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Filter definitions by category.
   */
  getByCategory(categoria: string): ItemDefinition[] {
    return this.getAll().filter((def) => def.categoria === categoria);
  }

  /**
   * Remove an ItemDefinition (used on mod unload).
   */
  delete(id: string): boolean {
    return this.definitions.delete(id);
  }

  /**
   * Clear registry (used for tests/reloading).
   */
  clear(): void {
    this.definitions.clear();
  }
}
