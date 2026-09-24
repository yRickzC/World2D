import { ItemStack, ItemType } from '../../core/configuracao/types';
import { RenderComponent } from './components/RenderComponent';
import { StackComponent } from './components/StackComponent';
import { ItemDefinition } from './ItemDefinition';
import { ItemInstance } from './ItemInstance';
import { globalItemDB, globalItemManager, ItemManager } from './ItemManager';

/**
 * InventoryBridge isolates ItemSystem from the Inventory internals and vice-versa.
 * The inventory never touches component internals or event buses directly,
 * and the ItemSystem does not assume how inventories store or present slots.
 */
export class InventoryBridge {
  private readonly manager: ItemManager;

  constructor(manager: ItemManager = globalItemManager) {
    this.manager = manager;
  }

  /**
   * Get the maximum allowed stack for an item type.
   * If an item lacks a StackComponent, it is strictly NOT stackable (maxStack = 1).
   */
  getMaxStack(itemType: string): number {
    const def = this.manager.db.get(itemType);
    if (!def) return 1;
    const stackComp = def.getComponent<StackComponent>('stack');
    return stackComp ? stackComp.maxStack : 1;
  }

  /**
   * Check whether two inventory items can be stacked together.
   */
  canStack(a: ItemStack | null, b: ItemStack | null): boolean {
    if (!a || !b) return false;
    if (a.type !== b.type) return false;
    const max = this.getMaxStack(a.type);
    return max > 1 && a.count < max;
  }

  /**
   * Create an ItemInstance corresponding to an ItemStack.
   */
  createInstanceFromStack(stack: ItemStack): ItemInstance {
    return this.manager.createInstance(
      stack.type,
      {
        quantity: stack.count,
      },
      stack.id
    );
  }

  /**
   * Convert an ItemInstance into an ItemStack for inventory storage.
   */
  createStackFromInstance(instance: ItemInstance): ItemStack {
    return {
      id: instance.id,
      type: instance.definitionId as ItemType,
      count: instance.quantity,
    };
  }

  /**
   * Query the underlying definition safely.
   */
  getDefinition(itemType: string): ItemDefinition | undefined {
    return this.manager.db.get(itemType);
  }

  /**
   * Retrieve the visual rendering component of an item.
   */
  getRenderComponent(itemType: string): RenderComponent | undefined {
    const def = this.manager.db.get(itemType);
    return def?.getComponent<RenderComponent>('render');
  }

  /**
   * Dispatch item usage via the bridge.
   */
  useItem(instance: ItemInstance, context: any): boolean {
    return this.manager.dispatchUse(instance, context);
  }

  /**
   * Dispatch item consumption via the bridge.
   */
  consumeItem(instance: ItemInstance, consumer: any): boolean {
    return this.manager.dispatchConsume(instance, consumer);
  }
}

export const globalInventoryBridge = new InventoryBridge(globalItemManager);
