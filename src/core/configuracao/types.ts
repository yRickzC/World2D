export type TileType =
  | 'deep_water'
  | 'water'
  | 'sand'
  | 'grass'
  | 'dense_grass'
  | 'dug_dirt'
  | 'wood_plank'
  | 'stone'
  | string;

export type FoliageType = 'tree_oak' | 'tree_pine' | 'bush' | 'tall_grass' | 'flower';

export type ItemType =
  | 'wood'
  | 'fiber'
  | 'berries'
  | 'seed'
  | 'flower'
  | 'stick'
  | 'apple'
  | 'wood_plank'
  | 'stone'
  | 'torch'
  | 'wooden_axe'
  | 'stone_axe'
  | 'iron_axe'
  | 'wooden_pickaxe'
  | 'stone_pickaxe'
  | 'iron_pickaxe'
  | 'diamond_pickaxe'
  | 'wooden_shovel'
  | 'watering_can'
  | string;

export type ItemCategory = 'material' | 'food' | 'nature' | 'tool';

export interface ItemDefinition {
  id: ItemType;
  name: string;
  category: ItemCategory;
  categoryName: string;
  description: string;
  maxStack: number;
  iconEmoji: string;
  accentColor: string;
  consumable?: boolean;
  usePrompt?: string;
}

export interface ItemStack {
  id: string; // Unique instance id
  type: ItemType;
  count: number;
  durability?: number;
  maxDurability?: number;
}

export interface CursorItem {
  item: ItemStack;
  sourceSlotIndex: number | null;
}

export interface DroppedItem {
  id: string;
  type: ItemType;
  count: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bobOffset: number;
  pickupCooldown: number;
  createdAt: number;
}

export interface InventoryItem {
  id: ItemType;
  name: string;
  count: number;
  description: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface WorldEntity {
  id: string;
  type: FoliageType | string;
  x: number; // World pixel coordinates
  y: number;
  width: number;
  height: number;
  variant: number;
  swayOffset: number;
  health: number;
  maxHealth: number;
  isHarvested?: boolean;
  harvestTimer?: number;
  hitShake?: number; // Visual shake when chopped/harvested
  // Living entity attributes (ECS integrated)
  isLiving?: boolean;
  entityDefId?: string;
  name?: string;
  styleEmoji?: string;
  styleSize?: number;
  styleColor?: string;
  behavior?: 'passive' | 'neutral' | 'hostile' | 'fleeing';
  speed?: number;
  detectionRadius?: number;
  damage?: number;
  attackRange?: number;
  attackCooldown?: number;
  attackTimer?: number;
  vx?: number;
  vy?: number;
  facing?: 'left' | 'right';
  wanderTimer?: number;
  wanderTarget?: { x: number; y: number } | null;
  state?: 'idle' | 'wander' | 'chase' | 'flee';
}

export interface TileLayerData {
  baseGround: TileType;
  isDug: boolean;
  groundBlock?: string | null;
  upperLayers: string[];
}

export interface Chunk {
  cx: number;
  cy: number;
  tiles: TileType[][]; // [y][x]
  layers?: (TileLayerData | undefined)[][];
  entities: WorldEntity[];
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  runSpeed: number;
  isRunning: boolean;
  facing: 'down' | 'up' | 'left' | 'right';
  animFrame: number;
  animTimer: number;
  isMoving: boolean;
  isInteracting?: boolean;
  interactTimer?: number;
}

export interface Camera {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  timeOfDay: 'day' | 'sunset' | 'night' | 'dawn';
  timeHour: number; // 0.0 to 24.0
  isTimeAutoAdvancing: boolean;
  timeSpeed: number; // multiplier
  zoom: number;
  showMiniMap: boolean;
}
