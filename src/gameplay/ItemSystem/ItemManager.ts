import {
  BaseComponent,
  BlockItemComponent,
  ConsumableComponent,
  DescriptionComponent,
  DurabilityComponent,
  EquipmentComponent,
  FoodComponent,
  IdentityComponent,
  LevelComponent,
  PassiveComponent,
  RarityComponent,
  RenderComponent,
  StackComponent,
  StatsComponent,
  TagComponent,
  ToolComponent,
  ValueComponent,
  VisualComponent,
  WeaponComponent,
} from './components';
import { CORE_ITEM_DEFINITIONS } from './data/items';
import { ItemDB } from './ItemDB';
import { ItemDefinition } from './ItemDefinition';
import { ItemEventBus } from './ItemEventBus';
import { ItemInstance, ItemInstanceSerialized } from './ItemInstance';
import { globalSchemaRegistry, ItemValidationReport } from './schemas/SchemaRegistry';
import { ComponentSerializedData, ItemDefinitionJSON, ItemHookType } from './types';

export const VALID_ITEM_CATEGORIES = new Set([
  'weapons',
  'tools',
  'armor',
  'accessories',
  'consumables',
  'backpacks',
  'tool',
  'weapon',
  'food',
  'material',
  'nature',
  'block',
  'utility',
]);

/**
 * Component factory map.
 * In this version, mods can only reuse existing core components.
 */
type ComponentFactory = (id: string, data: Record<string, any>) => BaseComponent;

export class ItemManager {
  readonly db: ItemDB;
  readonly bus: ItemEventBus;

  private readonly activeInstances: Map<string, ItemInstance> = new Map();
  private readonly componentFactories: Map<string, ComponentFactory> = new Map();

  constructor(db?: ItemDB, bus?: ItemEventBus) {
    this.db = db || new ItemDB();
    this.bus = bus || new ItemEventBus();

    this.registerCoreComponentFactories();
  }

  /**
   * Register factories for all standard core components.
   */
  private registerCoreComponentFactories(): void {
    // Official 16 components
    this.componentFactories.set('IdentityComponent', (id, data) => new IdentityComponent({ id, ...data } as any));
    this.componentFactories.set('RarityComponent', (id, data) => new RarityComponent({ id, ...data } as any));
    this.componentFactories.set('LevelComponent', (id, data) => new LevelComponent({ id, ...data } as any));
    this.componentFactories.set('StackComponent', (id, data) => new StackComponent({ id, ...data } as any));
    this.componentFactories.set('TagComponent', (id, data) => new TagComponent({ id, ...data } as any));
    this.componentFactories.set('StatsComponent', (id, data) => new StatsComponent({ id, ...data } as any));
    this.componentFactories.set('EquipmentComponent', (id, data) => new EquipmentComponent({ id, ...data } as any));
    this.componentFactories.set('WeaponComponent', (id, data) => new WeaponComponent({ id, ...data } as any));
    this.componentFactories.set('ToolComponent', (id, data) => new ToolComponent({ id, ...data } as any));
    this.componentFactories.set('ConsumableComponent', (id, data) => new ConsumableComponent({ id, ...data } as any));
    this.componentFactories.set('PassiveComponent', (id, data) => new PassiveComponent({ id, ...data } as any));
    this.componentFactories.set('ValueComponent', (id, data) => new ValueComponent({ id, ...data } as any));
    this.componentFactories.set('VisualComponent', (id, data) => new VisualComponent({ id, ...data } as any));
    this.componentFactories.set('RenderComponent', (id, data) => new RenderComponent({ id, ...data } as any));

    // Lowercase / legacy component aliases
    this.componentFactories.set('render', (id, data) => new RenderComponent({ id, ...data } as any));
    this.componentFactories.set('description', (id, data) => new DescriptionComponent({ id, ...data } as any));
    this.componentFactories.set('stack', (id, data) => new StackComponent({ id, ...data } as any));
    this.componentFactories.set('durability', (id, data) => new DurabilityComponent({ id, ...data } as any));
    this.componentFactories.set('tool', (id, data) => new ToolComponent({ id, ...data } as any));
    this.componentFactories.set('weapon', (id, data) => new WeaponComponent({ id, ...data } as any));
    this.componentFactories.set('food', (id, data) => new FoodComponent({ id, ...data } as any));
    this.componentFactories.set('consumable', (id, data) => new ConsumableComponent({ id, ...data } as any));
    this.componentFactories.set('block_item', (id, data) => new BlockItemComponent({ id, ...data } as any));
  }

  /**
   * Load and validate all core JSON definitions.
   * A missing mandatory dependency in core items is a fatal error that prevents game startup.
   */
  initializeCore(): void {
    for (const json of CORE_ITEM_DEFINITIONS) {
      try {
        const def = this.buildDefinitionFromJSON(json as ItemDefinitionJSON, false);
        this.db.register(def);
      } catch (err: any) {
        // Core structural critical error: prevents game from starting
        throw new Error(
          `[ItemManager FATAL] Core Item Definition "${json?.id}" failed initialization: ${err.message}`
        );
      }
    }
  }

  /**
   * Build and validate an ItemDefinition from raw JSON data.
   * @param isMod If true, failure will not crash the game, but will be safely rejected.
   */
  buildDefinitionFromJSON(json: ItemDefinitionJSON, isMod: boolean = false): ItemDefinition {
    // 1. Validate fundamental root identity fields
    if (!json.id || typeof json.id !== 'string') {
      throw new Error('Item definition must have a valid string "id".');
    }
    if (!json.nome || typeof json.nome !== 'string') {
      throw new Error(`Item "${json.id}" must have a valid string "nome".`);
    }
    if (!json.categoria || !VALID_ITEM_CATEGORIES.has(json.categoria)) {
      throw new Error(
        `Item "${json.id}" has invalid category "${json.categoria}". Allowed: ${Array.from(
          VALID_ITEM_CATEGORIES
        ).join(', ')}`
      );
    }

    // 2. Validate component structure and unique IDs
    const componentInstances: BaseComponent[] = [];
    const componentIds = new Set<string>();
    const presentComponentTypes = new Set<string>();

    const rawComponents: ComponentSerializedData[] = Array.isArray(json.components)
      ? json.components
      : [];

    for (const rawComp of rawComponents) {
      if (!rawComp.id || typeof rawComp.id !== 'string') {
        throw new Error(`Component in item "${json.id}" is missing internal "id".`);
      }
      if (componentIds.has(rawComp.id)) {
        throw new Error(
          `Duplicate component id "${rawComp.id}" within item definition "${json.id}".`
        );
      }
      componentIds.add(rawComp.id);

      if (!rawComp.type || typeof rawComp.type !== 'string') {
        throw new Error(`Component "${rawComp.id}" in item "${json.id}" is missing "type".`);
      }

      const factory = this.componentFactories.get(rawComp.type);
      if (!factory) {
        if (isMod) {
          throw new Error(
            `Mods cannot create new component types: unknown type "${rawComp.type}".`
          );
        } else {
          throw new Error(`Unknown component type "${rawComp.type}" in item "${json.id}".`);
        }
      }

      const comp = factory(rawComp.id, rawComp.data || {});
      componentInstances.push(comp);
      presentComponentTypes.add(comp.type);
    }

    // 3. Validate mandatory component dependencies
    for (const comp of componentInstances) {
      if (comp.requires && comp.requires.length > 0) {
        for (const reqType of comp.requires) {
          if (!presentComponentTypes.has(reqType)) {
            throw new Error(
              `Mandatory dependency missing: Component "${comp.type}" (${comp.id}) in item "${json.id}" requires "${reqType}" component, which is missing!`
            );
          }
        }
      }
    }

    // 4. Construct ItemDefinition (internally prepares sorted priority hooks)
    return new ItemDefinition(json.id, json.nome, json.categoria, componentInstances);
  }

  /**
   * Register a mod/external item definition safely.
   * Rejects invalid external content without corrupting existing core definitions.
   */
  registerModItem(json: any): { success: boolean; error?: string } {
    try {
      const def = this.buildDefinitionFromJSON(json as ItemDefinitionJSON, true);
      this.db.register(def);
      return { success: true };
    } catch (err: any) {
      console.warn(`[ItemManager] External mod item rejected: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // --- Instance Lifecycle Management ---

  /**
   * Instantiate a new ItemInstance referencing its immutable ItemDefinition.
   */
  createInstance(
    definitionId: string,
    initialDynamicState?: Record<string, any>,
    customInstanceId?: string
  ): ItemInstance {
    const def = this.db.get(definitionId);
    if (!def) {
      throw new Error(`Cannot create ItemInstance: ItemDefinition "${definitionId}" not found in ItemDB.`);
    }

    const instanceId =
      customInstanceId ||
      `${definitionId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const instance = new ItemInstance(instanceId, def, initialDynamicState);
    this.activeInstances.set(instance.id, instance);

    this.bus.emit('item.created', {
      itemId: definitionId,
      instanceId: instance.id,
      timestamp: Date.now(),
    });

    return instance;
  }

  /**
   * Destroy an ItemInstance and execute onDestroy hooks.
   */
  destroyInstance(instanceId: string): void {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) return;

    // Execute prioritized onDestroy hooks
    const hooks = instance.definition.getHooks('onDestroy');
    for (const hook of hooks) {
      if (hook.onDestroy) {
        hook.onDestroy(instance);
      }
    }

    this.activeInstances.delete(instanceId);

    this.bus.emit('item.destroyed', {
      itemId: instance.definitionId,
      instanceId,
      timestamp: Date.now(),
    });
  }

  getInstance(instanceId: string): ItemInstance | undefined {
    return this.activeInstances.get(instanceId);
  }

  // --- Optimized Hook Dispatchers (No Per-Frame Allocations) ---

  /**
   * Direct hot-path execution for main frame loops.
   */
  dispatchUpdate(instance: ItemInstance, dt: number): void {
    const hooks = instance.definition.getHooks('onUpdate');
    for (let i = 0; i < hooks.length; i++) {
      hooks[i].onUpdate!(instance, dt);
    }
  }

  /**
   * Direct hot-path execution for item usage.
   */
  dispatchUse(instance: ItemInstance, context: any): boolean {
    const hooks = instance.definition.getHooks('onUse');
    let handled = false;
    for (let i = 0; i < hooks.length; i++) {
      const res = hooks[i].onUse!(instance, { ...context, bus: this.bus });
      if (res) handled = true;
    }
    return handled;
  }

  /**
   * Direct hot-path execution for item consumption.
   */
  dispatchConsume(instance: ItemInstance, consumer: any): boolean {
    const hooks = instance.definition.getHooks('onConsume');
    let consumed = false;
    for (let i = 0; i < hooks.length; i++) {
      const res = hooks[i].onConsume!(instance, consumer);
      if (res) consumed = true;
    }
    if (consumed) {
      this.bus.emit('item.consumed', {
        itemId: instance.definitionId,
        instanceId: instance.id,
        timestamp: Date.now(),
      });
    }
    return consumed;
  }

  /**
   * Direct hot-path execution for rendering.
   */
  dispatchRender(
    ctx: CanvasRenderingContext2D,
    instance: ItemInstance,
    x: number,
    y: number,
    size: number
  ): void {
    const hooks = instance.definition.getHooks('onRender');
    for (let i = 0; i < hooks.length; i++) {
      hooks[i].onRender!(ctx, instance, x, y, size);
    }
  }

  // --- Serialization & Persistence Bridge ---

  /**
   * Serializes an ItemInstance into a lightweight snapshot for external save systems.
   */
  serializeInstance(instance: ItemInstance): ItemInstanceSerialized {
    return instance.toJSON();
  }

  /**
   * Validates an item definition against ItemSystem rules and schemas.
   * Single source of truth for UI, dev tools, and mods.
   */
  validateItem(item: Partial<ItemDefinitionJSON>): ItemValidationReport {
    return globalSchemaRegistry.validateItem(item);
  }

  /**
   * Deserializes an ItemInstance from a saved snapshot.
   */
  deserializeInstance(saved: ItemInstanceSerialized): ItemInstance {
    return this.createInstance(saved.definitionId, saved.state, saved.id);
  }
}

// Global Singleton for ItemManager & DB
export const globalItemDB = new ItemDB();
export const globalItemEventBus = new ItemEventBus();
export const globalItemManager = new ItemManager(globalItemDB, globalItemEventBus);

// Official system aliases for tools and external consumers
export const ItemSystem_manager = globalItemManager;
export const ItemSystem_db = globalItemDB;

// Initialize core items
globalItemManager.initializeCore();
