import {
  BlockComponent,
  ColorTextureComponent,
  EmojiIconComponent,
  FluidComponent,
  SolidComponent,
} from './componentes';

export type BlockComponentConstructor<T extends BlockComponent = BlockComponent> =
  | (abstract new (...args: any[]) => T)
  | (new (...args: any[]) => T);

export interface BlockDefinitionData {
  id: string;
  name: string;
  tags?: string[];
  components?: BlockComponent[];
}

/**
 * Data-driven definition of a Block/Tile.
 * Stores core identity, tags for capability matching, and reusable components.
 */
export class BlockDefinition {
  readonly id: string;
  readonly name: string;

  private readonly tags: Set<string>;
  private readonly components: Map<string, BlockComponent>;

  constructor(data: BlockDefinitionData) {
    this.id = data.id;
    this.name = data.name;
    this.tags = new Set(data.tags ?? []);
    this.components = new Map();

    if (data.components) {
      for (const comp of data.components) {
        this.components.set(comp.type, comp);
      }
    }
  }

  /**
   * Check if this block has a specific tag.
   * Example: block.hasTag("mineable"), block.hasTag("solid")
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /**
   * Get all tags assigned to this block.
   */
  getTags(): string[] {
    return Array.from(this.tags);
  }

  /**
   * Check if this block has a component by class constructor or string type.
   * Example: block.hasComponent(BreakableComponent), block.hasComponent('solid')
   */
  hasComponent<T extends BlockComponent>(target: BlockComponentConstructor<T> | string): boolean {
    const key = typeof target === 'string' ? target : (target as any).type ?? target.name.toLowerCase();
    return this.components.has(key);
  }

  /**
   * Retrieve a typed component from this block.
   * Example: const breakable = block.getComponent(BreakableComponent);
   */
  getComponent<T extends BlockComponent>(target: BlockComponentConstructor<T> | string): T | null {
    const key = typeof target === 'string' ? target : (target as any).type ?? target.name.toLowerCase();
    return (this.components.get(key) as T) || null;
  }

  /**
   * Get all components currently attached to this block.
   */
  getAllComponents(): BlockComponent[] {
    return Array.from(this.components.values());
  }

  // --- Convenience Getters ---
  get isSolid(): boolean {
    const solidComp = this.getComponent(SolidComponent);
    return solidComp ? solidComp.solid : false;
  }

  get isFluid(): boolean {
    const fluidComp = this.getComponent(FluidComponent);
    return fluidComp ? fluidComp.isFluid : false;
  }

  get colorTexture(): ColorTextureComponent | null {
    return this.getComponent(ColorTextureComponent);
  }

  get emojiIcon(): string | null {
    const iconComp = this.getComponent(EmojiIconComponent);
    return iconComp ? iconComp.emoji : null;
  }
}
