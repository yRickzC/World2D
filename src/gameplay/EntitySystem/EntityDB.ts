import { EntityDefinition } from './EntityDefinition';
import { EntityDefinitionJSON } from './types';

export const CORE_ENTITIES_DATA: EntityDefinitionJSON[] = [
  {
    id: 'player',
    name: 'Player',
    tags: ['player', 'living', 'controllable'],
    components: [
      {
        id: 'name_player',
        type: 'NameComponent',
        data: { name: 'Player' },
      },
      {
        id: 'health_player',
        type: 'HealthComponent',
        data: { maxHealth: 100, currentHealth: 100, invulnerable: false },
      },
      {
        id: 'movement_player',
        type: 'MovementComponent',
        data: { speed: 3.5, canFly: false, canSwim: true },
      },
      {
        id: 'style_player',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '🧑', size: 42, scale: 1.0 },
      },
      {
        id: 'inventory_player',
        type: 'InventoryComponent',
        data: { capacity: 24, dropOnDeath: true },
      },
      {
        id: 'physics_player',
        type: 'PhysicsComponent',
        data: { solid: true, mass: 1.0, pushable: true },
      },
    ],
  },
  {
    id: 'zombie',
    name: 'Zombie',
    tags: ['enemy', 'living', 'hostile', 'undead', 'monster'],
    components: [
      {
        id: 'name_zombie',
        type: 'NameComponent',
        data: { name: 'Zombie' },
      },
      {
        id: 'health_zombie',
        type: 'HealthComponent',
        data: { maxHealth: 100, currentHealth: 100, invulnerable: false },
      },
      {
        id: 'movement_zombie',
        type: 'MovementComponent',
        data: { speed: 2.0, canFly: false, canSwim: true },
      },
      {
        id: 'style_zombie',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '🧟', size: 40, scale: 1.0 },
      },
      {
        id: 'combat_zombie',
        type: 'CombatComponent',
        data: { damage: 15, attackRange: 32, attackCooldown: 1.2 },
      },
      {
        id: 'ai_zombie',
        type: 'AIComponent',
        data: { behavior: 'hostile', detectionRadius: 160 },
      },
      {
        id: 'physics_zombie',
        type: 'PhysicsComponent',
        data: { solid: true, mass: 1.2, pushable: true },
      },
      {
        id: 'spawn_zombie',
        type: 'EntitySpawnComponent',
        data: {
          enabled: true,
          time: {
            allowed: ['night'],
          },
          quantity: {
            min: 1,
            max: 2,
          },
          rate: 12,
          chance: 0.20,
          maxNearby: 5,
          distance: {
            min: 20,
            max: 60,
          },
          allowedBiomes: ['plains', 'forest', 'dense_forest', 'swamp', 'desert'],
          deniedBiomes: ['ocean', 'river'],
          allowedBlocks: ['grass', 'dense_grass', 'sand', 'stone'],
          deniedBlocks: ['water', 'deep_water'],
          allowedTags: ['solid', 'natural_ground'],
          deniedTags: ['liquid'],
          allowWater: false,
        },
      },
    ],
  },
  {
    id: 'skeleton',
    name: 'Esqueleto',
    tags: ['enemy', 'living', 'hostile', 'undead', 'monster'],
    components: [
      {
        id: 'name_skeleton',
        type: 'NameComponent',
        data: { name: 'Esqueleto' },
      },
      {
        id: 'health_skeleton',
        type: 'HealthComponent',
        data: { maxHealth: 80, currentHealth: 80, invulnerable: false },
      },
      {
        id: 'movement_skeleton',
        type: 'MovementComponent',
        data: { speed: 2.2, canFly: false, canSwim: true },
      },
      {
        id: 'style_skeleton',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '💀', size: 40, scale: 1.0 },
      },
      {
        id: 'combat_skeleton',
        type: 'CombatComponent',
        data: { damage: 12, attackRange: 96, attackCooldown: 1.5 },
      },
      {
        id: 'ai_skeleton',
        type: 'AIComponent',
        data: { behavior: 'hostile', detectionRadius: 180 },
      },
      {
        id: 'spawn_skeleton',
        type: 'EntitySpawnComponent',
        data: {
          enabled: true,
          time: {
            allowed: ['night'],
          },
          quantity: {
            min: 1,
            max: 2,
          },
          rate: 16,
          chance: 0.15,
          maxNearby: 4,
          distance: {
            min: 22,
            max: 60,
          },
          allowedBiomes: ['plains', 'forest', 'dense_forest', 'caves'],
          deniedBiomes: ['ocean', 'river', 'beach'],
          allowedBlocks: ['grass', 'dense_grass', 'stone'],
          deniedBlocks: ['water', 'deep_water'],
          allowedTags: ['solid'],
          deniedTags: ['liquid'],
          allowWater: false,
        },
      },
    ],
  },
  {
    id: 'cow',
    name: 'Vaca',
    tags: ['animal', 'living', 'passive'],
    components: [
      {
        id: 'name_cow',
        type: 'NameComponent',
        data: { name: 'Vaca' },
      },
      {
        id: 'health_cow',
        type: 'HealthComponent',
        data: { maxHealth: 50, currentHealth: 50, invulnerable: false },
      },
      {
        id: 'movement_cow',
        type: 'MovementComponent',
        data: { speed: 1.4, canFly: false, canSwim: true },
      },
      {
        id: 'style_cow',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '🐄', size: 42, scale: 1.0 },
      },
      {
        id: 'ai_cow',
        type: 'AIComponent',
        data: { behavior: 'passive', detectionRadius: 96 },
      },
      {
        id: 'spawn_cow',
        type: 'EntitySpawnComponent',
        data: {
          enabled: true,
          time: {
            allowed: ['day'],
          },
          quantity: {
            min: 1,
            max: 2,
          },
          rate: 20,
          chance: 0.18,
          maxNearby: 5,
          distance: {
            min: 14,
            max: 50,
          },
          allowedBiomes: ['plains', 'forest'],
          deniedBiomes: ['desert', 'ocean', 'caves', 'swamp'],
          allowedBlocks: ['grass', 'dense_grass'],
          deniedBlocks: ['water', 'deep_water', 'sand'],
          allowedTags: ['natural_ground', 'grass'],
          deniedTags: ['liquid'],
          allowWater: false,
        },
      },
    ],
  },
  {
    id: 'chicken',
    name: 'Galinha',
    tags: ['animal', 'living', 'passive', 'small'],
    components: [
      {
        id: 'name_chicken',
        type: 'NameComponent',
        data: { name: 'Galinha' },
      },
      {
        id: 'health_chicken',
        type: 'HealthComponent',
        data: { maxHealth: 20, currentHealth: 20, invulnerable: false },
      },
      {
        id: 'movement_chicken',
        type: 'MovementComponent',
        data: { speed: 1.8, canFly: false, canSwim: true },
      },
      {
        id: 'style_chicken',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '🐔', size: 34, scale: 0.9 },
      },
      {
        id: 'ai_chicken',
        type: 'AIComponent',
        data: { behavior: 'passive', detectionRadius: 80 },
      },
      {
        id: 'spawn_chicken',
        type: 'EntitySpawnComponent',
        data: {
          enabled: true,
          time: {
            allowed: ['day'],
          },
          quantity: {
            min: 1,
            max: 2,
          },
          rate: 18,
          chance: 0.16,
          maxNearby: 5,
          distance: {
            min: 12,
            max: 48,
          },
          allowedBiomes: ['plains', 'forest', 'dense_forest'],
          deniedBiomes: ['ocean', 'desert', 'caves', 'beach'],
          allowedBlocks: ['grass', 'dense_grass'],
          deniedBlocks: ['water', 'deep_water'],
          allowedTags: ['natural_ground', 'grass'],
          deniedTags: ['liquid'],
          allowWater: false,
        },
      },
    ],
  },
  {
    id: 'pig',
    name: 'Porco',
    tags: ['animal', 'living', 'passive'],
    components: [
      {
        id: 'name_pig',
        type: 'NameComponent',
        data: { name: 'Porco' },
      },
      {
        id: 'health_pig',
        type: 'HealthComponent',
        data: { maxHealth: 45, currentHealth: 45, invulnerable: false },
      },
      {
        id: 'movement_pig',
        type: 'MovementComponent',
        data: { speed: 1.5, canFly: false, canSwim: true },
      },
      {
        id: 'style_pig',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '🐷', size: 38, scale: 1.0 },
      },
      {
        id: 'ai_pig',
        type: 'AIComponent',
        data: { behavior: 'passive', detectionRadius: 90 },
      },
      {
        id: 'spawn_pig',
        type: 'EntitySpawnComponent',
        data: {
          enabled: true,
          time: {
            allowed: ['day'],
          },
          quantity: {
            min: 1,
            max: 2,
          },
          rate: 22,
          chance: 0.15,
          maxNearby: 5,
          distance: {
            min: 14,
            max: 50,
          },
          allowedBiomes: ['plains', 'forest'],
          deniedBiomes: ['desert', 'ocean', 'caves', 'swamp'],
          allowedBlocks: ['grass', 'dense_grass'],
          deniedBlocks: ['water', 'deep_water', 'sand'],
          allowedTags: ['natural_ground', 'grass'],
          deniedTags: ['liquid'],
          allowWater: false,
        },
      },
    ],
  },
  {
    id: 'slime',
    name: 'Slime',
    tags: ['monster', 'living', 'hostile'],
    components: [
      {
        id: 'name_slime',
        type: 'NameComponent',
        data: { name: 'Slime' },
      },
      {
        id: 'health_slime',
        type: 'HealthComponent',
        data: { maxHealth: 40, currentHealth: 40, invulnerable: false },
      },
      {
        id: 'movement_slime',
        type: 'MovementComponent',
        data: { speed: 1.8, canFly: false, canSwim: true },
      },
      {
        id: 'style_slime',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '🟢', size: 36, scale: 1.0 },
      },
      {
        id: 'combat_slime',
        type: 'CombatComponent',
        data: { damage: 8, attackRange: 24, attackCooldown: 0.8 },
      },
      {
        id: 'ai_slime',
        type: 'AIComponent',
        data: { behavior: 'hostile', detectionRadius: 140 },
      },
      {
        id: 'spawn_slime',
        type: 'EntitySpawnComponent',
        data: {
          enabled: true,
          time: {
            allowed: ['night'],
          },
          quantity: {
            min: 1,
            max: 2,
          },
          rate: 18,
          chance: 0.15,
          maxNearby: 4,
          distance: {
            min: 18,
            max: 55,
          },
          allowedBiomes: ['swamp', 'plains', 'beach'],
          deniedBiomes: ['desert', 'dense_forest'],
          allowedBlocks: ['grass', 'sand', 'water'],
          deniedBlocks: ['deep_water'],
          allowedTags: ['solid', 'liquid'],
          allowWater: true,
        },
      },
    ],
  },
  {
    id: 'merchant',
    name: 'Mercador',
    tags: ['npc', 'living', 'neutral', 'trader', 'special'],
    components: [
      {
        id: 'name_merchant',
        type: 'NameComponent',
        data: { name: 'Mercador' },
      },
      {
        id: 'health_merchant',
        type: 'HealthComponent',
        data: { maxHealth: 100, currentHealth: 100, invulnerable: false },
      },
      {
        id: 'movement_merchant',
        type: 'MovementComponent',
        data: { speed: 1.2, canFly: false, canSwim: true },
      },
      {
        id: 'style_merchant',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '🧙', size: 42, scale: 1.0 },
      },
      {
        id: 'inventory_merchant',
        type: 'InventoryComponent',
        data: { capacity: 32, dropOnDeath: false },
      },
      {
        id: 'ai_merchant',
        type: 'AIComponent',
        data: { behavior: 'neutral', detectionRadius: 120 },
      },
      {
        id: 'spawn_merchant',
        type: 'EntitySpawnComponent',
        data: {
          enabled: false,
          time: {
            allowed: ['day'],
          },
          quantity: {
            min: 1,
            max: 1,
          },
          rate: 60,
          chance: 0.05,
          maxNearby: 1,
          distance: {
            min: 25,
            max: 60,
          },
        },
      },
    ],
  },
];

export class EntityDatabase {
  private static readonly entities: Map<string, EntityDefinition> = new Map();
  private static initialized: boolean = false;

  private static ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;

    for (const json of CORE_ENTITIES_DATA) {
      try {
        const def = EntityDefinition.fromJSON(json);
        this.entities.set(def.id, def);
      } catch (err) {
        console.error(`[EntityDatabase] Error registering core entity "${json.id}":`, err);
      }
    }
  }

  static register(def: EntityDefinition): EntityDefinition {
    this.ensureInitialized();
    this.entities.set(def.id, def);
    return def;
  }

  static get(id: string): EntityDefinition | undefined {
    this.ensureInitialized();
    return this.entities.get(id);
  }

  static getAll(): EntityDefinition[] {
    this.ensureInitialized();
    return Array.from(this.entities.values());
  }

  static has(id: string): boolean {
    this.ensureInitialized();
    return this.entities.has(id);
  }

  static remove(id: string): boolean {
    this.ensureInitialized();
    return this.entities.delete(id);
  }
}

export const EntitySystem_db = EntityDatabase;
