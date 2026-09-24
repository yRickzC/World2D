import { DurabilityComponent } from './components/DurabilityComponent';
import { StackComponent } from './components/StackComponent';
import { ItemDefinition } from './ItemDefinition';

export interface ItemInstanceSerialized {
  id: string;
  definitionId: string;
  state: Record<string, any>;
}

/**
 * ItemInstance represents a concrete occurrence of an item in the world or an inventory.
 * References its immutable ItemDefinition and stores ONLY instance-specific dynamic state.
 */
export class ItemInstance {
  readonly id: string;
  readonly definitionId: string;
  readonly definition: ItemDefinition;

  /**
   * Only dynamic state that varies between instances (e.g. current durability, stack quantity)
   */
  private readonly dynamicState: Map<string, any> = new Map();

  constructor(
    id: string,
    definition: ItemDefinition,
    initialState?: Record<string, any>
  ) {
    this.id = id;
    this.definition = definition;
    this.definitionId = definition.id;

    // Initialize dynamic state defaults from dynamic components
    for (const comp of definition.getAllComponents()) {
      if (comp.isDynamic && typeof comp.getInitialDynamicState === 'function') {
        const defaults = comp.getInitialDynamicState();
        for (const [k, v] of Object.entries(defaults)) {
          this.dynamicState.set(k, v);
        }
      }
    }

    // Overlay provided initial state
    if (initialState) {
      for (const [k, v] of Object.entries(initialState)) {
        this.dynamicState.set(k, v);
      }
    }
  }

  // --- Dynamic State Accessors ---

  getState<T = any>(key: string, defaultValue?: T): T {
    if (this.dynamicState.has(key)) {
      return this.dynamicState.get(key) as T;
    }
    return defaultValue as T;
  }

  setState<T = any>(key: string, value: T): void {
    this.dynamicState.set(key, value);
  }

  hasState(key: string): boolean {
    return this.dynamicState.has(key);
  }

  // --- Convenience Getters for Core Dynamic Properties ---

  get quantity(): number {
    return this.getState<number>('quantity', 1);
  }

  set quantity(val: number) {
    const stackComp = this.definition.getComponent<StackComponent>('stack');
    const max = stackComp ? stackComp.maxStack : 1;
    this.setState('quantity', Math.min(Math.max(0, val), max));
  }

  get durability(): number | undefined {
    return this.getState<number | undefined>('durability', undefined);
  }

  set durability(val: number | undefined) {
    if (val === undefined) {
      this.dynamicState.delete('durability');
      return;
    }
    const durComp = this.definition.getComponent<DurabilityComponent>('durability');
    const max = durComp ? durComp.maxDurability : val;
    this.setState('durability', Math.min(Math.max(0, val), max));
  }

  damageDurability(amount: number): boolean {
    const current = this.durability;
    if (current === undefined) return false;
    const next = Math.max(0, current - amount);
    this.durability = next;
    return next <= 0; // returns true if broken
  }

  repairDurability(amount: number): void {
    const current = this.durability;
    if (current === undefined) return;
    this.durability = current + amount;
  }

  /**
   * Export minimal serializable snapshot without duplicating static definition data.
   */
  toJSON(): ItemInstanceSerialized {
    const stateObj: Record<string, any> = {};
    for (const [k, v] of this.dynamicState.entries()) {
      stateObj[k] = v;
    }

    return {
      id: this.id,
      definitionId: this.definitionId,
      state: stateObj,
    };
  }
}
