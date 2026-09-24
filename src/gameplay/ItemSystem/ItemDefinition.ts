import { BaseComponent } from './components/BaseComponent';
import { ComponentSerializedData, ItemDefinitionJSON, ItemHookType } from './types';

/**
 * ItemDefinition represents the conceptual identity of an item in the world.
 * Pure identity at the root: id, nome, categoria.
 * All behavior and attributes reside in isolated components.
 */
export class ItemDefinition {
  /** Core identity fields (What is it?) */
  readonly id: string;
  readonly nome: string;
  readonly categoria: string;

  /** Internal component registries */
  private readonly componentsByType: Map<string, BaseComponent> = new Map();
  private readonly componentsById: Map<string, BaseComponent> = new Map();
  private readonly allComponents: BaseComponent[] = [];

  /**
   * Pre-sorted hook arrays prepared at initialization time.
   * Eliminates runtime sorting, temporary arrays, and per-frame allocations.
   */
  private readonly onUseHooks: BaseComponent[] = [];
  private readonly onUpdateHooks: BaseComponent[] = [];
  private readonly onConsumeHooks: BaseComponent[] = [];
  private readonly onRenderHooks: BaseComponent[] = [];
  private readonly onDestroyHooks: BaseComponent[] = [];

  constructor(id: string, nome: string, categoria: string, components: BaseComponent[] = []) {
    this.id = id;
    this.nome = nome;
    this.categoria = categoria;

    for (const comp of components) {
      this.registerComponent(comp);
    }

    this.prepareSortedHooks();
  }

  private registerComponent(comp: BaseComponent): void {
    if (this.componentsById.has(comp.id)) {
      throw new Error(
        `[ItemDefinition] Duplicate component id "${comp.id}" in item definition "${this.id}".`
      );
    }
    this.componentsById.set(comp.id, comp);
    this.componentsByType.set(comp.type, comp);
    this.allComponents.push(comp);
  }

  /**
   * Sort hooks by priority descending once during initialization.
   */
  private prepareSortedHooks(): void {
    // Sort all components by priority descending (e.g. Render 100 > Tool 50 > Durability 20)
    const sorted = [...this.allComponents].sort((a, b) => b.priority - a.priority);

    for (const comp of sorted) {
      if (typeof comp.onUse === 'function') this.onUseHooks.push(comp);
      if (typeof comp.onUpdate === 'function') this.onUpdateHooks.push(comp);
      if (typeof comp.onConsume === 'function') this.onConsumeHooks.push(comp);
      if (typeof comp.onRender === 'function') this.onRenderHooks.push(comp);
      if (typeof comp.onDestroy === 'function') this.onDestroyHooks.push(comp);
    }
  }

  hasComponent(type: string): boolean {
    return this.componentsByType.has(type);
  }

  getComponent<T extends BaseComponent>(type: string): T | undefined {
    return this.componentsByType.get(type) as T | undefined;
  }

  getComponentById<T extends BaseComponent>(id: string): T | undefined {
    return this.componentsById.get(id) as T | undefined;
  }

  getAllComponents(): readonly BaseComponent[] {
    return this.allComponents;
  }

  /**
   * Direct hot-path access to prepared hook lists without allocations.
   */
  getHooks(hookType: ItemHookType): readonly BaseComponent[] {
    switch (hookType) {
      case 'onUse':
        return this.onUseHooks;
      case 'onUpdate':
        return this.onUpdateHooks;
      case 'onConsume':
        return this.onConsumeHooks;
      case 'onRender':
        return this.onRenderHooks;
      case 'onDestroy':
        return this.onDestroyHooks;
      default:
        return [];
    }
  }

  toJSON(): ItemDefinitionJSON {
    const serializedComponents: ComponentSerializedData[] = this.allComponents.map((c) => ({
      id: c.id,
      type: c.type,
      data: c.toJSON(),
    }));

    return {
      id: this.id,
      nome: this.nome,
      categoria: this.categoria,
      components: serializedComponents,
    };
  }
}
