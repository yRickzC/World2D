import {
  HOTBAR_SLOTS_COUNT,
  MAIN_INVENTORY_SLOTS_COUNT,
  TOTAL_INVENTORY_SLOTS,
} from '../../../core/configuracao/constants';
import { ItemStack, ItemType } from '../../../core/configuracao/types';
import { createItemStack, getItemDef } from '../items/ItemDefinitions';

export { HOTBAR_SLOTS_COUNT, MAIN_INVENTORY_SLOTS_COUNT, TOTAL_INVENTORY_SLOTS };

/**
 * Creates an empty inventory of 36 slots with starter kit.
 */
export const createInitialSlots = (): (ItemStack | null)[] => {
  const slots: (ItemStack | null)[] = Array(TOTAL_INVENTORY_SLOTS).fill(null);

  // Starter kit:
  // Slot 0 (Hotbar 1): Wooden Axe
  slots[0] = createItemStack('wooden_axe', 1);
  // Slot 1 (Hotbar 2): Wooden Shovel (Pá para cavar terra e chão cavado)
  slots[1] = createItemStack('wooden_shovel', 1);
  // Slot 2 (Hotbar 3): 24 Wood (Madeira para construção e camadas)
  slots[2] = createItemStack('wood', 24);
  // Slot 3 (Hotbar 4): 4 Flowers (Flores para teste de plantio)
  slots[3] = createItemStack('flower', 4);
  // Slot 4 (Hotbar 5): 8 Berries
  slots[4] = createItemStack('berries', 8);
  // Slot 5 (Hotbar 6): 12 Fiber
  slots[5] = createItemStack('fiber', 12);

  return slots;
};

/**
 * Adds an amount of item into the inventory slots.
 * Prioritizes merging into existing non-full stacks, then empty slots.
 */
export const addItemToSlots = (
  currentSlots: (ItemStack | null)[],
  type: ItemType,
  amountToAdd: number
): { newSlots: (ItemStack | null)[]; leftover: number } => {
  const slots = currentSlots.map((s) => (s ? { ...s } : null));
  const def = getItemDef(type);
  let remaining = amountToAdd;

  // 1. Merge into existing partial stacks of the same type
  for (let i = 0; i < slots.length; i++) {
    if (remaining <= 0) break;
    const slot = slots[i];
    if (slot && slot.type === type && slot.count < def.maxStack) {
      const space = def.maxStack - slot.count;
      const add = Math.min(space, remaining);
      slot.count += add;
      remaining -= add;
    }
  }

  // 2. Place into empty slots
  for (let i = 0; i < slots.length; i++) {
    if (remaining <= 0) break;
    if (!slots[i]) {
      const add = Math.min(def.maxStack, remaining);
      slots[i] = createItemStack(type, add);
      remaining -= add;
    }
  }

  return { newSlots: slots, leftover: remaining };
};

/**
 * Quick Move (Shift + Left Click) like in Minecraft:
 * - If in Hotbar (0..8) -> moves to Main Inventory (9..35)
 * - If in Main Inventory (9..35) -> moves to Hotbar (0..8)
 */
export const quickMoveSlot = (
  currentSlots: (ItemStack | null)[],
  fromIndex: number
): { newSlots: (ItemStack | null)[]; moved: boolean } => {
  const slots = currentSlots.map((s) => (s ? { ...s } : null));
  const source = slots[fromIndex];
  if (!source) return { newSlots: slots, moved: false };

  const isHotbar = fromIndex < HOTBAR_SLOTS_COUNT;
  const targetStart = isHotbar ? HOTBAR_SLOTS_COUNT : 0;
  const targetEnd = isHotbar ? TOTAL_INVENTORY_SLOTS : HOTBAR_SLOTS_COUNT;
  const def = getItemDef(source.type);

  let remaining = source.count;

  // 1. Try to merge into existing target stacks
  for (let i = targetStart; i < targetEnd; i++) {
    if (remaining <= 0) break;
    const slot = slots[i];
    if (slot && slot.type === source.type && slot.count < def.maxStack) {
      const space = def.maxStack - slot.count;
      const add = Math.min(space, remaining);
      slot.count += add;
      remaining -= add;
    }
  }

  // 2. Try to move into empty target slots
  for (let i = targetStart; i < targetEnd; i++) {
    if (remaining <= 0) break;
    if (!slots[i]) {
      const add = Math.min(def.maxStack, remaining);
      slots[i] = {
        id: `${source.type}_${Date.now()}_${Math.random()}`,
        type: source.type,
        count: add,
      };
      remaining -= add;
    }
  }

  if (remaining <= 0) {
    slots[fromIndex] = null;
  } else {
    source.count = remaining;
  }

  return { newSlots: slots, moved: remaining < source.count };
};

/**
 * Auto-Sorts items in the inventory:
 * 1. Consolidates fragmented stacks of the same item type together.
 * 2. Groups items in the main storage neatly by category and quantity.
 */
export const sortInventorySlots = (
  currentSlots: (ItemStack | null)[],
  sortHotbarToo = false
): (ItemStack | null)[] => {
  const slots = currentSlots.map((s) => (s ? { ...s } : null));

  const startIndex = sortHotbarToo ? 0 : HOTBAR_SLOTS_COUNT;
  const endIndex = TOTAL_INVENTORY_SLOTS;

  const itemsToConsolidate: { type: ItemType; count: number }[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    if (slots[i]) {
      itemsToConsolidate.push({ type: slots[i]!.type, count: slots[i]!.count });
      slots[i] = null;
    }
  }

  const countsByType = new Map<ItemType, number>();
  for (const it of itemsToConsolidate) {
    countsByType.set(it.type, (countsByType.get(it.type) || 0) + it.count);
  }

  const categoryOrder: Record<string, number> = {
    tool: 1,
    material: 2,
    food: 3,
    nature: 4,
  };

  const consolidatedStacks: ItemStack[] = [];
  const sortedTypes = Array.from(countsByType.keys()).sort((a, b) => {
    const defA = getItemDef(a);
    const defB = getItemDef(b);
    const catComp = (categoryOrder[defA.category] || 99) - (categoryOrder[defB.category] || 99);
    if (catComp !== 0) return catComp;
    return defA.name.localeCompare(defB.name);
  });

  for (const type of sortedTypes) {
    let total = countsByType.get(type) || 0;
    const def = getItemDef(type);
    while (total > 0) {
      const take = Math.min(total, def.maxStack);
      consolidatedStacks.push(createItemStack(type, take));
      total -= take;
    }
  }

  for (let i = 0; i < consolidatedStacks.length && startIndex + i < endIndex; i++) {
    slots[startIndex + i] = consolidatedStacks[i];
  }

  return slots;
};
