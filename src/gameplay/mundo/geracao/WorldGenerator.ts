import { CHUNK_SIZE, TILE_SIZE } from '../../../core/configuracao/constants';
import { Chunk, FoliageType, TileType, WorldEntity } from '../../../core/configuracao/types';
import { coordHash, SimplexNoise } from '../../../core/utilitarios/noise';

export class WorldGenerator {
  private seed: number;
  private noise: SimplexNoise;
  private foliageNoise: SimplexNoise;

  constructor(seed: number) {
    this.seed = seed;
    this.noise = new SimplexNoise(seed);
    this.foliageNoise = new SimplexNoise(seed + 9999);
  }

  setSeed(seed: number) {
    this.seed = seed;
    this.noise = new SimplexNoise(seed);
    this.foliageNoise = new SimplexNoise(seed + 9999);
  }

  calculateTileType(tx: number, ty: number): TileType {
    const scale = 0.035;
    const elev = this.noise.fbm(tx * scale, ty * scale, 4, 0.5, 2.0);

    if (elev < 0.28) {
      return 'deep_water';
    } else if (elev < 0.38) {
      return 'water';
    } else if (elev < 0.43) {
      return 'sand';
    } else if (elev < 0.7) {
      return 'grass';
    } else {
      return 'dense_grass';
    }
  }

  generateChunk(cx: number, cy: number): Chunk {
    const tiles: TileType[][] = [];
    const entities: WorldEntity[] = [];

    const startTx = cx * CHUNK_SIZE;
    const startTy = cy * CHUNK_SIZE;

    // 1. Generate tiles
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      const row: TileType[] = [];
      const ty = startTy + ly;
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tx = startTx + lx;
        row.push(this.calculateTileType(tx, ty));
      }
      tiles.push(row);
    }

    // 2. Generate procedural foliage
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tx = startTx + lx;
        const ty = startTy + ly;
        const tile = tiles[ly][lx];

        if (tile !== 'grass' && tile !== 'dense_grass') continue;

        const h = coordHash(tx, ty, this.seed);
        const fNoise = this.foliageNoise.noise2D(tx * 0.08, ty * 0.08);

        const jitterX = (coordHash(tx, ty, this.seed + 1) - 0.5) * 0.6 * TILE_SIZE;
        const jitterY = (coordHash(tx, ty, this.seed + 2) - 0.5) * 0.6 * TILE_SIZE;
        const wx = tx * TILE_SIZE + TILE_SIZE / 2 + jitterX;
        const wy = ty * TILE_SIZE + TILE_SIZE / 2 + jitterY;

        // Tree generation
        const treeThreshold = tile === 'dense_grass' ? 0.78 : 0.88;
        if (h > treeThreshold && fNoise > 0.4) {
          const isPine = coordHash(tx, ty, this.seed + 3) > 0.5;
          const entityType: FoliageType = isPine ? 'tree_pine' : 'tree_oak';
          entities.push({
            id: `tree_${tx}_${ty}`,
            type: entityType,
            x: wx,
            y: wy,
            width: isPine ? 54 : 64,
            height: isPine ? 74 : 76,
            variant: Math.floor(coordHash(tx, ty, this.seed + 4) * 3),
            swayOffset: coordHash(tx, ty, this.seed + 5) * Math.PI * 2,
            health: 3,
            maxHealth: 3,
            isHarvested: false,
            harvestTimer: 0,
            hitShake: 0,
          });
        }
        // Bush generation
        else if (h > 0.62) {
          entities.push({
            id: `bush_${tx}_${ty}`,
            type: 'bush',
            x: wx,
            y: wy,
            width: 38,
            height: 32,
            variant: Math.floor(coordHash(tx, ty, this.seed + 6) * 3),
            swayOffset: coordHash(tx, ty, this.seed + 7) * Math.PI * 2,
            health: 1,
            maxHealth: 1,
            isHarvested: false,
            harvestTimer: 0,
            hitShake: 0,
          });
        }
        // Tall grass clumps
        else if (h > 0.42) {
          entities.push({
            id: `tall_grass_${tx}_${ty}`,
            type: 'tall_grass',
            x: wx,
            y: wy,
            width: 24,
            height: 24,
            variant: Math.floor(coordHash(tx, ty, this.seed + 8) * 3),
            swayOffset: coordHash(tx, ty, this.seed + 9) * Math.PI * 2,
            health: 1,
            maxHealth: 1,
            isHarvested: false,
            harvestTimer: 0,
            hitShake: 0,
          });
        }
        // Wild flowers
        else if (h < 0.12) {
          entities.push({
            id: `flower_${tx}_${ty}`,
            type: 'flower',
            x: wx,
            y: wy,
            width: 16,
            height: 16,
            variant: Math.floor(coordHash(tx, ty, this.seed + 10) * 4),
            swayOffset: coordHash(tx, ty, this.seed + 11) * Math.PI * 2,
            health: 1,
            maxHealth: 1,
            isHarvested: false,
            harvestTimer: 0,
            hitShake: 0,
          });
        }
      }
    }

    return { cx, cy, tiles, entities };
  }
}
