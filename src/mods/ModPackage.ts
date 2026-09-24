/**
 * Mod Package Factory & Serialization
 * Manages construction of Core content, sample mods, cloning, and export formats.
 */
import { ModPackage } from './types';
import { CORE_BLOCKS_DATA } from '../gameplay/BlockSystem/data/blocks';
import { CORE_ITEM_DEFINITIONS } from '../gameplay/ItemSystem/data/items';
import { CORE_ENTITIES_DATA } from '../gameplay/EntitySystem/EntityDB';
import { globalBiomeRegistry } from '../gameplay/mundo/biomas/BiomeRegistry';
import { globalWorldRegistry } from '../gameplay/mundo/WorldRegistry';

export class ModPackageHelper {
  /**
   * Generates the immutable Core Package representation.
   */
  static getCorePackage(): ModPackage {
    // Core Biomes from BiomeRegistry
    const coreBiomes = globalBiomeRegistry.toJSON().map((b) => ({
      ...b,
      id: b.id.startsWith('core:') ? b.id : `core:${b.id}`,
    }));

    // Core Surfaces / Worlds from WorldRegistry
    const coreWorlds = globalWorldRegistry.getAll().map((w) => {
      const json = w.toJSON();
      return {
        ...json,
        id: json.id.startsWith('core:') ? json.id : `core:${json.id}`,
      };
    });

    // Core Tags
    const coreTags = [
      'ground',
      'soil',
      'grass',
      'walkable',
      'solid',
      'plantable',
      'diggable',
      'water',
      'liquid',
      'ore',
      'building',
      'wood',
      'stone',
      'transparent',
      'light_source',
      'tool',
      'pickaxe',
      'axe',
      'shovel',
      'weapon',
      'sword',
      'food',
      'consumable',
      'material',
      'living',
      'hostile',
      'passive',
      'player',
    ];

    // Core Component metadata
    const coreComponents = [
      { id: 'ColorTextureComponent', domain: 'block', name: 'Color Texture', description: 'Cores e padrões gráficos do bloco' },
      { id: 'TopTextureComponent', domain: 'block', name: 'Top Texture', description: 'Textura superior do bloco em vista 2D' },
      { id: 'SideTextureComponent', domain: 'block', name: 'Side Texture', description: 'Textura lateral e profundidade de parede' },
      { id: 'EmojiIconComponent', domain: 'block/item', name: 'Emoji Icon', description: 'Ícone de fallback em emoji' },
      { id: 'SolidComponent', domain: 'block', name: 'Solid Physics', description: 'Define colisão física sólida para entidades' },
      { id: 'BreakableComponent', domain: 'block', name: 'Breakable', description: 'Dureza, ferramenta necessária e itens soltos (drops)' },
      { id: 'LightEmitterComponent', domain: 'block', name: 'Light Emitter', description: 'Emissão de raio e cor de iluminação' },
      { id: 'ToolComponent', domain: 'item', name: 'Tool Power', description: 'Eficácia em quebra de blocos específicos' },
      { id: 'WeaponComponent', domain: 'item', name: 'Weapon Damage', description: 'Dano de combate e alcance' },
      { id: 'FoodComponent', domain: 'item', name: 'Food Nutrition', description: 'Restauração de vida e fome' },
      { id: 'HealthComponent', domain: 'entity', name: 'Entity Health', description: 'Pontos de vida e invulnerabilidade' },
      { id: 'MovementComponent', domain: 'entity', name: 'Entity Movement', description: 'Velocidade, voo e capacidade de nadar' },
      { id: 'StyleComponent', domain: 'entity', name: 'Entity Visual Style', description: 'Aparência visual e escala de renderização' },
      { id: 'GroundComponent', domain: 'biome/surface', name: 'Ground Layer', description: 'Composição de camadas de solo e elevação' },
      { id: 'BiomeVegetationComponent', domain: 'biome', name: 'Vegetation Spawner', description: 'Distribuição procedural de árvores e plantas' },
      { id: 'BiomeClimateOverrideComponent', domain: 'biome', name: 'Climate Override', description: 'Controle de chuva, neblina e temperatura' },
    ];

    return {
      manifest: {
        id: 'core',
        name: 'Core System',
        version: '1.0.0',
        author: 'Core Game Engine',
        description: 'Núcleo central do jogo contendo os sistemas fundamentais e o conteúdo básico.',
        dependencies: {},
        createdAt: 1700000000000,
        updatedAt: Date.now(),
      },
      isCore: true,
      content: {
        blocks: (CORE_BLOCKS_DATA as any[]).map((b) => ({
          ...b,
          id: b.id.startsWith('core:') ? b.id : `core:${b.id}`,
        })),
        items: (CORE_ITEM_DEFINITIONS as any[]).map((i) => ({
          ...i,
          id: i.id.startsWith('core:') ? i.id : `core:${i.id}`,
        })),
        entities: (CORE_ENTITIES_DATA as any[]).map((e) => ({
          ...e,
          id: e.id.startsWith('core:') ? e.id : `core:${e.id}`,
        })),
        biomes: coreBiomes,
        surfaces: coreWorlds,
        components: coreComponents,
        recipes: [],
        tags: coreTags,
        patches: [],
        assets: {},
      },
    };
  }

  /**
   * Sample: Nature Mod
   */
  static getNatureModSample(): ModPackage {
    return {
      manifest: {
        id: 'nature_mod',
        name: 'Nature Mod',
        version: '1.0.0',
        author: 'Nature Crafter',
        description: 'Adiciona novos biomas de floresta mágica, cristais da natureza e blocos orgânicos luminosos.',
        dependencies: {
          core: '>=1.0.0',
        },
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
      },
      content: {
        blocks: [
          {
            id: 'nature_mod:crystal_block',
            name: 'Bloco de Cristal Mágico',
            category: 'building',
            tags: ['building', 'solid', 'crystal', 'transparent'],
            components: [
              {
                id: 'emoji_crystal',
                type: 'EmojiIconComponent',
                data: { emoji: '💎' },
              },
              {
                id: 'colortex_crystal',
                type: 'ColorTextureComponent',
                data: {
                  primaryColor: '#38bdf8',
                  secondaryColor: '#0284c7',
                  pattern: 'crystals',
                },
              },
              {
                id: 'solid_crystal',
                type: 'SolidComponent',
                data: { solid: true },
              },
              {
                id: 'light_crystal',
                type: 'LightEmitterComponent',
                data: { radius: 4, color: '#38bdf8', intensity: 0.6 },
              },
            ],
          },
          {
            id: 'nature_mod:glowing_moss',
            name: 'Musgo Brilhante',
            category: 'natural',
            tags: ['ground', 'soil', 'walkable', 'light_source'],
            components: [
              {
                id: 'emoji_moss',
                type: 'EmojiIconComponent',
                data: { emoji: '🌿' },
              },
              {
                id: 'colortex_moss',
                type: 'ColorTextureComponent',
                data: {
                  primaryColor: '#a3e635',
                  secondaryColor: '#65a30d',
                  pattern: 'blades',
                },
              },
              {
                id: 'solid_moss',
                type: 'SolidComponent',
                data: { solid: false },
              },
            ],
          },
        ],
        items: [
          {
            id: 'nature_mod:magic_sword',
            nome: 'Espada Mágica de Cristal',
            categoria: 'weapon',
            descricao: 'Lâmina forjada com energia concentrada das florestas ancestrais.',
            durabilidade: 350,
            durabilidadeMax: 350,
            raridade: 'epico',
            tags: ['weapon', 'sword', 'magic', 'crystal'],
            componentes: [
              {
                tipo: 'weapon',
                dados: { dano: 28, tipoDano: 'magico', alcance: 2.2, velocidadeAtaque: 1.4 },
              },
              {
                tipo: 'visual',
                dados: { icone: '🗡️', cor: '#38bdf8' },
              },
            ],
          },
          {
            id: 'nature_mod:crystal_shard',
            nome: 'Fragmento de Cristal',
            categoria: 'material',
            descricao: 'Material reluzente colhido de formações minerais arcanas.',
            durabilidade: 1,
            durabilidadeMax: 1,
            raridade: 'raro',
            tags: ['material', 'crystal', 'crafting'],
            componentes: [
              {
                tipo: 'stack',
                dados: { maxStack: 64 },
              },
              {
                tipo: 'visual',
                dados: { icone: '💎', cor: '#38bdf8' },
              },
            ],
          },
        ],
        entities: [
          {
            id: 'nature_mod:forest_spirit',
            name: 'Espírito da Floresta',
            tags: ['living', 'passive', 'nature', 'magical'],
            components: [
              {
                id: 'name_spirit',
                type: 'NameComponent',
                data: { name: 'Espírito da Floresta' },
              },
              {
                id: 'health_spirit',
                type: 'HealthComponent',
                data: { maxHealth: 80, currentHealth: 80, invulnerable: false },
              },
              {
                id: 'movement_spirit',
                type: 'MovementComponent',
                data: { speed: 4.2, canFly: true, canSwim: true },
              },
              {
                id: 'style_spirit',
                type: 'StyleComponent',
                data: { mode: 'emoji', value: '🧚', size: 36, scale: 1.0 },
              },
            ],
          },
        ],
        biomes: [
          {
            id: 'nature_mod:crystal_forest',
            name: 'Floresta de Cristais',
            tags: ['forest', 'magical', 'crystal', 'nature'],
            category: 'temperate',
            color: '#38bdf8',
            components: [
              {
                id: 'blocks_crystal_forest',
                type: 'BiomeBlocksComponent',
                data: {
                  surface: { block: 'nature_mod:glowing_moss', depth: 1 },
                  soil: { block: 'core:dirt', depth: 3 },
                  underground: { block: 'core:stone' },
                  water: { block: 'core:water' },
                },
              },
              {
                id: 'temp_crystal_forest',
                type: 'BiomeTemperatureComponent',
                data: { min: 14, max: 22, base: 18 },
              },
              {
                id: 'hum_crystal_forest',
                type: 'BiomeHumidityComponent',
                data: { min: 0.6, max: 0.9, base: 0.75 },
              },
            ],
          },
        ],
        surfaces: [],
        components: [],
        recipes: [
          {
            id: 'nature_mod:recipe_crystal_block',
            name: 'Bloco de Cristal Mágico',
            description: 'Funde 4 Fragmentos de Cristal em um Bloco Sólido',
            category: 'materials',
            categoryName: 'Materiais Arcanos',
            result: { type: 'nature_mod:crystal_block', count: 1 },
            ingredients: [{ type: 'nature_mod:crystal_shard', count: 4 }],
          },
        ],
        tags: ['crystal', 'magic', 'nature'],
        patches: [
          {
            id: 'patch_core_stone',
            targetId: 'core:stone',
            targetType: 'block',
            operation: 'PATCH',
            properties: {
              category: 'natural',
            },
            description: 'Expande propriedades de dureza para compatibilidade com ferramentas arcanas.',
          },
        ],
        assets: {},
      },
    };
  }

  /**
   * Sample: Test Mod
   */
  static getTestModSample(): ModPackage {
    return {
      manifest: {
        id: 'test_mod',
        name: 'Test Mod',
        version: '0.1.0',
        author: 'Mod Tester',
        description: 'Pacote de testes para prototipagem de novos blocos e ferramentas experimentais.',
        dependencies: {
          core: '>=1.0.0',
        },
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
      },
      content: {
        blocks: [
          {
            id: 'test_mod:test_brick',
            name: 'Tijolo de Teste',
            category: 'building',
            tags: ['building', 'solid'],
            components: [
              {
                id: 'emoji_brick',
                type: 'EmojiIconComponent',
                data: { emoji: '🧱' },
              },
              {
                id: 'colortex_brick',
                type: 'ColorTextureComponent',
                data: {
                  primaryColor: '#f59e0b',
                  secondaryColor: '#b45309',
                  pattern: 'bricks',
                },
              },
              {
                id: 'solid_brick',
                type: 'SolidComponent',
                data: { solid: true },
              },
            ],
          },
        ],
        items: [
          {
            id: 'test_mod:hammer',
            nome: 'Martelo de Forja',
            categoria: 'tool',
            descricao: 'Ferramenta pesada para testes mecânicos de impacto.',
            durabilidade: 200,
            durabilidadeMax: 200,
            raridade: 'comum',
            tags: ['tool', 'hammer'],
            componentes: [
              {
                tipo: 'tool',
                dados: { tipoFerramenta: 'hammer', forca: 20, velocidadeQuebra: 1.8 },
              },
              {
                tipo: 'visual',
                dados: { icone: '🔨', cor: '#f59e0b' },
              },
            ],
          },
        ],
        entities: [],
        biomes: [],
        surfaces: [],
        components: [],
        recipes: [],
        tags: ['hammer', 'experimental'],
        patches: [],
        assets: {},
      },
    };
  }

  /**
   * Duplicate a mod package with a new ID and update all contents' namespaces.
   */
  static duplicatePackage(original: ModPackage, newId: string, newName?: string): ModPackage {
    const cleanId = newId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const oldPrefix = `${original.manifest.id}:`;
    const newPrefix = `${cleanId}:`;

    const renameId = (id: string) => {
      if (!id) return id;
      if (id.startsWith(oldPrefix)) {
        return `${newPrefix}${id.slice(oldPrefix.length)}`;
      }
      return id;
    };

    const clonedContent = JSON.parse(JSON.stringify(original.content));

    // Update block IDs
    (clonedContent.blocks || []).forEach((b: any) => {
      b.id = renameId(b.id);
    });

    // Update item IDs
    (clonedContent.items || []).forEach((i: any) => {
      i.id = renameId(i.id);
    });

    // Update entity IDs
    (clonedContent.entities || []).forEach((e: any) => {
      e.id = renameId(e.id);
    });

    // Update biome IDs
    (clonedContent.biomes || []).forEach((bm: any) => {
      bm.id = renameId(bm.id);
    });

    // Update surface IDs
    (clonedContent.surfaces || []).forEach((s: any) => {
      s.id = renameId(s.id);
    });

    return {
      manifest: {
        ...original.manifest,
        id: cleanId,
        name: newName || `${original.manifest.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      content: clonedContent,
      isCore: false,
    };
  }
}
