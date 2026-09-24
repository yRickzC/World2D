/**
 * Content Type Registry
 * Extensible registry of content types supported by the Mod Workspace.
 * Each content type defines default folders, schemas, templates, and validations.
 */
import { ContentTypeDefinition } from './types';

export class ContentTypeRegistry {
  private static instance: ContentTypeRegistry;
  private types = new Map<string, ContentTypeDefinition>();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): ContentTypeRegistry {
    if (!ContentTypeRegistry.instance) {
      ContentTypeRegistry.instance = new ContentTypeRegistry();
    }
    return ContentTypeRegistry.instance;
  }

  public register<T = any>(def: ContentTypeDefinition<T>): void {
    this.types.set(def.type, def);
  }

  public get(type: string): ContentTypeDefinition | undefined {
    return this.types.get(type);
  }

  public getAll(): ContentTypeDefinition[] {
    return Array.from(this.types.values());
  }

  private registerDefaults(): void {
    // 1. Block
    this.register({
      type: 'block',
      label: 'Block',
      description: 'Bloco cúbico 2.5D com textura, colisão, resistência e iluminação.',
      defaultFolder: 'blocks',
      icon: '🧱',
      extension: '.json',
      createDefaultData: (modId: string, name: string, shortId: string) => ({
        id: `${modId}:${shortId}`,
        name: name.trim() || 'Novo Bloco',
        description: 'Bloco criado via Mod Workspace.',
        tags: ['solid'],
        components: [
          {
            id: 'solid_comp',
            type: 'SolidComponent',
            data: { solid: true },
          },
          {
            id: 'color_texture',
            type: 'ColorTextureComponent',
            data: {
              primaryColor: '#64748b',
              secondaryColor: '#334155',
              pattern: 'solid',
            },
          },
          {
            id: 'breakable_comp',
            type: 'BreakableComponent',
            data: {
              hardness: 1.5,
              effectiveTool: 'pickaxe',
            },
          },
        ],
      }),
    });

    // 2. Item
    this.register({
      type: 'item',
      label: 'Item',
      description: 'Objeto empilhável, ferramenta, consumível ou arma para o inventário.',
      defaultFolder: 'items',
      icon: '🗡️',
      extension: '.json',
      createDefaultData: (modId: string, name: string, shortId: string) => ({
        id: `${modId}:${shortId}`,
        nome: name.trim() || 'Novo Item',
        categoria: 'material',
        descricao: 'Item criado via Mod Workspace.',
        durabilidade: 100,
        durabilidadeMax: 100,
        raridade: 'comum',
        tags: ['material'],
        componentes: [
          {
            tipo: 'visual',
            dados: { icone: '📦', cor: '#3b82f6' },
          },
          {
            tipo: 'stack',
            dados: { maxStack: 64 },
          },
        ],
      }),
    });

    // 3. Entity
    this.register({
      type: 'entity',
      label: 'Entity',
      description: 'Entidade viva, criatura passiva ou hostil, monstro ou NPC no mundo.',
      defaultFolder: 'entities',
      icon: '👾',
      extension: '.json',
      createDefaultData: (modId: string, name: string, shortId: string) => ({
        id: `${modId}:${shortId}`,
        name: name.trim() || 'Nova Entidade',
        tags: ['living', 'passive'],
        components: [
          {
            id: 'name_comp',
            type: 'NameComponent',
            data: { name: name.trim() || 'Nova Entidade' },
          },
          {
            id: 'health_comp',
            type: 'HealthComponent',
            data: { maxHealth: 20, currentHealth: 20, invulnerable: false },
          },
          {
            id: 'style_comp',
            type: 'StyleComponent',
            data: { mode: 'emoji', value: '🦊', size: 36, scale: 1.0 },
          },
        ],
      }),
    });

    // 4. Biome
    this.register({
      type: 'biome',
      label: 'Biome',
      description: 'Região ecológica com regras de terreno, vegetação e clima.',
      defaultFolder: 'biomes',
      icon: '🌲',
      extension: '.json',
      createDefaultData: (modId: string, name: string, shortId: string) => ({
        id: `${modId}:${shortId}`,
        name: name.trim() || 'Novo Bioma',
        category: 'temperate',
        color: '#10b981',
        tags: ['biome'],
        components: [
          {
            id: 'biome_blocks',
            type: 'BiomeBlocksComponent',
            data: {
              surface: { block: 'core:grass', depth: 1 },
              soil: { block: 'core:dirt', depth: 3 },
              underground: { block: 'core:stone' },
            },
          },
        ],
      }),
    });

    // 5. Surface / World
    this.register({
      type: 'surface',
      label: 'Surface / World',
      description: 'Camada de superfície ou dimensão de geração procedural do mundo.',
      defaultFolder: 'surfaces',
      icon: '🗺️',
      extension: '.json',
      createDefaultData: (modId: string, name: string, shortId: string) => ({
        id: `${modId}:${shortId}`,
        name: name.trim() || 'Nova Superfície',
        seed: 12345,
        surfaces: [],
      }),
    });

    // 6. Recipe
    this.register({
      type: 'recipe',
      label: 'Recipe',
      description: 'Receita de fabricação na bancada ou manual do jogador.',
      defaultFolder: 'recipes',
      icon: '🔨',
      extension: '.json',
      createDefaultData: (modId: string, name: string, shortId: string) => ({
        id: `${modId}:recipe_${shortId}`,
        name: name.trim() || 'Nova Receita',
        category: 'materials',
        categoryName: 'Materiais',
        result: {
          type: `${modId}:${shortId}`,
          count: 1,
        },
        ingredients: [
          {
            type: 'core:stone',
            count: 4,
          },
        ],
      }),
    });

    // 7. Tag
    this.register({
      type: 'tag',
      label: 'Tag',
      description: 'Definição de agrupamento semântico de blocos, itens ou entidades.',
      defaultFolder: 'tags',
      icon: '🏷️',
      extension: '.json',
      createDefaultData: (_modId: string, name: string, shortId: string) => ({
        name: shortId.toLowerCase(),
        description: `Tag ${name} para agrupamento de conteúdo.`,
        category: 'general',
      }),
    });
  }
}

export const globalContentTypeRegistry = ContentTypeRegistry.getInstance();
