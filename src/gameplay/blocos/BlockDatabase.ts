import { BlockDefinition, BlockDefinitionData } from './BlockDefinition';
import {
  BreakableComponent,
  ColorTextureComponent,
  EmojiIconComponent,
  FluidComponent,
  LightComponent,
  SideTextureComponent,
  SolidComponent,
  TopTextureComponent,
} from './componentes';
import { BLOCK_TAGS } from './tags/BlockTags';
import { BlockSystem_db } from '../BlockSystem/BlockDB';

/**
 * Registry & Database of Blocks.
 * Centralized repository containing full BlockDefinitions with their components and tags.
 * Integrates directly with BlockSystem_db.
 */
export class BlockDatabase {
  private static readonly blocks: Map<string, BlockDefinition> = new Map();

  /**
   * Register a new block definition in the database.
   */
  static register(dataOrDef: BlockDefinition | BlockDefinitionData): BlockDefinition {
    const def = dataOrDef instanceof BlockDefinition ? dataOrDef : new BlockDefinition(dataOrDef);
    this.blocks.set(def.id, def);
    return def;
  }

  /**
   * Get a block definition by id, or undefined if not found.
   */
  static get(id: string): BlockDefinition | any {
    return this.blocks.get(id) || BlockSystem_db.get(id);
  }

  /**
   * Get a block definition with fallback.
   */
  static getBlock(id: string): BlockDefinition | any {
    const block = this.blocks.get(id);
    if (block) return block;

    const sysBlock = BlockSystem_db.get(id);
    if (sysBlock) return sysBlock;

    // Safe fallback for unlisted blocks
    return new BlockDefinition({
      id,
      name: id,
      tags: [BLOCK_TAGS.GROUND, BLOCK_TAGS.WALKABLE],
      components: [
        new EmojiIconComponent({ emoji: '⬛' }),
        new ColorTextureComponent({ primaryColor: '#334155' }),
        new SolidComponent({ solid: false }),
      ],
    });
  }

  /**
   * Get all registered blocks.
   */
  static getAll(): BlockDefinition[] {
    return Array.from(this.blocks.values());
  }

  /**
   * Find blocks by tag.
   * Example: BlockDatabase.getByTag(BLOCK_TAGS.MINEABLE)
   */
  static getByTag(tag: string): BlockDefinition[] {
    return this.getAll().filter((block) => block.hasTag(tag));
  }

  /**
   * Find blocks that have a specific component.
   */
  static getWithComponent<T extends any>(componentTarget: any): BlockDefinition[] {
    return this.getAll().filter((block) => block.hasComponent(componentTarget));
  }
}

// --------------------------------------------------------------------------
// Default Registrations (All blocks composed from reusable components and tags)
// --------------------------------------------------------------------------

// 1. Grama (Grass) - Pure visual & ground components
BlockDatabase.register({
  id: 'grass',
  name: 'Grama Silvestre',
  tags: [BLOCK_TAGS.GROUND, BLOCK_TAGS.SOIL, BLOCK_TAGS.GRASS, BLOCK_TAGS.WALKABLE, BLOCK_TAGS.PLANTABLE, BLOCK_TAGS.DIGGABLE],
  components: [
    new EmojiIconComponent({ emoji: '🌱' }),
    new ColorTextureComponent({
      primaryColor: '#4ade80',
      secondaryColor: '#45d47a',
      pattern: 'blades',
    }),
    new TopTextureComponent({
      primaryColor: '#4ade80',
      secondaryColor: '#15803d',
      pattern: 'blades',
    }),
    new SideTextureComponent({
      primaryColor: '#5c3a21',
      secondaryColor: '#452711',
      pattern: 'dirt_depth',
      defaultWallHeight: 12,
    }),
    new SolidComponent({ solid: false }),
    new BreakableComponent({
      hardness: 1,
      requiredToolTag: 'shovel',
      minToolStrength: 1,
      dropItems: [{ type: 'seed', count: 1, chance: 0.35 }],
    }),
  ],
});

// 2. Grama Densa (Dense Grass)
BlockDatabase.register({
  id: 'dense_grass',
  name: 'Grama Densa',
  tags: [BLOCK_TAGS.GROUND, BLOCK_TAGS.SOIL, BLOCK_TAGS.GRASS, BLOCK_TAGS.WALKABLE, BLOCK_TAGS.PLANTABLE, BLOCK_TAGS.DIGGABLE],
  components: [
    new EmojiIconComponent({ emoji: '🌿' }),
    new ColorTextureComponent({
      primaryColor: '#22c55e',
      secondaryColor: '#16a34a',
      pattern: 'blades',
    }),
    new TopTextureComponent({
      primaryColor: '#22c55e',
      secondaryColor: '#15803d',
      pattern: 'blades',
    }),
    new SideTextureComponent({
      primaryColor: '#452711',
      secondaryColor: '#2e190b',
      pattern: 'dirt_depth',
      defaultWallHeight: 12,
    }),
    new SolidComponent({ solid: false }),
    new BreakableComponent({
      hardness: 1,
      requiredToolTag: 'shovel',
      minToolStrength: 1,
      dropItems: [{ type: 'seed', count: 1, chance: 0.5 }],
    }),
  ],
});

// 2b. Terra Fértil (Fertile Soil / Dirt)
BlockDatabase.register({
  id: 'dirt',
  name: 'Terra Fértil',
  tags: [BLOCK_TAGS.GROUND, BLOCK_TAGS.SOIL, BLOCK_TAGS.WALKABLE, BLOCK_TAGS.PLANTABLE, BLOCK_TAGS.DIGGABLE],
  components: [
    new EmojiIconComponent({ emoji: '🟫' }),
    new ColorTextureComponent({
      primaryColor: '#5c3a21',
      secondaryColor: '#452711',
      pattern: 'plain',
    }),
    new TopTextureComponent({
      primaryColor: '#5c3a21',
      secondaryColor: '#452711',
      pattern: 'plain',
    }),
    new SideTextureComponent({
      primaryColor: '#5c3a21',
      secondaryColor: '#452711',
      pattern: 'dirt_depth',
      defaultWallHeight: 12,
    }),
    new SolidComponent({ solid: false }),
    new BreakableComponent({
      hardness: 1,
      requiredToolTag: 'shovel',
      minToolStrength: 1,
      dropItems: [{ type: 'fiber', count: 1, chance: 0.5 }],
    }),
  ],
});

// 3. Areia (Sand)
BlockDatabase.register({
  id: 'sand',
  name: 'Areia Costeira',
  tags: [BLOCK_TAGS.GROUND, BLOCK_TAGS.SAND, BLOCK_TAGS.WALKABLE, BLOCK_TAGS.DIGGABLE],
  components: [
    new EmojiIconComponent({ emoji: '🏖️' }),
    new ColorTextureComponent({
      primaryColor: '#e2c589',
      secondaryColor: '#cbb070',
      pattern: 'speckle',
    }),
    new TopTextureComponent({
      primaryColor: '#e2c589',
      secondaryColor: '#cbb070',
      pattern: 'speckle',
    }),
    new SideTextureComponent({
      primaryColor: '#b89d6c',
      secondaryColor: '#967c4f',
      pattern: 'shaded_bevel',
      defaultWallHeight: 10,
    }),
    new SolidComponent({ solid: false }),
    new BreakableComponent({
      hardness: 1,
      requiredToolTag: 'shovel',
      minToolStrength: 1,
      dropItems: [],
    }),
  ],
});

// 4. Água (Water) - Fluid component
BlockDatabase.register({
  id: 'water',
  name: 'Água Rasa',
  tags: [BLOCK_TAGS.FLUID, BLOCK_TAGS.WATER],
  components: [
    new EmojiIconComponent({ emoji: '💧' }),
    new ColorTextureComponent({
      primaryColor: '#38bdf8',
      secondaryColor: 'rgba(255, 255, 255, 0.35)',
      pattern: 'wave',
    }),
    new TopTextureComponent({
      primaryColor: '#38bdf8',
      secondaryColor: 'rgba(255, 255, 255, 0.4)',
      pattern: 'wave',
    }),
    new SolidComponent({ solid: false }),
    new FluidComponent({
      isFluid: true,
      swimSpeedMultiplier: 0.65,
      drownHazard: false,
    }),
  ],
});

// 5. Água Profunda (Deep Water)
BlockDatabase.register({
  id: 'deep_water',
  name: 'Água Profunda',
  tags: [BLOCK_TAGS.FLUID, BLOCK_TAGS.WATER, BLOCK_TAGS.UNNAVIGABLE],
  components: [
    new EmojiIconComponent({ emoji: '🌊' }),
    new ColorTextureComponent({
      primaryColor: '#1d4ed8',
      secondaryColor: '#2563eb',
      pattern: 'wave',
    }),
    new TopTextureComponent({
      primaryColor: '#1d4ed8',
      secondaryColor: '#2563eb',
      pattern: 'wave',
    }),
    new SolidComponent({ solid: true }), // Unnavigable on foot
    new FluidComponent({
      isFluid: true,
      swimSpeedMultiplier: 0.3,
      drownHazard: true,
    }),
  ],
});

// 6. Pedra (Stone) - Mineable, Solid, Breakable
BlockDatabase.register({
  id: 'stone',
  name: 'Rocha Sólida',
  tags: [BLOCK_TAGS.SOLID, BLOCK_TAGS.STONE, BLOCK_TAGS.MINEABLE],
  components: [
    new EmojiIconComponent({ emoji: '🪨' }),
    new ColorTextureComponent({
      primaryColor: '#64748b',
      secondaryColor: '#475569',
      pattern: 'checker',
    }),
    new TopTextureComponent({
      primaryColor: '#64748b',
      secondaryColor: '#475569',
      accentColor: '#334155',
      pattern: 'stone_cobble',
    }),
    new SideTextureComponent({
      primaryColor: '#475569',
      secondaryColor: '#334155',
      shadowColor: 'rgba(0, 0, 0, 0.45)',
      pattern: 'stone_brick',
      defaultWallHeight: 14,
    }),
    new SolidComponent({ solid: true }),
    new BreakableComponent({
      hardness: 4,
      requiredToolTag: 'pickaxe',
      minToolStrength: 1,
      dropItems: [{ type: 'stick', count: 2, chance: 0.5 }],
    }),
  ],
});

// 7. Prancha de Madeira (Wood Plank) - Choppable, Solid, Breakable
// Distinct top surface texture (floor planks) and lateral wall face texture (wood planks course)
BlockDatabase.register({
  id: 'wood_plank',
  name: 'Prancha de Madeira',
  tags: [BLOCK_TAGS.SOLID, BLOCK_TAGS.WOOD, BLOCK_TAGS.CHOPPABLE, 'plank', 'buildable'],
  components: [
    new EmojiIconComponent({ emoji: '🪵' }),
    new ColorTextureComponent({
      primaryColor: '#b45309',
      secondaryColor: '#92400e',
      pattern: 'plain',
    }),
    new TopTextureComponent({
      primaryColor: '#d97706',
      secondaryColor: '#b45309',
      accentColor: 'rgba(69, 26, 3, 0.25)',
      pattern: 'wood_planks',
    }),
    new SideTextureComponent({
      primaryColor: '#92400e',
      secondaryColor: '#78350f',
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      accentColor: 'rgba(255, 255, 255, 0.1)',
      pattern: 'wood_planks',
      defaultWallHeight: 14,
    }),
    new SolidComponent({ solid: true }),
    new BreakableComponent({
      hardness: 2,
      requiredToolTag: 'axe',
      minToolStrength: 1,
      dropItems: [{ type: 'wood', count: 1, chance: 1.0 }],
    }),
  ],
});

// 8. Chão Cavado (Dug Ground / Escavação de Terra)
BlockDatabase.register({
  id: 'dug_dirt',
  name: 'Chão Cavado',
  tags: [BLOCK_TAGS.GROUND, 'dug', 'trench', 'hollow', BLOCK_TAGS.WALKABLE],
  components: [
    new EmojiIconComponent({ emoji: '🕳️' }),
    new ColorTextureComponent({
      primaryColor: '#2b1810',
      secondaryColor: '#452711',
      pattern: 'plain',
    }),
    new TopTextureComponent({
      primaryColor: '#2b1810',
      secondaryColor: '#452711',
      accentColor: '#150904',
      pattern: 'dug_pit',
    }),
    new SideTextureComponent({
      primaryColor: '#382014',
      secondaryColor: '#22120b',
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      pattern: 'dirt_depth',
      defaultWallHeight: 8,
    }),
    new SolidComponent({ solid: false }),
    new BreakableComponent({
      hardness: 1,
      requiredToolTag: 'shovel',
      minToolStrength: 1,
      dropItems: [],
    }),
  ],
});

// 9. Tocha (Torch) - Light component & breakable
BlockDatabase.register({
  id: 'torch',
  name: 'Tocha Acesa',
  tags: [BLOCK_TAGS.LIGHT_SOURCE, BLOCK_TAGS.WALKABLE],
  components: [
    new EmojiIconComponent({ emoji: '🔥' }),
    new LightComponent({
      intensity: 0.95,
      radius: 140,
      color: '#f59e0b',
    }),
    new SolidComponent({ solid: false }),
    new BreakableComponent({
      hardness: 1,
      dropItems: [{ type: 'stick', count: 1, chance: 1.0 }],
    }),
  ],
});
