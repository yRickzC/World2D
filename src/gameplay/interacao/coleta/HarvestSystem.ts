import { CHUNK_SIZE, TILE_SIZE } from '../../../core/configuracao/constants';
import { ItemStack, ItemType, WorldEntity } from '../../../core/configuracao/types';
import { ItemDatabase } from '../../itens/ItemDatabase';
import { ItemDefinition } from '../../itens/ItemDefinition';
import { ChunkManager } from '../../mundo/chunks/ChunkManager';
import { BreakSystem } from '../../sistemas/quebra/BreakSystem';

export interface NearbyInteractable {
  entity: WorldEntity;
  distance: number;
  prompt: string;
  action: 'chop' | 'harvest';
  itemType: ItemType;
}

export interface HarvestResult {
  items: { type: ItemType; count: number; name: string }[];
  isDepleted: boolean;
  entity: WorldEntity;
}

export class HarvestSystem {
  static findNearbyInteractable(
    px: number,
    py: number,
    chunkManager: ChunkManager
  ): NearbyInteractable | null {
    const cx = Math.floor(px / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(py / (CHUNK_SIZE * TILE_SIZE));

    let closest: NearbyInteractable | null = null;
    let minDistance = Infinity;

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const chunk = chunkManager.getChunk(cx + ox, cy + oy);
        for (const ent of chunk.entities) {
          if (ent.isHarvested) continue;

          let targetX = ent.x;
          let targetY = ent.y;
          let interactRadius = 42;
          let prompt = '';
          let action: 'chop' | 'harvest' = 'harvest';
          let itemType: ItemType = 'fiber';

          if (ent.type === 'tree_oak' || ent.type === 'tree_pine') {
            targetY = ent.y + ent.height * 0.3; // Base of trunk
            interactRadius = 58;
            prompt = `Cortar Madeira (${ent.health}/${ent.maxHealth})`;
            action = 'chop';
            itemType = 'wood';
          } else if (ent.type === 'bush') {
            interactRadius = 46;
            prompt = 'Colher Bagas e Fibras';
            action = 'harvest';
            itemType = 'berries';
          } else if (ent.type === 'tall_grass') {
            interactRadius = 40;
            prompt = 'Coletar Fibras e Sementes';
            action = 'harvest';
            itemType = 'fiber';
          } else if (ent.type === 'flower') {
            interactRadius = 36;
            prompt = 'Colher Flor Silvestre';
            action = 'harvest';
            itemType = 'flower';
          }

          const dist = Math.hypot(px - targetX, py - targetY);
          if (dist <= interactRadius && dist < minDistance) {
            minDistance = dist;
            closest = {
              entity: ent,
              distance: dist,
              prompt,
              action,
              itemType,
            };
          }
        }
      }
    }

    return closest;
  }

  static harvestEntity(
    entityId: string,
    chunkManager: ChunkManager,
    heldItem?: ItemDefinition | ItemStack | null
  ): HarvestResult | null {
    const itemDef = heldItem
      ? heldItem instanceof ItemDefinition
        ? heldItem
        : ItemDatabase.getItem((heldItem as ItemStack).type)
      : null;

    for (const chunk of chunkManager.getAllLoadedChunks()) {
      for (const ent of chunk.entities) {
        if (ent.id === entityId && !ent.isHarvested) {
          const breakResult = BreakSystem.damageEntity(ent, itemDef);
          if (!breakResult.success) return null;

          // Permanently delete destroyed/harvested entity from world chunk so it never respawns
          if (breakResult.isDestroyed) {
            chunkManager.removeEntity(ent.id);
          }

          return {
            items: breakResult.drops.map((d) => ({
              type: d.type as ItemType,
              count: d.count,
              name: d.name,
            })),
            isDepleted: breakResult.isDestroyed,
            entity: ent,
          };
        }
      }
    }
    return null;
  }
}
