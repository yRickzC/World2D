import {
  BaseBlockComponent,
  ColorTextureComponent,
  EmojiIconComponent,
  FluidComponent,
  SideTextureComponent,
  SolidComponent,
  TopTextureComponent,
} from './components';
import { BlockCategory, BlockDefinitionJSON } from './types';

export type BlockComponentConstructor<T extends BaseBlockComponent = BaseBlockComponent> =
  | (abstract new (...args: any[]) => T)
  | (new (...args: any[]) => T);

export class BlockDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: BlockCategory | string;

  private readonly tags: Set<string>;
  private readonly components: Map<string, BaseBlockComponent>;
  private readonly prioritySortedComponents: BaseBlockComponent[];

  constructor(
    id: string,
    name: string,
    category: BlockCategory | string = 'natural',
    tags: string[] = [],
    components: BaseBlockComponent[] = []
  ) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.tags = new Set(tags);
    this.components = new Map();

    for (const comp of components) {
      this.components.set(comp.type, comp);
      this.components.set(comp.type.toLowerCase(), comp);
      this.components.set(comp.id, comp);
    }

    // Sort by priority (ascending: lowest number runs first)
    this.prioritySortedComponents = [...components].sort((a, b) => a.priority - b.priority);
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  getTags(): string[] {
    return Array.from(this.tags);
  }

  hasComponent<T extends BaseBlockComponent>(target: BlockComponentConstructor<T> | string): boolean {
    const key = typeof target === 'string' ? target.toLowerCase() : ((target as any).type ?? target.name).toLowerCase();
    return this.components.has(key);
  }

  getComponent<T extends BaseBlockComponent>(target: BlockComponentConstructor<T> | string): T | null {
    const key = typeof target === 'string' ? target.toLowerCase() : ((target as any).type ?? target.name).toLowerCase();
    return (this.components.get(key) as T) || null;
  }

  getAllComponents(): BaseBlockComponent[] {
    // Return unique components by identity
    return Array.from(new Set(this.components.values()));
  }

  getSortedComponents(): BaseBlockComponent[] {
    return this.prioritySortedComponents;
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

  get isDynamic(): boolean {
    return this.getAllComponents().some((c) => c.isDynamic);
  }

  get colorTexture(): ColorTextureComponent | null {
    return this.getComponent(ColorTextureComponent);
  }

  get topTexture(): TopTextureComponent | null {
    return this.getComponent(TopTextureComponent);
  }

  get sideTexture(): SideTextureComponent | null {
    return this.getComponent(SideTextureComponent);
  }

  get emojiIcon(): string | null {
    const iconComp = this.getComponent(EmojiIconComponent);
    return iconComp ? iconComp.emoji : null;
  }

  toJSON(): BlockDefinitionJSON {
    const unique = this.getAllComponents();
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      tags: this.getTags(),
      components: unique.map((c) => ({
        id: c.id,
        type: c.type,
        data: c.toJSON(),
      })),
    };
  }
}
