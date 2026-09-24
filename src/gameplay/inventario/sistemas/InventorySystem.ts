import { CursorItem, ItemStack } from '../../../core/configuracao/types';
import { getItemDef } from '../items/ItemDefinitions';

export {
  addItemToSlots,
  createInitialSlots,
  HOTBAR_SLOTS_COUNT,
  MAIN_INVENTORY_SLOTS_COUNT,
  quickMoveSlot,
  sortInventorySlots,
  TOTAL_INVENTORY_SLOTS,
} from '../slots/InventorySlots';

export interface SlotClickResult {
  newSlots: (ItemStack | null)[];
  newCursor: CursorItem | null;
  action: 'pickup' | 'drop' | 'swap' | 'merge' | 'split' | 'none';
}

/**
 * Minecraft-style cursor and slot interaction handler:
 * - Left-click with empty cursor: pick up entire slot stack.
 * - Right-click with empty cursor: pick up half of slot stack (rounded up).
 * - Left-click with item on cursor:
 *    - If slot is empty: drop all onto slot.
 *    - If slot has same item: merge as much as possible up to maxStack.
 *    - If slot has different item: swap slot and cursor item!
 * - Right-click with item on cursor:
 *    - If slot is empty: drop 1 item onto slot.
 *    - If slot has same item and count < maxStack: drop 1 item onto slot.
 */
export const handleMinecraftSlotClick = (
  slots: (ItemStack | null)[],
  slotIndex: number,
  isRightClick: boolean,
  cursor: CursorItem | null
): SlotClickResult => {
  const newSlots = slots.map((s) => (s ? { ...s } : null));
  const slot = newSlots[slotIndex];

  // CASE 1: Cursor is EMPTY
  if (!cursor) {
    if (!slot) {
      return { newSlots, newCursor: null, action: 'none' };
    }

    if (!isRightClick) {
      // Pick up entire stack
      newSlots[slotIndex] = null;
      return {
        newSlots,
        newCursor: { item: slot, sourceSlotIndex: slotIndex },
        action: 'pickup',
      };
    } else {
      // Pick up half stack (rounded up)
      const half = Math.ceil(slot.count / 2);
      const remainder = slot.count - half;

      if (remainder <= 0) {
        newSlots[slotIndex] = null;
      } else {
        slot.count = remainder;
      }

      return {
        newSlots,
        newCursor: {
          item: { id: `${slot.type}_${Date.now()}`, type: slot.type, count: half },
          sourceSlotIndex: slotIndex,
        },
        action: 'split',
      };
    }
  }

  // CASE 2: Cursor HAS AN ITEM
  const cursorItem = { ...cursor.item };
  const def = getItemDef(cursorItem.type);

  if (!isRightClick) {
    // LEFT CLICK WITH CURSOR ITEM
    if (!slot) {
      newSlots[slotIndex] = cursorItem;
      return { newSlots, newCursor: null, action: 'drop' };
    }

    if (slot.type === cursorItem.type) {
      const space = def.maxStack - slot.count;
      if (space <= 0) {
        return { newSlots, newCursor: cursor, action: 'none' };
      }

      const add = Math.min(space, cursorItem.count);
      slot.count += add;
      cursorItem.count -= add;

      if (cursorItem.count <= 0) {
        return { newSlots, newCursor: null, action: 'merge' };
      } else {
        return {
          newSlots,
          newCursor: { ...cursor, item: cursorItem },
          action: 'merge',
        };
      }
    } else {
      // Swap different items
      newSlots[slotIndex] = cursorItem;
      return {
        newSlots,
        newCursor: { item: slot, sourceSlotIndex: slotIndex },
        action: 'swap',
      };
    }
  } else {
    // RIGHT CLICK WITH CURSOR ITEM
    if (!slot) {
      newSlots[slotIndex] = {
        id: `${cursorItem.type}_${Date.now()}_${Math.random()}`,
        type: cursorItem.type,
        count: 1,
      };
      cursorItem.count -= 1;

      if (cursorItem.count <= 0) {
        return { newSlots, newCursor: null, action: 'drop' };
      } else {
        return {
          newSlots,
          newCursor: { ...cursor, item: cursorItem },
          action: 'drop',
        };
      }
    }

    if (slot.type === cursorItem.type) {
      if (slot.count < def.maxStack) {
        slot.count += 1;
        cursorItem.count -= 1;

        if (cursorItem.count <= 0) {
          return { newSlots, newCursor: null, action: 'merge' };
        } else {
          return {
            newSlots,
            newCursor: { ...cursor, item: cursorItem },
            action: 'merge',
          };
        }
      }
    }

    return { newSlots, newCursor: cursor, action: 'none' };
  }
};
