import { CHUNK_SIZE, PLAYER_INTERACTION_RANGE, TILE_SIZE } from '../../core/configuracao/constants';
import {
  Camera,
  ItemType,
  ItemStack,
  Player,
  TileType,
  WorldEntity,
} from '../../core/configuracao/types';
import { BlockDatabase } from '../blocos/BlockDatabase';
import { BreakableComponent, FluidComponent, SideTextureComponent } from '../blocos/componentes';
import {
  BreakComponent,
  ConsumableComponent,
  PlaceableComponent,
  PlantableComponent,
  ToolComponent,
} from '../itens/componentes';
import { ItemDatabase } from '../itens/ItemDatabase';
import { ChunkManager } from '../mundo/chunks/ChunkManager';
import { InteractionSystem } from '../sistemas/interacao/InteractionSystem';
import { BreakSystem } from '../sistemas/quebra/BreakSystem';
import { HarvestResult, HarvestSystem } from './coleta/HarvestSystem';

export interface MouseActionInfo {
  type: 'chop' | 'harvest' | 'dig' | 'attack' | 'interact' | 'eat' | 'plant' | 'place';
  label: string;
  subLabel?: string;
  itemType?: ItemType;
}

export interface MouseTarget {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  tileX: number;
  tileY: number;
  tileType: TileType;
  entity: WorldEntity | null;
  distance: number;
  inRange: boolean;
  maxRange: number;
  raycastEnd: { x: number; y: number };
  primaryAction: MouseActionInfo | null;
  secondaryAction: MouseActionInfo | null;
}

export interface PrimaryActionResult {
  success: boolean;
  reason?: 'out_of_range' | 'no_target' | 'already_harvested' | 'unbreakable' | string;
  harvestResult?: HarvestResult | null;
  actionType?: 'chop' | 'harvest' | 'dig' | 'attack';
  targetEntity?: WorldEntity;
  targetPos: { x: number; y: number };
}

export interface SecondaryActionResult {
  success: boolean;
  actionType?: 'eat' | 'plant' | 'place' | 'none';
  consumedItem?: ItemType | string;
  plantedEntity?: WorldEntity;
  targetPos: { x: number; y: number };
  message?: string;
  reason?: 'out_of_range' | 'no_action' | 'blocked' | 'invalid_tile';
}

/**
 * MouseInteractionSystem:
 * Implements mouse aim raycasts, interaction range verification, and capability-driven actions.
 */
export class MouseInteractionSystem {
  /**
   * Calculate interaction target based on cursor position, active camera, player pos, and held item.
   */
  static getMouseTarget(
    canvasX: number,
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    player: Player,
    camera: Camera,
    zoom: number,
    chunkManager: ChunkManager,
    heldItem: ItemStack | null = null,
    maxRange: number = PLAYER_INTERACTION_RANGE
  ): MouseTarget {
    // 1. Screen to World coordinates conversion with camera & zoom
    const worldX = (canvasX - canvasWidth / 2) / zoom + camera.x;
    const worldY = (canvasY - canvasHeight / 2) / zoom + camera.y;

    return this.getTargetAtWorldPos(
      canvasX,
      canvasY,
      worldX,
      worldY,
      player,
      chunkManager,
      heldItem,
      maxRange
    );
  }

  static getTarget(
    canvasX: number,
    canvasY: number,
    camera: Camera,
    player: Player,
    chunkManager: ChunkManager,
    heldItem: ItemStack | null = null,
    maxRange: number = PLAYER_INTERACTION_RANGE
  ): MouseTarget {
    const worldX = canvasX + camera.x;
    const worldY = canvasY + camera.y;

    return this.getTargetAtWorldPos(
      canvasX,
      canvasY,
      worldX,
      worldY,
      player,
      chunkManager,
      heldItem,
      maxRange
    );
  }

  private static getTargetAtWorldPos(
    canvasX: number,
    canvasY: number,
    worldX: number,
    worldY: number,
    player: Player,
    chunkManager: ChunkManager,
    heldItem: ItemStack | null = null,
    maxRange: number = PLAYER_INTERACTION_RANGE
  ): MouseTarget {
    // 1. Initial tile coordinates calculation
    let tileX = Math.floor(worldX / TILE_SIZE);
    let tileY = Math.floor(worldY / TILE_SIZE);

    // 2. Spatial Raycast & Occlusion Check for Elevated Blocks:
    // In top-down / 2.5D view, an elevated block on (tx, ty) extends upwards from ty*TILE_SIZE - height down to (ty+1)*TILE_SIZE.
    // Thus an elevated block at (tileX, tileY + 1) might project upwards and occlude (tileX, tileY).
    // We check in order of visual depth (tileY + 1 first, then tileY).
    let elevatedTileX = tileX;
    let elevatedTileY = tileY;
    let hitElevatedBlock = false;

    for (const checkTy of [tileY + 1, tileY]) {
      const layer = chunkManager.getTileLayer(tileX, checkTy);
      if (layer.upperLayers && layer.upperLayers.length > 0) {
        const elevation = layer.upperLayers.length;
        const topBlockId = layer.upperLayers[elevation - 1];
        const blockDef = BlockDatabase.getBlock(topBlockId);
        const sideComp = blockDef?.getComponent(SideTextureComponent);
        const baseWallHeight = sideComp?.defaultWallHeight ?? 14;
        const totalWallHeight = elevation * baseWallHeight;

        const left = tileX * TILE_SIZE;
        const right = (tileX + 1) * TILE_SIZE;
        const top = checkTy * TILE_SIZE - totalWallHeight;
        const bottom = (checkTy + 1) * TILE_SIZE;

        if (worldX >= left && worldX < right && worldY >= top && worldY < bottom) {
          elevatedTileX = tileX;
          elevatedTileY = checkTy;
          hitElevatedBlock = true;
          break;
        }
      }
    }

    if (hitElevatedBlock) {
      tileX = elevatedTileX;
      tileY = elevatedTileY;
    }

    const tileType = chunkManager.getTile(tileX, tileY);
    const targetBlock = BlockDatabase.getBlock(tileType);
    const tileLayer = chunkManager.getTileLayer(tileX, tileY);

    // 3. Search for entity under cursor or occupying the tile
    const cx = Math.floor(worldX / (CHUNK_SIZE * TILE_SIZE));
    const cy = Math.floor(worldY / (CHUNK_SIZE * TILE_SIZE));

    let entity: WorldEntity | null = null;
    let closestEntityDist = Infinity;

    // First check exact cursor collision against entity hitboxes
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const c = chunkManager.getChunk(cx + ox, cy + oy);
        for (const ent of c.entities) {
          if (ent.isHarvested) continue;
          const halfW = ent.width / 2;
          const halfH = ent.height / 2;

          let hitBoxTop = ent.y - halfH;
          let hitBoxBottom = ent.y + halfH;
          let hitBoxLeft = ent.x - halfW;
          let hitBoxRight = ent.x + halfW;

          if (ent.type === 'tree_oak' || ent.type === 'tree_pine') {
            hitBoxTop = ent.y - ent.height * 0.4;
            hitBoxBottom = ent.y + ent.height * 0.5;
            hitBoxLeft = ent.x - ent.width * 0.35;
            hitBoxRight = ent.x + ent.width * 0.35;
          }

          if (
            worldX >= hitBoxLeft &&
            worldX <= hitBoxRight &&
            worldY >= hitBoxTop &&
            worldY <= hitBoxBottom
          ) {
            const dist = Math.hypot(worldX - ent.x, worldY - ent.y);
            if (dist < closestEntityDist) {
              closestEntityDist = dist;
              entity = ent;
            }
          }
        }
      }
    }

    // If no exact hitbox was hit, but this tile is occupied by an entity, link it so ground isn't targeted instead
    if (!entity && !hitElevatedBlock) {
      entity = chunkManager.getEntityAtTile(tileX, tileY);
    }

    // 4. Calculate Euclidean distance from player center to targeted point
    const targetX = entity ? entity.x : worldX;
    const targetY = entity ? entity.y : worldY;
    const targetDist = Math.hypot(player.x - targetX, player.y - targetY);

    // 5. Interaction range clamp
    const inRange = targetDist <= maxRange;

    // 6. Raycast endpoint calculation
    const dirX = targetDist > 0 ? (targetX - player.x) / targetDist : 0;
    const dirY = targetDist > 0 ? (targetY - player.y) / targetDist : 0;
    const rayDist = Math.min(targetDist, maxRange);
    const raycastEnd = {
      x: player.x + dirX * rayDist,
      y: player.y + dirY * rayDist,
    };

    const heldItemDef = heldItem ? ItemDatabase.getItem(heldItem.type) : null;
    const breakComp = heldItemDef?.getComponent(BreakComponent);

    // 7. Determine primary action (Left Click) via component capabilities
    let primaryAction: MouseActionInfo | null = null;

    if (entity && !entity.isHarvested) {
      if (entity.isLiving) {
        const toolComp = heldItemDef?.getComponent<ToolComponent>(ToolComponent);
        const breakComp = heldItemDef?.getComponent<BreakComponent>(BreakComponent);
        const dmg = toolComp?.toolType === 'sword' ? 24 : (breakComp?.strength ? breakComp.strength * 4 : 10);
        primaryAction = {
          type: 'attack',
          label: `Atacar ${entity.name || 'Entidade'} (-${dmg} Dano)`,
          subLabel: `Vida: ${Math.round(entity.health)}/${entity.maxHealth}`,
        };
      } else {
        const evalBreak = BreakSystem.evaluateBreak(heldItemDef, entity);
        if (entity.type === 'tree_oak' || entity.type === 'tree_pine') {
          const toolBonus = breakComp && breakComp.toolTag === 'axe' ? ` (Machado +${breakComp.strength})` : '';
          primaryAction = {
            type: 'chop',
            label: `Cortar Madeira${toolBonus}`,
            subLabel: `Vida: ${entity.health}/${entity.maxHealth}`,
            itemType: 'wood',
          };
        } else if (entity.type === 'bush') {
          primaryAction = {
            type: 'harvest',
            label: 'Colher Bagas & Fibras',
            itemType: 'berries',
          };
        } else if (entity.type === 'tall_grass') {
          primaryAction = {
            type: 'harvest',
            label: 'Coletar Fibras & Sementes',
            itemType: 'fiber',
          };
        } else if (entity.type === 'flower') {
          primaryAction = {
            type: 'harvest',
            label: 'Colher Flor Silvestre',
            itemType: 'flower',
          };
        }
      }
    } else if (entity && entity.isHarvested) {
      primaryAction = null;
    } else if (tileLayer.upperLayers && tileLayer.upperLayers.length > 0) {
      // Elevated block structure placed on top of ground
      const topBlockId = tileLayer.upperLayers[tileLayer.upperLayers.length - 1];
      const topDef = BlockDatabase.getBlock(topBlockId);
      primaryAction = {
        type: 'chop',
        label: `Desmontar ${topDef.name}`,
        subLabel: `Construção vertical (Nível ${tileLayer.upperLayers.length})`,
        itemType: (topBlockId === 'wood_plank' ? 'wood' : topBlockId) as ItemType,
      };
    } else if (tileLayer.groundBlock) {
      // Solid floor block filling dug pit
      const floorDef = BlockDatabase.getBlock(tileLayer.groundBlock);
      primaryAction = {
        type: 'chop',
        label: `Remover Piso (${floorDef.name})`,
        subLabel: 'Reabrir chão cavado',
        itemType: (tileLayer.groundBlock === 'wood_plank' ? 'wood' : tileLayer.groundBlock) as ItemType,
      };
    } else if (tileLayer.isDug) {
      // Empty dug pit
      primaryAction = {
        type: 'dig',
        label: 'Chão Cavado (Vazio)',
        subLabel: 'Preencha com madeira ou bloco sólido',
      };
    } else {
      // Ground tile interaction
      const fluidComp = targetBlock.getComponent(FluidComponent);
      const isShovel = breakComp?.toolTag === 'shovel' || heldItemDef?.id === 'wooden_shovel';
      const occupiedCheck = chunkManager.isTileOccupied(tileX, tileY);

      if (occupiedCheck.occupied) {
        primaryAction = {
          type: 'interact',
          label: `${targetBlock.name} (Obstruído)`,
          subLabel: occupiedCheck.reason || 'Posição ocupada por outro bloco ou elemento',
        };
      } else if (fluidComp) {
        primaryAction = {
          type: 'interact',
          label: targetBlock.name,
          subLabel: 'Fluido aquático',
        };
      } else if (isShovel) {
        primaryAction = {
          type: 'dig',
          label: `Cavar ${targetBlock.name} com Pá`,
          subLabel: 'Criar chão cavado (escavação)',
        };
      } else {
        const breakable = targetBlock.getComponent(BreakableComponent);
        if (breakable) {
          const evalBreak = BreakSystem.evaluateBreak(heldItemDef, targetBlock);
          primaryAction = {
            type: 'dig',
            label: evalBreak.canBreak ? `Cavar / Examinar ${targetBlock.name}` : targetBlock.name,
            subLabel: evalBreak.canBreak && evalBreak.isEffective ? 'Ferramenta compatível' : undefined,
          };
        } else {
          primaryAction = {
            type: 'dig',
            label: 'Examinar Terreno',
          };
        }
      }
    }

    // 8. Determine secondary action (Right Click) based on item components
    let secondaryAction: MouseActionInfo | null = null;
    if (heldItemDef) {
      const consumable = heldItemDef.getComponent(ConsumableComponent);
      const plantable = heldItemDef.getComponent(PlantableComponent);
      const placeable = heldItemDef.getComponent(PlaceableComponent);

      if (consumable) {
        secondaryAction = {
          type: 'eat',
          label: `Comer ${heldItemDef.name}`,
          subLabel: `+${consumable.energyRestored} Energia`,
          itemType: heldItemDef.id as ItemType,
        };
      } else if (plantable) {
        // "Flores não podem ser colocadas em blocos de chão vazios/cavados."
        const isTileValidForPlant = !entity && !tileLayer.isDug && !tileLayer.groundBlock && (!tileLayer.upperLayers || tileLayer.upperLayers.length === 0);
        if (isTileValidForPlant && plantable.canPlantOn(targetBlock.getTags())) {
          secondaryAction = {
            type: 'plant',
            label: `Plantar ${heldItemDef.name}`,
            subLabel: 'Cultivar no solo fértil',
            itemType: heldItemDef.id as ItemType,
          };
        }
      } else if (placeable) {
        if (!entity && targetBlock.id !== 'water' && targetBlock.id !== 'deep_water') {
          if (tileLayer.isDug && !tileLayer.groundBlock) {
            secondaryAction = {
              type: 'place',
              label: `Assentar ${heldItemDef.name} no Chão Cavado`,
              subLabel: 'Forma superfície sólida e caminhável',
              itemType: heldItemDef.id as ItemType,
            };
          } else if (tileLayer.groundBlock) {
            secondaryAction = {
              type: 'place',
              label: `Construir ${heldItemDef.name} Sobre o Piso`,
              subLabel: 'Construção vertical elevada',
              itemType: heldItemDef.id as ItemType,
            };
          } else if (tileLayer.upperLayers && tileLayer.upperLayers.length > 0) {
            secondaryAction = {
              type: 'place',
              label: `Empilhar ${heldItemDef.name} (Nível ${tileLayer.upperLayers.length + 1})`,
              subLabel: 'Construção vertical sobre bloco existente',
              itemType: heldItemDef.id as ItemType,
            };
          } else {
            secondaryAction = {
              type: 'place',
              label: `Construir ${heldItemDef.name} Sobre o Chão`,
              subLabel: 'Cria bloco sólido elevado',
              itemType: heldItemDef.id as ItemType,
            };
          }
        }
      }
    }

    return {
      screenX: canvasX,
      screenY: canvasY,
      worldX,
      worldY,
      tileX,
      tileY,
      tileType,
      entity,
      distance: targetDist,
      inRange,
      maxRange,
      raycastEnd,
      primaryAction,
      secondaryAction,
    };
  }

  /**
   * Execute primary action (Left Click): chop, harvest, or dig.
   * Strictly verifies that the target is within range.
   */
  static executePrimaryAction(
    target: MouseTarget,
    player: Player,
    chunkManager: ChunkManager,
    heldItem: ItemStack | null = null
  ): PrimaryActionResult {
    // 1. Strict interaction range check
    if (!target.inRange) {
      return {
        success: false,
        reason: 'out_of_range',
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    // 2. Align player direction toward target
    const dx = target.worldX - player.x;
    const dy = target.worldY - player.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? 'right' : 'left';
    } else {
      player.facing = dy > 0 ? 'down' : 'up';
    }

    // 3. Harvest/chop/attack target entity if present
    if (target.entity) {
      if (target.entity.isLiving) {
        const heldItemDef = heldItem ? ItemDatabase.getItem(heldItem.type) : null;
        const toolComp = heldItemDef?.getComponent<ToolComponent>(ToolComponent);
        const breakComp = heldItemDef?.getComponent<BreakComponent>(BreakComponent);
        const damage = toolComp?.toolType === 'sword' ? 24 : (breakComp?.strength ? breakComp.strength * 4 : 10);

        target.entity.health -= damage;
        target.entity.hitShake = 1.0;

        // Knockback away from player
        const kdx = target.entity.x - player.x;
        const kdy = target.entity.y - player.y;
        const kdist = Math.hypot(kdx, kdy) || 1;
        target.entity.x += (kdx / kdist) * 14;
        target.entity.y += (kdy / kdist) * 14;

        let isDead = false;
        if (target.entity.health <= 0) {
          isDead = true;
          chunkManager.removeEntity(target.entity.id);
        }

        return {
          success: true,
          actionType: 'attack',
          targetEntity: target.entity,
          targetPos: { x: target.entity.x, y: target.entity.y },
          harvestResult: isDead
            ? {
                isDepleted: true,
                items: [
                  {
                    type: 'berries' as ItemType,
                    count: Math.floor(Math.random() * 2) + 1,
                    name: 'Drop de ' + (target.entity.name || 'Entidade'),
                  },
                ],
                entity: target.entity,
              }
            : null,
        };
      }

      if (target.entity.isHarvested) {
        return {
          success: false,
          reason: 'already_harvested',
          targetPos: { x: target.entity.x, y: target.entity.y },
        };
      }

      const harvestResult = HarvestSystem.harvestEntity(
        target.entity.id,
        chunkManager,
        heldItem
      );

      const actionType =
        target.entity.type === 'tree_oak' || target.entity.type === 'tree_pine'
          ? 'chop'
          : 'harvest';

      return {
        success: true,
        harvestResult,
        actionType,
        targetEntity: target.entity,
        targetPos: { x: target.entity.x, y: target.entity.y },
      };
    }

    // 4. Ground tile & layers interaction
    const heldItemDef = heldItem ? ItemDatabase.getItem(heldItem.type) : null;
    const breakComp = heldItemDef?.getComponent(BreakComponent);
    const tileLayer = chunkManager.getTileLayer(target.tileX, target.tileY);

    // 4a. If there are elevated blocks on top, dismantle the top block
    if (tileLayer.upperLayers && tileLayer.upperLayers.length > 0) {
      const dismantleRes = chunkManager.dismantleTile(target.tileX, target.tileY);
      const droppedItemType = (dismantleRes.dismantledBlockId === 'wood_plank' ? 'wood' : dismantleRes.dismantledBlockId) || 'wood';
      const droppedDef = ItemDatabase.getItem(droppedItemType);

      return {
        success: true,
        actionType: 'chop',
        harvestResult: {
          items: [{ type: droppedItemType as ItemType, count: 1, name: droppedDef.name }],
          isDepleted: true,
          entity: null as any,
        },
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    // 4b. If there is a filled floor block in dug pit, dismantle it
    if (tileLayer.groundBlock) {
      const dismantleRes = chunkManager.dismantleTile(target.tileX, target.tileY);
      const droppedItemType = (dismantleRes.dismantledBlockId === 'wood_plank' ? 'wood' : dismantleRes.dismantledBlockId) || 'wood';
      const droppedDef = ItemDatabase.getItem(droppedItemType);

      return {
        success: true,
        actionType: 'chop',
        harvestResult: {
          items: [{ type: droppedItemType as ItemType, count: 1, name: droppedDef.name }],
          isDepleted: true,
          entity: null as any,
        },
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    // 4c. Verify obstruction: Cannot dig or break ground if occupied by another block or element!
    const occupiedCheck = chunkManager.isTileOccupied(target.tileX, target.tileY);
    if (occupiedCheck.occupied) {
      return {
        success: false,
        reason: occupiedCheck.reason || 'tile_occupied',
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    // 4d. Shovel digging on ground: creates a dug block / chão cavado
    const isShovel = breakComp?.toolTag === 'shovel' || heldItemDef?.id === 'wooden_shovel';
    if (isShovel && !tileLayer.isDug) {
      const digResult = chunkManager.digTile(target.tileX, target.tileY);
      if (digResult.success) {
        // Drop seeds or dirt fiber on dig
        const dropSeed = Math.random() < 0.6;
        const droppedItems: { type: ItemType; count: number; name: string }[] = [];
        if (dropSeed) {
          droppedItems.push({ type: 'seed', count: 1, name: 'Semente Silvestre' });
        } else {
          droppedItems.push({ type: 'fiber', count: 1, name: 'Fibra Vegetal' });
        }

        return {
          success: true,
          actionType: 'dig',
          harvestResult: {
            items: droppedItems,
            isDepleted: true,
            entity: null as any,
          },
          targetPos: { x: target.worldX, y: target.worldY },
        };
      }
    }

    // 4e. Fallback ground break
    const breakBlockResult = BreakSystem.breakBlock(target.tileType, heldItemDef, {
      chunkManager,
      tileX: target.tileX,
      tileY: target.tileY,
    });

    if (!breakBlockResult.success) {
      return {
        success: false,
        reason: breakBlockResult.message || 'cannot_break',
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    return {
      success: true,
      actionType: 'dig',
      harvestResult:
        breakBlockResult.drops.length > 0
          ? {
              items: breakBlockResult.drops.map((d) => ({
                type: d.type as ItemType,
                count: d.count,
                name: d.name,
              })),
              isDepleted: true,
              entity: null as any,
            }
          : null,
      targetPos: { x: target.worldX, y: target.worldY },
    };
  }

  /**
   * Execute secondary action (Right Click): eat food, plant seed/flower, place wood.
   * Strictly verifies that the target is within range.
   */
  static executeSecondaryAction(
    target: MouseTarget,
    player: Player,
    heldItem: ItemStack | null,
    chunkManager: ChunkManager
  ): SecondaryActionResult {
    // 1. Strict interaction range check
    if (!target.inRange) {
      return {
        success: false,
        reason: 'out_of_range',
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    // 2. Align player direction toward target
    const dx = target.worldX - player.x;
    const dy = target.worldY - player.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? 'right' : 'left';
    } else {
      player.facing = dy > 0 ? 'down' : 'up';
    }

    if (!heldItem) {
      return {
        success: false,
        reason: 'no_action',
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    const heldItemDef = ItemDatabase.getItem(heldItem.type);

    const useResult = InteractionSystem.executeSecondary(
      heldItemDef,
      player,
      target.worldX,
      target.worldY,
      target.tileType,
      chunkManager,
      target.entity
    );

    if (!useResult.success) {
      return {
        success: false,
        reason: target.entity ? 'blocked' : 'invalid_tile',
        targetPos: { x: target.worldX, y: target.worldY },
      };
    }

    return {
      success: true,
      actionType: useResult.actionType,
      consumedItem: useResult.consumedItem as ItemType,
      plantedEntity: useResult.plantedEntity,
      targetPos: { x: target.worldX, y: target.worldY },
      message: useResult.message,
    };
  }
}
