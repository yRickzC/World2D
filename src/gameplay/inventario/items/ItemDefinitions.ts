import { ItemStack, ItemType } from '../../../core/configuracao/types';
import { ItemDatabase } from '../../itens/ItemDatabase';
import { ItemDefinition } from '../../itens/ItemDefinition';

export { ItemDatabase } from '../../itens/ItemDatabase';
export { ItemDefinition } from '../../itens/ItemDefinition';

/**
 * Accessor for Item Definitions, powered by the modular component-based ItemDatabase.
 */
export const getItemDef = (type: ItemType | string): ItemDefinition => {
  return ItemDatabase.getItem(type);
};

export const createItemStack = (type: ItemType | string, count: number): ItemStack => {
  const def = getItemDef(type);
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: type as ItemType,
    count: Math.min(count, def.maxStack),
  };
};

/**
 * Legacy dictionary mapping for backwards-compatibility.
 */
export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = new Proxy(
  {},
  {
    get: (_target, prop: string) => {
      return ItemDatabase.getItem(prop);
    },
  }
);
