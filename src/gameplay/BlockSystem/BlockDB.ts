import { BlockDefinition } from './BlockDefinition';
import { ColorTextureComponent, EmojiIconComponent, SolidComponent } from './components';

export class BlockDB {
  private readonly definitions: Map<string, BlockDefinition> = new Map();

  /**
   * Register a block definition.
   */
  register(def: BlockDefinition): void {
    this.definitions.set(def.id, def);
  }

  /**
   * Get definition by id, or undefined if not registered.
   */
  get(id: string): BlockDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Get definition with a safe default fallback to prevent crashes on missing or removed mod blocks.
   */
  getBlock(id: string): BlockDefinition {
    const existing = this.definitions.get(id);
    if (existing) return existing;

    // Safe fallback block for unknown/missing definitions
    return new BlockDefinition(
      id,
      id,
      'natural',
      ['ground', 'walkable'],
      [
        new EmojiIconComponent({ emoji: '⬛' }),
        new ColorTextureComponent({ primaryColor: '#334155' }),
        new SolidComponent({ solid: false }),
      ]
    );
  }

  has(id: string): boolean {
    return this.definitions.has(id);
  }

  getAll(): BlockDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByTag(tag: string): BlockDefinition[] {
    return this.getAll().filter((block) => block.hasTag(tag));
  }

  getByCategory(category: string): BlockDefinition[] {
    return this.getAll().filter((block) => block.category === category);
  }

  count(): number {
    return this.definitions.size;
  }

  clear(): void {
    this.definitions.clear();
  }

  delete(id: string): boolean {
    return this.definitions.delete(id);
  }
}

// Global Singleton instance
export const globalBlockDB = new BlockDB();

// Canonical alias for the system
export const BlockSystem_db = globalBlockDB;
