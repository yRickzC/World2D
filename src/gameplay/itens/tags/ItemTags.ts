/**
 * Tags and capabilities for Items.
 * Used for data-driven compatibility checks between items, blocks, and gameplay systems.
 */
export const ITEM_TAGS = {
  // Broad categories
  TOOL: 'tool',
  WEAPON: 'weapon',
  MATERIAL: 'material',
  FOOD: 'food',
  NATURE: 'nature',
  CONSUMABLE: 'consumable',
  PLACEABLE: 'placeable',
  PLANTABLE: 'plantable',

  // Tool specific types
  PICKAXE: 'pickaxe',
  AXE: 'axe',
  SHOVEL: 'shovel',
  SWORD: 'sword',
  WATERING_TOOL: 'watering_tool',

  // Material tiers / types
  WOOD: 'wood',
  STONE: 'stone',
  IRON: 'iron',
  DIAMOND: 'diamond',
  FIBER: 'fiber',
  SEED: 'seed',
  FLOWER: 'flower',
  TORCH: 'torch',
} as const;

export type ItemTag = (typeof ITEM_TAGS)[keyof typeof ITEM_TAGS] | string;
