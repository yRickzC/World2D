/**
 * Tags and capabilities for Blocks/Tiles in the game world.
 * Used for data-driven compatibility checks without hardcoded tile checks.
 */
export const BLOCK_TAGS = {
  // Physical properties
  SOLID: 'solid',
  WALKABLE: 'walkable',
  FLUID: 'fluid',
  WATER: 'water',
  TRANSPARENT: 'transparent',
  COLLISION: 'collision',

  // Terrain types
  GROUND: 'ground',
  SOIL: 'soil',
  SAND: 'sand',
  GRASS: 'grass',
  STONE: 'stone',
  WOOD: 'wood',

  // Gameplay interactions
  MINEABLE: 'mineable',
  CHOPPABLE: 'choppable',
  DIGGABLE: 'diggable',
  PLANTABLE: 'plantable',
  UNNAVIGABLE: 'unnavigable',
  LIGHT_SOURCE: 'light_source',
} as const;

export type BlockTag = (typeof BLOCK_TAGS)[keyof typeof BLOCK_TAGS] | string;
