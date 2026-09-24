import { CHUNK_SIZE, TILE_SIZE } from '../../../core/configuracao/constants';
import { ItemType, Player, WorldEntity } from '../../../core/configuracao/types';
import { BlockDatabase } from '../../blocos/BlockDatabase';
import {
  ConsumableComponent,
  PlaceableComponent,
  PlantableComponent,
} from '../../itens/componentes';
import { ItemDatabase } from '../../itens/ItemDatabase';
import { ItemDefinition } from '../../itens/ItemDefinition';
import { ChunkManager } from '../../mundo/chunks/ChunkManager';
import { BreakExecutionResult, BreakSystem } from '../quebra/BreakSystem';

export interface UseItemResult {
  success: boolean;
  actionType: 'eat' | 'plant' | 'place' | 'none';
  consumedItem?: ItemType | string;
  message?: string;
  plantedEntity?: WorldEntity;
  placedBlockId?: string;
}

/**
 * InteractionSystem:
 * Orchestrates player interactions with the world using Item and Block components.
 */
export class InteractionSystem {
  /**
   * Evaluates and executes the primary action (breaking / harvesting / digging).
   */
  static executePrimary(
    heldItemDef: ItemDefinition | null,
    targetEntity: WorldEntity | null,
    targetTileType: string,
    chunkManager: ChunkManager,
    tileX?: number,
    tileY?: number
  ): BreakExecutionResult {
    if (targetEntity) {
      return BreakSystem.damageEntity(targetEntity, heldItemDef);
    }

    // Ground tile interaction with occupancy check
    const block = BlockDatabase.getBlock(targetTileType);
    return BreakSystem.breakBlock(block.id, heldItemDef, {
      chunkManager,
      tileX,
      tileY,
    });
  }

  /**
   * Evaluates and executes the secondary action (eating, planting, placing)
   * using ItemComponents on the held item.
   */
  static executeSecondary(
    heldItemDef: ItemDefinition | null,
    player: Player,
    targetWorldX: number,
    targetWorldY: number,
    targetTileType: string,
    chunkManager: ChunkManager,
    occupiedEntity: WorldEntity | null
  ): UseItemResult {
    if (!heldItemDef) {
      return { success: false, actionType: 'none' };
    }

    // 1. Check for ConsumableComponent
    const consumable = heldItemDef.getComponent(ConsumableComponent);
    if (consumable) {
      return {
        success: true,
        actionType: 'eat',
        consumedItem: heldItemDef.id,
        message: `+${consumable.energyRestored} Energia (${heldItemDef.name})`,
      };
    }

    // 2. Check for PlantableComponent
    const plantable = heldItemDef.getComponent(PlantableComponent);
    if (plantable) {
      if (occupiedEntity) {
        return { success: false, actionType: 'none', message: 'Espaço ocupado!' };
      }

      const tx = Math.floor(targetWorldX / TILE_SIZE);
      const ty = Math.floor(targetWorldY / TILE_SIZE);
      const layer = chunkManager.getTileLayer(tx, ty);

      // Rule: "Flores não podem ser colocadas em blocos de chão vazios/cavados."
      if (layer.isDug && !layer.groundBlock) {
        return {
          success: false,
          actionType: 'none',
          message: 'Flores não podem ser colocadas em chão cavado!',
        };
      }

      if (layer.upperLayers && layer.upperLayers.length > 0) {
        return {
          success: false,
          actionType: 'none',
          message: 'Não é possível plantar sobre blocos construídos!',
        };
      }

      if (layer.groundBlock) {
        return {
          success: false,
          actionType: 'none',
          message: 'Flores não podem ser colocadas sobre blocos de chão preenchidos!',
        };
      }

      const block = BlockDatabase.getBlock(targetTileType);
      if (!plantable.canPlantOn(block.getTags())) {
        return { success: false, actionType: 'none', message: 'Solo inadequado para plantio!' };
      }

      const newEntity: WorldEntity = {
        id: `planted_${plantable.entityTypeToSpawn}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: plantable.entityTypeToSpawn as any,
        x: targetWorldX,
        y: targetWorldY,
        width: 24,
        height: 20,
        variant: Math.floor(Math.random() * 3),
        swayOffset: Math.random() * Math.PI * 2,
        health: 1,
        maxHealth: 1,
        isHarvested: false,
        harvestTimer: 0,
        hitShake: 0,
      };

      const cx = Math.floor(targetWorldX / (CHUNK_SIZE * TILE_SIZE));
      const cy = Math.floor(targetWorldY / (CHUNK_SIZE * TILE_SIZE));
      const chunk = chunkManager.getChunk(cx, cy);
      chunk.entities.push(newEntity);

      return {
        success: true,
        actionType: 'plant',
        consumedItem: heldItemDef.id,
        plantedEntity: newEntity,
        message: `Plantado: ${heldItemDef.name}!`,
      };
    }

    // 3. Check for PlaceableComponent (Layers & vertical building)
    const placeable = heldItemDef.getComponent(PlaceableComponent);
    if (placeable) {
      if (occupiedEntity) {
        return { success: false, actionType: 'none', message: 'Espaço ocupado!' };
      }

      // Convert world coord to tile coord
      const tx = Math.floor(targetWorldX / TILE_SIZE);
      const ty = Math.floor(targetWorldY / TILE_SIZE);

      const placeResult = chunkManager.placeBlockOnTile(tx, ty, placeable.blockIdToPlace);
      if (!placeResult.success) {
        return {
          success: false,
          actionType: 'none',
          message: placeResult.message,
        };
      }

      return {
        success: true,
        actionType: 'place',
        consumedItem: heldItemDef.id,
        placedBlockId: placeable.blockIdToPlace,
        message: placeResult.message,
      };
    }

    return { success: false, actionType: 'none' };
  }
}
