import { ItemStack, ItemType } from '../../core/configuracao/types';
import { addItemToSlots } from '../inventario/slots/InventorySlots';
import { CraftingRecipe } from './Recipe';

export interface CraftResult {
  success: boolean;
  newSlots: (ItemStack | null)[];
  leftover: number;
  craftedItem: { type: ItemType; count: number; name: string };
  reason?: 'missing_materials' | 'inventory_full';
}

export class CraftingSystem {
  /**
   * Calculates total count of a specific item type across all inventory slots.
   */
  static getItemCount(slots: (ItemStack | null)[], itemType: string): number {
    let total = 0;
    for (const slot of slots) {
      if (slot && slot.type === itemType) {
        total += slot.count;
      }
    }
    return total;
  }

  /**
   * Checks if the player has enough ingredients to craft the recipe.
   */
  static canCraft(recipe: CraftingRecipe, slots: (ItemStack | null)[]): boolean {
    for (const ing of recipe.ingredients) {
      const current = this.getItemCount(slots, ing.type);
      if (current < ing.count) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns how many times a recipe can be crafted with current inventory items.
   */
  static getMaxCraftable(recipe: CraftingRecipe, slots: (ItemStack | null)[]): number {
    let max = Infinity;
    for (const ing of recipe.ingredients) {
      const current = this.getItemCount(slots, ing.type);
      const possible = Math.floor(current / ing.count);
      if (possible < max) {
        max = possible;
      }
    }
    return max === Infinity ? 0 : max;
  }

  /**
   * Deducts ingredients and adds crafted result into inventory slots.
   */
  static craft(
    recipe: CraftingRecipe,
    slots: (ItemStack | null)[],
    multiplier: number = 1
  ): CraftResult {
    if (multiplier <= 0) {
      return {
        success: false,
        newSlots: slots,
        leftover: 0,
        craftedItem: { type: recipe.result.type, count: 0, name: recipe.name },
        reason: 'missing_materials',
      };
    }

    // 1. Verify availability of all ingredients
    for (const ing of recipe.ingredients) {
      const needed = ing.count * multiplier;
      const current = this.getItemCount(slots, ing.type);
      if (current < needed) {
        return {
          success: false,
          newSlots: slots,
          leftover: 0,
          craftedItem: { type: recipe.result.type, count: 0, name: recipe.name },
          reason: 'missing_materials',
        };
      }
    }

    // 2. Consume ingredients from inventory slots
    const workingSlots: (ItemStack | null)[] = slots.map((s) =>
      s ? { ...s } : null
    );

    for (const ing of recipe.ingredients) {
      let needed = ing.count * multiplier;
      for (let i = 0; i < workingSlots.length; i++) {
        const slot = workingSlots[i];
        if (slot && slot.type === ing.type) {
          if (slot.count <= needed) {
            needed -= slot.count;
            workingSlots[i] = null;
          } else {
            slot.count -= needed;
            needed = 0;
            break;
          }
        }
        if (needed <= 0) break;
      }
    }

    // 3. Add produced item to inventory
    const totalProduce = recipe.result.count * multiplier;
    const { newSlots, leftover } = addItemToSlots(
      workingSlots,
      recipe.result.type,
      totalProduce
    );

    return {
      success: true,
      newSlots,
      leftover,
      craftedItem: {
        type: recipe.result.type,
        count: totalProduce - leftover,
        name: recipe.name,
      },
      reason: leftover > 0 ? 'inventory_full' : undefined,
    };
  }
}
