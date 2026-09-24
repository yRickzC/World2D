import { ItemType } from '../../core/configuracao/types';
import {
  BreakComponent,
  ColorVisualComponent,
  ConsumableComponent,
  DescriptionComponent,
  EmojiVisualComponent,
  LightComponent,
  PlaceableComponent,
  PlantableComponent,
  StackComponent,
  SvgVisualComponent,
  ToolComponent,
  WaterComponent,
} from './componentes';
import { ItemDefinition, ItemDefinitionData } from './ItemDefinition';

/**
 * Registry & Database of Items.
 * Centralized, data-driven repository containing full ItemDefinitions with their components.
 * Architectural rule:
 * Item
 * ├── id
 * ├── nome
 * ├── categoria
 * └── components
 *     ├── Component A
 *     ├── Component B
 *     └── Component N
 * Components determine behavior. Category determines fixed classification.
 */
export class ItemDatabase {
  private static readonly items: Map<string, ItemDefinition> = new Map();

  /**
   * Register a new item definition in the database.
   */
  static register(dataOrDef: ItemDefinition | ItemDefinitionData): ItemDefinition {
    const def = dataOrDef instanceof ItemDefinition ? dataOrDef : new ItemDefinition(dataOrDef);
    this.items.set(def.id, def);
    return def;
  }

  /**
   * Get an item definition by id, or undefined if not registered.
   */
  static get(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }

  /**
   * Get an item definition by id with a safe default fallback.
   */
  static getItem(id: string): ItemDefinition {
    const item = this.items.get(id);
    if (item) return item;

    // Safe fallback for unlisted items
    return new ItemDefinition({
      id: id as ItemType,
      nome: id,
      categoria: 'material',
      components: [
        new StackComponent({ maxStack: 64 }),
        new EmojiVisualComponent({ emoji: '📦', accentColor: '#64748b' }),
        new DescriptionComponent({
          text: 'Um item recolhido no mundo.',
          categoryName: 'Item',
        }),
      ],
    });
  }

  /**
   * Get all registered items.
   */
  static getAll(): ItemDefinition[] {
    return Array.from(this.items.values());
  }

  /**
   * Find items that have a specific component.
   */
  static getWithComponent<T extends any>(componentTarget: any): ItemDefinition[] {
    return this.getAll().filter((item) => item.hasComponent(componentTarget));
  }
}

// --------------------------------------------------------------------------
// Default Registrations (All items composed from modular components)
// Root object has ONLY: id, nome, categoria, and components.
// --------------------------------------------------------------------------

// 1. Raw Materials
ItemDatabase.register({
  id: 'wood',
  nome: 'Madeira Bruta',
  categoria: 'material',
  components: [
    new StackComponent({ maxStack: 100 }),
    new EmojiVisualComponent({ emoji: '🪵', accentColor: '#92400e' }),
    new DescriptionComponent({
      text: 'Troncos resistentes cortados de árvores silvestres. Usado para construções e ferramentas.',
      categoryName: 'Material Básico',
      lore: 'Colhido das árvores antigas da floresta.',
    }),
    new PlaceableComponent({
      blockIdToPlace: 'wood_plank',
      validTileTags: ['walkable', 'ground', 'dug', 'solid', 'plank', 'buildable', 'soil'],
    }),
  ],
});

ItemDatabase.register({
  id: 'stick',
  nome: 'Graveto',
  categoria: 'material',
  components: [
    new StackComponent({ maxStack: 64 }),
    new EmojiVisualComponent({ emoji: '🥢', accentColor: '#b45309' }),
    new DescriptionComponent({
      text: 'Pequenos gravetos de madeira recolhidos da vegetação ou galhos caídos.',
      categoryName: 'Material',
    }),
  ],
});

ItemDatabase.register({
  id: 'fiber',
  nome: 'Fibras Vegetais',
  categoria: 'nature',
  components: [
    new StackComponent({ maxStack: 64 }),
    new EmojiVisualComponent({ emoji: '🌿', accentColor: '#16a34a' }),
    new DescriptionComponent({
      text: 'Fibras flexíveis e resistentes colhidas de folhagens e arbustos.',
      categoryName: 'Recurso Natural',
    }),
  ],
});

ItemDatabase.register({
  id: 'wood_plank',
  nome: 'Tábua de Madeira',
  categoria: 'material',
  components: [
    new StackComponent({ maxStack: 64 }),
    new ColorVisualComponent({
      color: '#b45309',
      shape: 'rounded',
      borderColor: '#78350f',
      accentColor: '#d97706',
      innerPattern: 'stripe',
      label: 'PLANK',
    }),
    new DescriptionComponent({
      text: 'Tábua de madeira aplainada e pronta para construção de pisos e estruturas.',
      categoryName: 'Material Refinado',
    }),
    new PlaceableComponent({
      blockIdToPlace: 'wood_plank',
      validTileTags: ['walkable', 'ground', 'dug', 'solid', 'plank', 'buildable', 'soil'],
    }),
  ],
});

ItemDatabase.register({
  id: 'stone',
  nome: 'Pedra Lascada',
  categoria: 'material',
  components: [
    new StackComponent({ maxStack: 64 }),
    new EmojiVisualComponent({ emoji: '🪨', accentColor: '#78716c' }),
    new DescriptionComponent({
      text: 'Fragmentos sólidos de rocha recolhidos do chão ou minerados de pedreiras.',
      categoryName: 'Material Mineral',
    }),
  ],
});

// 2. Consumable Foods
ItemDatabase.register({
  id: 'berries',
  nome: 'Bagas Silvestres',
  categoria: 'food',
  components: [
    new StackComponent({ maxStack: 64 }),
    new EmojiVisualComponent({ emoji: '🍓', accentColor: '#dc2626' }),
    new DescriptionComponent({
      text: 'Frutinhas vermelhas doces e suculentas coletadas de arbustos selvagens. Podem ser consumidas para restaurar energia!',
      categoryName: 'Alimento Silvestre',
      lore: 'Fruto colhido à beira dos bosques iluminados.',
    }),
    new ConsumableComponent({
      energyRestored: 15,
      healthRestored: 5,
      prompt: 'Comer com Botão Direito',
      soundEffect: 'eat',
    }),
  ],
});

ItemDatabase.register({
  id: 'apple',
  nome: 'Maçã Vermelha',
  categoria: 'food',
  components: [
    new StackComponent({ maxStack: 64 }),
    new EmojiVisualComponent({ emoji: '🍎', accentColor: '#ef4444' }),
    new DescriptionComponent({
      text: 'Uma maçã fresca e crocante que caiu das copas dos carvalhos.',
      categoryName: 'Alimento',
    }),
    new ConsumableComponent({
      energyRestored: 20,
      healthRestored: 10,
      prompt: 'Comer com Botão Direito',
      soundEffect: 'eat',
    }),
  ],
});

// 3. Nature & Plantables
ItemDatabase.register({
  id: 'seed',
  nome: 'Sementes Nativas',
  categoria: 'nature',
  components: [
    new StackComponent({ maxStack: 64 }),
    new EmojiVisualComponent({ emoji: '🌱', accentColor: '#65a30d' }),
    new DescriptionComponent({
      text: 'Pequenas sementes férteis coletadas da vegetação alta.',
      categoryName: 'Recurso Natural',
    }),
    new PlantableComponent({
      targetTileTags: ['soil', 'grass', 'plantable'],
      entityTypeToSpawn: 'tall_grass',
    }),
  ],
});

ItemDatabase.register({
  id: 'flower',
  nome: 'Flor Silvestre',
  categoria: 'nature',
  components: [
    new StackComponent({ maxStack: 64 }),
    new EmojiVisualComponent({ emoji: '🌸', accentColor: '#d946ef' }),
    new DescriptionComponent({
      text: 'Uma flor de pétalas perfumadas e cores vibrantes encontrada nas campinas abertas.',
      categoryName: 'Flora Rara',
    }),
    new PlantableComponent({
      targetTileTags: ['soil', 'grass', 'plantable'],
      entityTypeToSpawn: 'flower',
    }),
  ],
});

// 4. Tools: Axes (Wooden, Stone, Iron) using BreakComponent
ItemDatabase.register({
  id: 'wooden_axe',
  nome: 'Machado Rústico',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '🪓', accentColor: '#d97706' }),
    new DescriptionComponent({
      text: 'Machado simples de madeira para agilizar o corte de troncos e galhos.',
      categoryName: 'Ferramenta',
    }),
    new ToolComponent({ toolType: 'axe', maxDurability: 60 }),
    new BreakComponent({
      toolTag: 'axe',
      strength: 3,
      damage: 2,
      speed: 1.2,
    }),
  ],
});

ItemDatabase.register({
  id: 'stone_axe',
  nome: 'Machado de Pedra',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '🪓', accentColor: '#78716c' }),
    new DescriptionComponent({
      text: 'Machado robusto com lâmina de pedra lascada. Corta madeira com mais rapidez.',
      categoryName: 'Ferramenta',
    }),
    new ToolComponent({ toolType: 'axe', maxDurability: 130 }),
    new BreakComponent({
      toolTag: 'axe',
      strength: 5,
      damage: 3,
      speed: 1.5,
    }),
  ],
});

ItemDatabase.register({
  id: 'iron_axe',
  nome: 'Machado de Ferro',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '🪓', accentColor: '#94a3b8' }),
    new DescriptionComponent({
      text: 'Machado de ferro forjado de alta durabilidade e corte afiado.',
      categoryName: 'Ferramenta',
    }),
    new ToolComponent({ toolType: 'axe', maxDurability: 250 }),
    new BreakComponent({
      toolTag: 'axe',
      strength: 8,
      damage: 5,
      speed: 1.9,
    }),
  ],
});

// 5. Tools: Pickaxes (Wooden, Stone, Iron, Diamond) using BreakComponent
ItemDatabase.register({
  id: 'wooden_pickaxe',
  nome: 'Picareta de Madeira',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '⛏️', accentColor: '#b45309' }),
    new DescriptionComponent({
      text: 'Picareta rudimentar de madeira para quebrar pequenos blocos de pedra.',
      categoryName: 'Ferramenta',
    }),
    new ToolComponent({ toolType: 'pickaxe', maxDurability: 60 }),
    new BreakComponent({
      toolTag: 'pickaxe',
      strength: 3,
      damage: 2,
      speed: 1.2,
    }),
  ],
});

ItemDatabase.register({
  id: 'stone_pickaxe',
  nome: 'Picareta de Pedra',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '⛏️', accentColor: '#64748b' }),
    new DescriptionComponent({
      text: 'Picareta com ponta de pedra rígida, ideal para minerar minérios comuns.',
      categoryName: 'Ferramenta',
    }),
    new ToolComponent({ toolType: 'pickaxe', maxDurability: 130 }),
    new BreakComponent({
      toolTag: 'pickaxe',
      strength: 5,
      damage: 3,
      speed: 1.5,
    }),
  ],
});

ItemDatabase.register({
  id: 'iron_pickaxe',
  nome: 'Picareta de Ferro',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '⛏️', accentColor: '#cbd5e1' }),
    new DescriptionComponent({
      text: 'Picareta pesada de ferro forjado capaz de perfurar as rochas mais duras.',
      categoryName: 'Ferramenta',
    }),
    new ToolComponent({ toolType: 'pickaxe', maxDurability: 250 }),
    new BreakComponent({
      toolTag: 'pickaxe',
      strength: 8,
      damage: 5,
      speed: 2.0,
    }),
  ],
});

ItemDatabase.register({
  id: 'diamond_pickaxe',
  nome: 'Picareta de Diamante',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '💎', accentColor: '#38bdf8' }),
    new DescriptionComponent({
      text: 'Picareta lendária de diamante reluzente. Mineração com força e velocidade incomparáveis.',
      categoryName: 'Ferramenta Rara',
      lore: 'Forjada com os cristais mais puros do subterrâneo.',
    }),
    new ToolComponent({ toolType: 'pickaxe', maxDurability: 1500 }),
    new BreakComponent({
      toolTag: 'pickaxe',
      strength: 12,
      damage: 8,
      speed: 2.5,
    }),
  ],
});

// 6. Tools: Shovel
ItemDatabase.register({
  id: 'wooden_shovel',
  nome: 'Pá Rústica',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '🥄', accentColor: '#92400e' }),
    new DescriptionComponent({
      text: 'Pá de madeira leve para escavar areia, terra e cascalho.',
      categoryName: 'Ferramenta',
    }),
    new ToolComponent({ toolType: 'shovel', maxDurability: 60 }),
    new BreakComponent({
      toolTag: 'shovel',
      strength: 3,
      damage: 1,
      speed: 1.4,
    }),
  ],
});

// 7. Special Tools: Regador (WaterComponent) & Tocha (LightComponent + SvgVisualComponent)
ItemDatabase.register({
  id: 'watering_can',
  nome: 'Regador de Metal',
  categoria: 'tool',
  components: [
    new StackComponent({ maxStack: 1 }),
    new EmojiVisualComponent({ emoji: '🫗', accentColor: '#0ea5e9' }),
    new DescriptionComponent({
      text: 'Regador para irrigar plantios e manter a terra úmida.',
      categoryName: 'Utilitário',
    }),
    new ToolComponent({ toolType: 'watering_tool' }),
    new WaterComponent({ capacity: 100, waterLevel: 100, moisturePower: 15 }),
  ],
});

ItemDatabase.register({
  id: 'torch',
  nome: 'Tocha de Campina',
  categoria: 'material',
  components: [
    new StackComponent({ maxStack: 64 }),
    new SvgVisualComponent({
      svgPath:
        'M12 2c-1.5 2.5-3 5-3 7.5 0 2 1.5 3.5 3 4.5 1.5-1 3-2.5 3-4.5 0-2.5-1.5-5-3-7.5zm-1 12.5v7.5h2v-7.5c-.3.1-.7.2-1 .2s-.7-.1-1-.2z',
      accentColor: '#f59e0b',
      fill: '#f59e0b',
      viewBox: '0 0 24 24',
      fallbackEmoji: '🔥',
    }),
    new DescriptionComponent({
      text: 'Tocha acesa com resina e carvão que projeta luz calorosa ao seu redor.',
      categoryName: 'Iluminação',
    }),
    new LightComponent({ intensity: 0.9, radius: 130, color: '#f59e0b' }),
    new PlaceableComponent({
      blockIdToPlace: 'torch',
      validTileTags: ['walkable', 'ground'],
    }),
  ],
});
