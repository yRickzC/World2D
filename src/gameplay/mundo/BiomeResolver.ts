import { TileType } from '../../core/configuracao/types';

export interface BiomeInfo {
  id: string;
  name: string;
  category: 'temperate' | 'aquatic' | 'arid' | 'subterranean';
  color: string;
  ambientTags: string[];
}

export const BIOMES_REGISTRY: Record<string, BiomeInfo> = {
  plains: {
    id: 'plains',
    name: 'Planície',
    category: 'temperate',
    color: '#84cc16',
    ambientTags: ['open', 'pasture', 'grass'],
  },
  forest: {
    id: 'forest',
    name: 'Floresta',
    category: 'temperate',
    color: '#15803d',
    ambientTags: ['woodland', 'shaded', 'dense_vegetation'],
  },
  dense_forest: {
    id: 'dense_forest',
    name: 'Bosque Fechado',
    category: 'temperate',
    color: '#166534',
    ambientTags: ['woodland', 'dense_vegetation', 'wilderness'],
  },
  desert: {
    id: 'desert',
    name: 'Deserto',
    category: 'arid',
    color: '#facc15',
    ambientTags: ['arid', 'sand', 'dry'],
  },
  beach: {
    id: 'beach',
    name: 'Praia e Costa',
    category: 'arid',
    color: '#fef08a',
    ambientTags: ['coastal', 'sand', 'shore'],
  },
  river: {
    id: 'river',
    name: 'Rio / Lago',
    category: 'aquatic',
    color: '#38bdf8',
    ambientTags: ['aquatic', 'freshwater'],
  },
  ocean: {
    id: 'ocean',
    name: 'Oceano Profundo',
    category: 'aquatic',
    color: '#0284c7',
    ambientTags: ['aquatic', 'saltwater', 'deep'],
  },
  swamp: {
    id: 'swamp',
    name: 'Pântano',
    category: 'aquatic',
    color: '#4d7c0f',
    ambientTags: ['wetland', 'damp', 'mud'],
  },
  caves: {
    id: 'caves',
    name: 'Caverna Subterrânea',
    category: 'subterranean',
    color: '#71717a',
    ambientTags: ['underground', 'rock', 'dark'],
  },
};

// Aliases mapping Portuguese or variations to standardized biome IDs
const BIOME_ALIASES: Record<string, string> = {
  floresta: 'forest',
  mata: 'forest',
  bosque: 'dense_forest',
  planicie: 'plains',
  planície: 'plains',
  campo: 'plains',
  deserto: 'desert',
  areia: 'desert',
  praia: 'beach',
  costa: 'beach',
  rio: 'river',
  lago: 'river',
  oceano: 'ocean',
  mar: 'ocean',
  pantano: 'swamp',
  pântano: 'swamp',
  caverna: 'caves',
  cavernas: 'caves',
  subterraneo: 'caves',
};

export class BiomeResolver {
  /**
   * Resolves canonical biome ID based on tile type and environment context.
   */
  static resolveBiomeId(tile: TileType): string {
    switch (tile) {
      case 'dense_grass':
        return 'dense_forest';
      case 'grass':
        return 'plains';
      case 'sand':
        return 'beach';
      case 'water':
        return 'river';
      case 'deep_water':
        return 'ocean';
      case 'stone':
      case 'dug_dirt':
        return 'caves';
      default:
        return 'plains';
    }
  }

  /**
   * Normalizes any biome identifier or synonym into a canonical ID.
   */
  static normalizeBiomeId(raw: string): string {
    const clean = raw.toLowerCase().trim();
    if (BIOMES_REGISTRY[clean]) return clean;
    if (BIOME_ALIASES[clean]) return BIOME_ALIASES[clean];
    return clean;
  }

  /**
   * Returns localized display name for a given biome or tile.
   */
  static getBiomeName(tileOrId: TileType | string): string {
    const canonical = this.resolveBiomeId(tileOrId as TileType) || this.normalizeBiomeId(tileOrId);
    return BIOMES_REGISTRY[canonical]?.name || 'Mundo Aberto';
  }

  /**
   * Checks if candidate biome matches target biome (supports synonyms like floresta = forest).
   */
  static matches(candidateBiome: string, targetBiome: string): boolean {
    const normCandidate = this.normalizeBiomeId(candidateBiome);
    const normTarget = this.normalizeBiomeId(targetBiome);

    if (normCandidate === normTarget) return true;
    if (normCandidate === 'dense_forest' && normTarget === 'forest') return true;
    if (normCandidate === 'beach' && normTarget === 'desert') return true;
    return false;
  }
}
