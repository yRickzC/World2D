import { CHUNK_SIZE, TILE_SIZE } from '../../../core/configuracao/constants';
import { Chunk, TileLayerData, TileType, WorldEntity } from '../../../core/configuracao/types';
import { BlockDatabase } from '../../blocos/BlockDatabase';
import { updateWorldEntity } from '../../entidades/recursos/WorldEntity';
import { WorldGenerator } from '../geracao/WorldGenerator';

export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private generator: WorldGenerator;
  private seed: number;

  constructor(seed: number = 1337) {
    this.seed = seed;
    this.generator = new WorldGenerator(seed);
  }

  getSeed(): number {
    return this.seed;
  }

  setSeed(seed: number) {
    this.seed = seed;
    this.generator.setSeed(seed);
    this.chunks.clear();
  }

  private chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  getChunk(cx: number, cy: number): Chunk {
    const key = this.chunkKey(cx, cy);
    if (!this.chunks.has(key)) {
      const chunk = this.generator.generateChunk(cx, cy);
      this.chunks.set(key, chunk);

      // Simple memory eviction if too many chunks stored
      if (this.chunks.size > 200) {
        const firstKey = this.chunks.keys().next().value;
        if (firstKey) this.chunks.delete(firstKey);
      }
    }
    return this.chunks.get(key)!;
  }

  getAllLoadedChunks(): IterableIterator<Chunk> {
    return this.chunks.values();
  }

  getTile(tx: number, ty: number): TileType {
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.tiles[ly][lx];
  }

  setTile(tx: number, ty: number, tile: TileType) {
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.tiles[ly][lx] = tile;
  }

  /**
   * Retrieves or initializes layer information for a specific tile cell.
   */
  getTileLayer(tx: number, ty: number): TileLayerData {
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    if (!chunk.layers) {
      chunk.layers = Array(CHUNK_SIZE)
        .fill(null)
        .map(() => Array(CHUNK_SIZE).fill(undefined));
    }

    if (!chunk.layers[ly][lx]) {
      const currentTile = chunk.tiles[ly][lx];
      chunk.layers[ly][lx] = {
        baseGround: currentTile === 'dug_dirt' ? 'grass' : currentTile,
        isDug: currentTile === 'dug_dirt',
        groundBlock: null,
        upperLayers: [],
      };
    }

    return chunk.layers[ly][lx]!;
  }

  /**
   * Returns an entity occupying tile (tx, ty), if any.
   */
  getEntityAtTile(tx: number, ty: number): WorldEntity | null {
    const tileLeft = tx * TILE_SIZE;
    const tileRight = (tx + 1) * TILE_SIZE;
    const tileTop = ty * TILE_SIZE;
    const tileBottom = (ty + 1) * TILE_SIZE;

    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const chunk = this.getChunk(cx + ox, cy + oy);
        for (const ent of chunk.entities) {
          if (ent.isHarvested) continue;
          const halfW = ent.width / 2;
          const halfH = ent.height / 2;
          const entLeft = ent.x - halfW;
          const entRight = ent.x + halfW;
          const entTop = ent.y - halfH;
          const entBottom = ent.y + halfH;

          const overlaps = !(
            entRight <= tileLeft ||
            entLeft >= tileRight ||
            entBottom <= tileTop ||
            entTop >= tileBottom
          );

          if (overlaps) {
            return ent;
          }
        }
      }
    }
    return null;
  }

  /**
   * Checks if a tile is occupied by an elevated block, a ground block, or an entity.
   */
  isTileOccupied(tx: number, ty: number): {
    occupied: boolean;
    reason?: string;
    occupyingEntity?: WorldEntity;
    upperBlockId?: string;
  } {
    const layer = this.getTileLayer(tx, ty);
    if (layer.upperLayers && layer.upperLayers.length > 0) {
      const topBlockId = layer.upperLayers[layer.upperLayers.length - 1];
      return {
        occupied: true,
        reason: 'Existe um bloco construído acima desta posição.',
        upperBlockId: topBlockId,
      };
    }

    if (layer.groundBlock) {
      return {
        occupied: true,
        reason: 'Existe um piso preenchido ocupando este espaço.',
        upperBlockId: layer.groundBlock,
      };
    }

    const ent = this.getEntityAtTile(tx, ty);
    if (ent && !ent.isHarvested) {
      return {
        occupied: true,
        reason: 'Existe um elemento/entidade ocupando esta posição.',
        occupyingEntity: ent,
      };
    }

    return { occupied: false };
  }

  /**
   * Digs the ground using a shovel, creating an excavated pit / chão cavado.
   */
  digTile(tx: number, ty: number): { success: boolean; message?: string } {
    const layer = this.getTileLayer(tx, ty);

    // Cannot dig water or ocean
    if (layer.baseGround === 'water' || layer.baseGround === 'deep_water') {
      return { success: false, message: 'Não é possível cavar na água!' };
    }

    // Must dismantle any upper elevated blocks first
    if (layer.upperLayers && layer.upperLayers.length > 0) {
      return { success: false, message: 'Desmonte o bloco superior antes de cavar o chão!' };
    }

    // Cannot dig if an entity occupies this tile
    const ent = this.getEntityAtTile(tx, ty);
    if (ent && !ent.isHarvested) {
      return { success: false, message: 'Não é possível cavar: existe um elemento ocupando a posição!' };
    }

    // If there is an inserted floor block in the dug hole, removing it re-exposes the hole
    if (layer.groundBlock) {
      layer.groundBlock = null;
      layer.isDug = true;
      this.setTile(tx, ty, 'dug_dirt');
      return { success: true, message: 'Piso removido! Chão cavado reexposto.' };
    }

    // Already dug
    if (layer.isDug) {
      return { success: false, message: 'Este terreno já está cavado!' };
    }

    // Excavate ground
    layer.isDug = true;
    layer.groundBlock = null;
    this.setTile(tx, ty, 'dug_dirt');
    return { success: true, message: 'Chão cavado! Solo escavado.' };
  }

  /**
   * Places a solid block respecting the layers system:
   * 1. If placed in an empty dug hole, fills it flush with ground level (walkable floor).
   * 2. If placed on normal ground or on an existing solid block, stacks on top (vertical construction, solid wall).
   */
  placeBlockOnTile(
    tx: number,
    ty: number,
    blockId: string
  ): { success: boolean; layerType: 'ground' | 'upper'; elevation: number; message: string } {
    const layer = this.getTileLayer(tx, ty);
    const blockDef = BlockDatabase.getBlock(blockId);
    const isSolid = blockDef.isSolid;

    if (layer.baseGround === 'water' || layer.baseGround === 'deep_water') {
      return {
        success: false,
        layerType: 'ground',
        elevation: 0,
        message: 'Não é possível construir sobre a água!',
      };
    }

    // Case 1: Ground is dug (chão cavado) and empty
    if (layer.isDug && !layer.groundBlock) {
      // "No chão cavado, devem ser permitidos apenas blocos sólidos."
      if (!isSolid) {
        return {
          success: false,
          layerType: 'ground',
          elevation: 0,
          message: 'No chão cavado, apenas blocos sólidos são permitidos!',
        };
      }

      // "Se a madeira for colocada sobre um chão cavado, ela deve ocupar o espaço do bloco cavado, ficando no mesmo nível do chão e formando uma superfície sólida que permite atravessar/caminhar sobre ela."
      layer.groundBlock = blockId;
      this.setTile(tx, ty, blockId as TileType);
      return {
        success: true,
        layerType: 'ground',
        elevation: 0,
        message: 'Piso sólido assentado no chão cavado (superfície caminhável)!',
      };
    }

    // Case 2: Ground is normal OR already has a filled floor block
    // "Se o jogador tentar colocar um bloco sólido onde já existe outro bloco sólido no chão, o novo bloco deve ser colocado sobre o bloco existente, criando um sistema simples de construção vertical."
    // "Exemplo: colocar madeira sobre um bloco de chão normal faz a madeira ficar sobre o chão, formando um bloco sólido."
    if (!isSolid) {
      return {
        success: false,
        layerType: 'upper',
        elevation: layer.upperLayers.length,
        message: 'Apenas blocos sólidos podem ser construídos aqui!',
      };
    }

    // Place on top (elevated vertical block)
    layer.upperLayers.push(blockId);
    const elevation = layer.upperLayers.length;

    return {
      success: true,
      layerType: 'upper',
      elevation,
      message:
        elevation > 1
          ? `Bloco empilhado verticalmente (Nível ${elevation})!`
          : 'Bloco sólido construído sobre o chão!',
    };
  }

  /**
   * Dismantles a block from the tile (upper layer first, then floor block).
   */
  dismantleTile(tx: number, ty: number): {
    dismantledBlockId?: string;
    isNowDug?: boolean;
    remainingElevation: number;
    message?: string;
  } {
    const layer = this.getTileLayer(tx, ty);

    if (layer.upperLayers.length > 0) {
      const popped = layer.upperLayers.pop();
      return {
        dismantledBlockId: popped,
        isNowDug: false,
        remainingElevation: layer.upperLayers.length,
        message:
          layer.upperLayers.length > 0
            ? `Bloco superior desmontado (Nível restante: ${layer.upperLayers.length})`
            : 'Bloco elevado desmontado!',
      };
    }

    if (layer.groundBlock) {
      const floor = layer.groundBlock;
      layer.groundBlock = null;
      layer.isDug = true;
      this.setTile(tx, ty, 'dug_dirt');
      return {
        dismantledBlockId: floor,
        isNowDug: true,
        remainingElevation: 0,
        message: 'Piso removido! Chão cavado reaberto.',
      };
    }

    return { remainingElevation: 0 };
  }

  addEntity(ent: WorldEntity) {
    const cx = Math.floor(ent.x / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(ent.y / (CHUNK_SIZE * TILE_SIZE));
    const chunk = this.getChunk(cx, cy);
    chunk.entities.push(ent);
  }

  /**
   * Permanently removes an entity from the world chunks (no respawn/regrowth).
   */
  removeEntity(entityId: string): boolean {
    for (const chunk of this.chunks.values()) {
      const idx = chunk.entities.findIndex((e) => e.id === entityId);
      if (idx !== -1) {
        chunk.entities.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  getGroundType(x: number, y: number): TileType {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    return this.getTile(tx, ty);
  }

  getAllEntities(): WorldEntity[] {
    const list: WorldEntity[] = [];
    for (const chunk of this.chunks.values()) {
      for (const ent of chunk.entities) {
        list.push(ent);
      }
    }
    return list;
  }

  getLivingEntities(): WorldEntity[] {
    const list: WorldEntity[] = [];
    for (const chunk of this.chunks.values()) {
      for (const ent of chunk.entities) {
        if (ent.isLiving) {
          list.push(ent);
        }
      }
    }
    return list;
  }

  update(dt: number, player?: any) {
    const solidChecker = (x: number, y: number, r?: number) => this.isSolid(x, y, r);
    const chunkPixelSize = CHUNK_SIZE * TILE_SIZE;

    // Entities that moved to a different chunk
    const movedEntities: { ent: WorldEntity; fromChunk: any; toCx: number; toCy: number }[] = [];

    for (const chunk of this.chunks.values()) {
      for (let i = chunk.entities.length - 1; i >= 0; i--) {
        const ent = chunk.entities[i];
        const oldX = ent.x;
        const oldY = ent.y;

        updateWorldEntity(ent, dt, player, solidChecker);

        // If living entity crossed chunk border, migrate it
        if (ent.isLiving && (ent.x !== oldX || ent.y !== oldY)) {
          const newCx = Math.floor(ent.x / chunkPixelSize);
          const newCy = Math.floor(ent.y / chunkPixelSize);
          if (newCx !== chunk.cx || newCy !== chunk.cy) {
            chunk.entities.splice(i, 1);
            movedEntities.push({ ent, fromChunk: chunk, toCx: newCx, toCy: newCy });
          }
        }
      }
    }

    for (const item of movedEntities) {
      const destChunk = this.getChunk(item.toCx, item.toCy);
      destChunk.entities.push(item.ent);
    }
  }

  isSolid(x: number, y: number, radius: number = 10): boolean {
    // 1. Water collision & elevated upper-layer blocks
    const checkPoints = [
      { x: x, y: y },
      { x: x - radius, y: y },
      { x: x + radius, y: y },
      { x: x, y: y - radius },
      { x: x, y: y + radius },
    ];

    for (const pt of checkPoints) {
      const tx = Math.floor(pt.x / TILE_SIZE);
      const ty = Math.floor(pt.y / TILE_SIZE);
      const tile = this.getTile(tx, ty);
      if (tile === 'deep_water' || tile === 'water') {
        return true;
      }
    }

    // 2. Elevated upper-layer solid block structures (wood walls, stone blocks on top)
    const centerTx = Math.floor(x / TILE_SIZE);
    const centerTy = Math.floor(y / TILE_SIZE);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const curTx = centerTx + ox;
        const curTy = centerTy + oy;
        const layer = this.getTileLayer(curTx, curTy);
        if (layer.upperLayers && layer.upperLayers.length > 0) {
          const tileLeft = curTx * TILE_SIZE;
          const tileTop = curTy * TILE_SIZE;
          const tileRight = tileLeft + TILE_SIZE;
          const tileBottom = tileTop + TILE_SIZE;

          const nearestX = Math.max(tileLeft, Math.min(x, tileRight));
          const nearestY = Math.max(tileTop, Math.min(y, tileBottom));
          const distSq = (x - nearestX) ** 2 + (y - nearestY) ** 2;
          if (distSq < radius * radius) {
            return true;
          }
        }
      }
    }

    // 3. Living tree trunk collision
    const cx = Math.floor(x / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(y / (CHUNK_SIZE * TILE_SIZE));

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const chunk = this.getChunk(cx + ox, cy + oy);
        for (const ent of chunk.entities) {
          if (ent.isHarvested) continue;

          if (ent.type === 'tree_oak' || ent.type === 'tree_pine') {
            const trunkX = ent.x;
            const trunkY = ent.y + ent.height * 0.32;
            const trunkRadius = 13;
            const distSq = (x - trunkX) ** 2 + (y - trunkY) ** 2;
            if (distSq < (radius + trunkRadius) ** 2) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  findSafeSpawn(): { x: number; y: number } {
    for (let r = 0; r < 40; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const wx = dx * TILE_SIZE + TILE_SIZE / 2;
          const wy = dy * TILE_SIZE + TILE_SIZE / 2;
          const tile = this.getTile(dx, dy);
          if ((tile === 'grass' || tile === 'dense_grass') && !this.isSolid(wx, wy, 16)) {
            return { x: wx, y: wy };
          }
        }
      }
    }
    return { x: 0, y: 0 };
  }
}
