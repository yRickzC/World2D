export interface ComponentContext {
  bus: import('../ItemEventBus').ItemEventBus;
  itemDefId: string;
}

export abstract class BaseComponent {
  /** Internal unique id within the entity (e.g. "tool_01", "render_01") */
  readonly id: string;
  /** Component type name (e.g. "tool", "render", "durability") */
  abstract readonly type: string;
  /** Hook execution priority (higher numbers execute first) */
  abstract readonly priority: number;
  /** True if component maintains instance-specific state (e.g. durability, stack count) */
  abstract readonly isDynamic: boolean;
  /** Types of other components that MUST be present on the same item definition */
  readonly requires?: string[];

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Hook executed when an item is actively used (left or right click in world).
   */
  onUse?(instance: any, context: any): boolean | void;

  /**
   * Hook executed during the game frame loop for items requiring tick updates.
   */
  onUpdate?(instance: any, dt: number): void;

  /**
   * Hook executed when an item is consumed (e.g. food, potions).
   */
  onConsume?(instance: any, consumer: any): boolean | void;

  /**
   * Hook executed when the item is rendered onto a canvas.
   */
  onRender?(ctx: CanvasRenderingContext2D, instance: any, x: number, y: number, size: number): void;

  /**
   * Hook executed when the item instance is destroyed or depleted.
   */
  onDestroy?(instance: any): void;

  /**
   * Export static configuration data for serialization into JSON.
   */
  abstract toJSON(): Record<string, any>;

  /**
   * Provide initial dynamic state values when an instance is instantiated.
   */
  getInitialDynamicState?(): Record<string, any>;
}
