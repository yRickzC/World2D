import { GameSettings } from './types';

export const TILE_SIZE = 48;
export const CHUNK_SIZE = 16; // 16x16 tiles per chunk = 768px
export const INITIAL_SEED = 124816;

// Single configurable location for maximum player interaction reach with mouse (in world pixels)
// 144px = 3 full tiles (3 * 48px), perfectly balancing accessibility and gameplay challenge
export const PLAYER_INTERACTION_RANGE = 144;

export const HOTBAR_SLOTS_COUNT = 9;
export const MAIN_INVENTORY_SLOTS_COUNT = 27;
export const TOTAL_INVENTORY_SLOTS = HOTBAR_SLOTS_COUNT + MAIN_INVENTORY_SLOTS_COUNT; // 36 slots

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  timeOfDay: 'day',
  timeHour: 10.0,
  isTimeAutoAdvancing: true,
  timeSpeed: 1.0, // ~4.8 minutes for full 24h cycle
  zoom: 1.15,
  showMiniMap: false,
};
