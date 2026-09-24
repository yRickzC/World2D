import { ItemCategory, ItemType } from '../../core/configuracao/types';
import {
  ConsumableComponent,
  DescriptionComponent,
  ItemComponent,
  ItemVisualComponent,
  StackComponent,
} from './componentes';

export type ComponentConstructor<T extends ItemComponent = ItemComponent> =
  | (abstract new (...args: any[]) => T)
  | (new (...args: any[]) => T);

/**
 * Clean root data for defining an Item.
 * Following the architectural rule:
 * Item
 * ├── id
 * ├── nome
 * ├── categoria
 * └── components
 *     ├── Component A
 *     ├── Component B
 *     └── Component N
 * Components determine behavior. Category determines fixed classification.
 * No redundant tags layer.
 */
export interface ItemDefinitionData {
  id: ItemType | string;
  nome?: string;
  name?: string;
  categoria?: ItemCategory;
  category?: ItemCategory;
  tags?: string[]; // Optional for legacy compatibility during migration
  components?: ItemComponent[];
}

/**
 * Data-driven definition of an Item.
 * Stores core identity (id, nome, categoria) and modular components.
 * All properties and behaviors are delegated dynamically to attached components.
 */
export class ItemDefinition {
  readonly id: ItemType | string;
  readonly nome: string;
  readonly name: string;
  readonly categoria: ItemCategory;
  readonly category: ItemCategory;

  private readonly components: Map<string, ItemComponent>;

  constructor(data: ItemDefinitionData) {
    this.id = data.id;
    this.nome = data.nome ?? data.name ?? String(data.id);
    this.name = this.nome;
    this.categoria = data.categoria ?? data.category ?? 'material';
    this.category = this.categoria;

    this.components = new Map();

    if (data.components) {
      for (const comp of data.components) {
        this.components.set(comp.type, comp);
      }
    }
  }

  /**
   * Check if this item has a component by class or string type identifier.
   */
  hasComponent<T extends ItemComponent>(target: ComponentConstructor<T> | string): boolean {
    return this.getComponent(target) !== null;
  }

  /**
   * Retrieve a typed component from this item.
   */
  getComponent<T extends ItemComponent>(target: ComponentConstructor<T> | string): T | null {
    if (typeof target === 'string') {
      return (this.components.get(target) as T) || null;
    }

    const key = (target as any).type;
    if (key && this.components.has(key)) {
      return this.components.get(key) as T;
    }

    // Fallback: search by instanceof for base classes like ItemVisualComponent
    for (const comp of this.components.values()) {
      if (comp instanceof target) {
        return comp as T;
      }
    }

    return null;
  }

  /**
   * Get all components currently attached to this item.
   */
  getAllComponents(): ItemComponent[] {
    return Array.from(this.components.values());
  }

  // --- Dynamic component-driven getters ---

  /**
   * Retrieve the attached visual component (Emoji, Color, Image, SVG, etc.)
   */
  getVisual(): ItemVisualComponent | null {
    return this.getComponent(ItemVisualComponent);
  }

  /**
   * Retrieve the attached description component.
   */
  getDescription(): DescriptionComponent | null {
    return this.getComponent(DescriptionComponent);
  }

  /**
   * Retrieve the attached stack component.
   */
  getStack(): StackComponent | null {
    return this.getComponent(StackComponent);
  }

  // --- Backward-compatibility getters for existing systems ---

  get maxStack(): number {
    return this.getComponent(StackComponent)?.maxStack ?? 64;
  }

  get iconEmoji(): string {
    const visual = this.getVisual();
    return visual ? visual.getEmojiFallback() : '📦';
  }

  get accentColor(): string {
    const visual = this.getVisual();
    return visual ? visual.accentColor : '#71717a';
  }

  get description(): string {
    return this.getComponent(DescriptionComponent)?.text ?? '';
  }

  get categoryName(): string {
    const desc = this.getComponent(DescriptionComponent);
    if (desc?.categoryName) return desc.categoryName;
    switch (this.category) {
      case 'tool':
        return 'Ferramenta';
      case 'material':
        return 'Material';
      case 'food':
        return 'Alimento';
      case 'nature':
        return 'Natureza';
      default:
        return 'Item';
    }
  }

  get consumable(): boolean {
    return this.hasComponent(ConsumableComponent);
  }

  get usePrompt(): string | undefined {
    return this.getComponent(ConsumableComponent)?.prompt;
  }
}
