import { WorldEntity } from '../../../core/configuracao/types';
import { BlockDatabase } from '../../blocos/BlockDatabase';
import { BlockDefinition } from '../../blocos/BlockDefinition';
import { BreakableComponent } from '../../blocos/componentes';
import { BreakComponent } from '../../itens/componentes';
import { ItemDefinition } from '../../itens/ItemDefinition';

export interface BreakEvaluation {
  canBreak: boolean;
  isEffective: boolean;
  damage: number;
  speedMultiplier: number;
  toolTag: string;
  reason?: string;
  recommendedToolTag?: string;
}

export interface BreakExecutionResult {
  success: boolean;
  damageDealt: number;
  isDestroyed: boolean;
  remainingHealth?: number;
  drops: Array<{ type: string; count: number; name: string }>;
  message?: string;
}

/**
 * BreakSystem:
 * Generic, capability-based breaking and harvesting system.
 * Evaluates actions using ItemComponents (BreakComponent) and BlockComponents (BreakableComponent)
 * combined with Tags, avoiding any hardcoded item IDs.
 */
export class BreakSystem {
  /**
   * Helper to extract tags from either a BlockDefinition or a WorldEntity.
   */
  static getTargetTags(target: BlockDefinition | WorldEntity): Set<string> {
    if (target instanceof BlockDefinition) {
      return new Set(target.getTags());
    }

    // WorldEntity tags mapping based on entity nature
    const tags = new Set<string>();
    if (target.type === 'tree_oak' || target.type === 'tree_pine') {
      tags.add('choppable');
      tags.add('wood');
      tags.add('solid');
      tags.add('foliage');
    } else if (target.type === 'bush') {
      tags.add('harvestable');
      tags.add('foliage');
      tags.add('fruit_bearing');
      tags.add('fiber');
    } else if (target.type === 'tall_grass') {
      tags.add('harvestable');
      tags.add('foliage');
      tags.add('grass');
      tags.add('diggable');
    } else if (target.type === 'flower') {
      tags.add('harvestable');
      tags.add('foliage');
      tags.add('flower');
    }
    return tags;
  }

  /**
   * Evaluates whether an item can break a given target and calculates damage & speed.
   */
  static evaluateBreak(
    item: ItemDefinition | null,
    target: BlockDefinition | WorldEntity
  ): BreakEvaluation {
    const targetTags = this.getTargetTags(target);

    // 1. Check if item has Break capability
    const breakComp = item?.getComponent(BreakComponent);

    const toolTag = breakComp ? breakComp.toolTag : 'hand';
    const toolStrength = breakComp ? breakComp.strength : 1;
    const baseDamage = breakComp ? breakComp.damage : 1;
    const speedMultiplier = breakComp ? breakComp.speed : 1.0;

    // 2. If target is a BlockDefinition, check its BreakableComponent
    if (target instanceof BlockDefinition) {
      const breakable = target.getComponent(BreakableComponent);
      if (!breakable) {
        return {
          canBreak: false,
          isEffective: false,
          damage: 0,
          speedMultiplier: 1.0,
          toolTag,
          reason: 'Bloco inquebrável',
        };
      }

      // Check required tool and min tool strength directly from BreakableComponent
      const requiresSpecificTool = !!breakable.requiredToolTag;
      const hasMatchingTool = requiresSpecificTool ? toolTag === breakable.requiredToolTag : true;
      const hasSufficientStrength = toolStrength >= breakable.minToolStrength;

      const isEffective = breakComp ? hasMatchingTool && hasSufficientStrength : false;

      if (requiresSpecificTool && (!hasMatchingTool || !hasSufficientStrength)) {
        return {
          canBreak: false,
          isEffective: false,
          damage: 0,
          speedMultiplier: 1.0,
          toolTag,
          recommendedToolTag: breakable.requiredToolTag,
          reason: `Requer ferramenta: ${breakable.requiredToolTag} (força min ${breakable.minToolStrength})`,
        };
      }

      const finalDamage = isEffective ? baseDamage * (toolStrength / breakable.hardness) : baseDamage;

      return {
        canBreak: true,
        isEffective,
        damage: Math.max(1, Math.round(finalDamage)),
        speedMultiplier: isEffective ? speedMultiplier * 1.5 : speedMultiplier,
        toolTag,
      };
    }

    // 3. Target is a WorldEntity (e.g. Tree, Bush, Flower)
    const isChoppable = targetTags.has('choppable');
    const isHarvestable = targetTags.has('harvestable');

    if (!isChoppable && !isHarvestable) {
      return {
        canBreak: false,
        isEffective: false,
        damage: 0,
        speedMultiplier: 1.0,
        toolTag,
        reason: 'Objeto não interativo',
      };
    }

    let isEffective = false;
    if (breakComp) {
      if (isChoppable && (breakComp.toolTag === 'axe' || (breakComp as any).toolType === 'axe')) {
        isEffective = true;
      } else if (isHarvestable) {
        isEffective = true;
      }
    } else if (isHarvestable) {
      // Bare hands are fully effective for picking bushes/flowers
      isEffective = true;
    }

    // Tools with matching tags deal bonus damage
    let damage = baseDamage;
    if (isChoppable) {
      if (toolTag === 'axe') {
        damage = baseDamage * 2 + Math.floor(toolStrength * 0.5);
      } else {
        damage = 1; // Bare hands or wrong tool deals minimal 1 damage
      }
    }

    return {
      canBreak: true,
      isEffective,
      damage: Math.max(1, damage),
      speedMultiplier: isEffective ? speedMultiplier * 1.3 : speedMultiplier,
      toolTag,
    };
  }

  /**
   * Applies damage to a WorldEntity using capabilities and components.
   */
  static damageEntity(
    entity: WorldEntity,
    item: ItemDefinition | null
  ): BreakExecutionResult {
    if (entity.isHarvested) {
      return {
        success: false,
        damageDealt: 0,
        isDestroyed: false,
        drops: [],
        message: 'Já colhido',
      };
    }

    const evaluation = this.evaluateBreak(item, entity);
    if (!evaluation.canBreak) {
      return {
        success: false,
        damageDealt: 0,
        isDestroyed: false,
        drops: [],
        message: evaluation.reason,
      };
    }

    entity.hitShake = 1.0;
    const damage = evaluation.damage;
    entity.health = Math.max(0, entity.health - damage);

    // Trees require chopping until health <= 0; bushes, flowers and tall grass are collected in 1 harvest
    const isDestroyed =
      entity.type === 'tree_oak' || entity.type === 'tree_pine'
        ? entity.health <= 0
        : true;

    const drops: Array<{ type: string; count: number; name: string }> = [];

    if (entity.type === 'tree_oak' || entity.type === 'tree_pine') {
      if (isDestroyed) {
        entity.isHarvested = true;
        entity.harvestTimer = 0;
        drops.push({ type: 'wood', count: 3, name: 'Madeira' });
        if (Math.random() > 0.4) {
          drops.push({ type: 'apple', count: 1, name: 'Maçã' });
        }
      } else {
        // Intermediate chips while chopping
        drops.push({ type: 'wood', count: 1, name: 'Madeira' });
      }
    } else if (entity.type === 'bush') {
      entity.isHarvested = true;
      entity.harvestTimer = 0;
      const berryCount = Math.floor(Math.random() * 2) + 1;
      const fiberCount = Math.floor(Math.random() * 2) + 1;
      drops.push({ type: 'berries', count: berryCount, name: 'Bagas Silvestres' });
      drops.push({ type: 'fiber', count: fiberCount, name: 'Fibras' });
    } else if (entity.type === 'tall_grass') {
      entity.isHarvested = true;
      entity.harvestTimer = 0;
      const fiberCount = Math.floor(Math.random() * 2) + 1;
      drops.push({ type: 'fiber', count: fiberCount, name: 'Fibras' });
      if (Math.random() > 0.4) {
        drops.push({ type: 'seed', count: 1, name: 'Sementes' });
      }
    } else if (entity.type === 'flower') {
      entity.isHarvested = true;
      entity.harvestTimer = 0;
      drops.push({ type: 'flower', count: 1, name: 'Flor Silvestre' });
      drops.push({ type: 'seed', count: 1, name: 'Sementes' });
    }

    return {
      success: true,
      damageDealt: damage,
      isDestroyed,
      remainingHealth: entity.health,
      drops,
      message: isDestroyed
        ? 'Destruído!'
        : evaluation.isEffective
        ? `Corte eficiente (-${damage})`
        : `Dano (-${damage})`,
    };
  }

  /**
   * Breaks a Block at tile coordinates if breakable, returning dropped items.
   * Validates whether another block or element occupies the position above or on this tile.
   */
  static breakBlock(
    blockId: string,
    item: ItemDefinition | null,
    options?: {
      chunkManager?: { isTileOccupied: (tx: number, ty: number) => { occupied: boolean; reason?: string } };
      tileX?: number;
      tileY?: number;
    }
  ): BreakExecutionResult {
    if (options?.chunkManager && options.tileX !== undefined && options.tileY !== undefined) {
      const occ = options.chunkManager.isTileOccupied(options.tileX, options.tileY);
      if (occ.occupied) {
        return {
          success: false,
          damageDealt: 0,
          isDestroyed: false,
          drops: [],
          message: occ.reason || 'Existe outro elemento ou bloco ocupando esta posição!',
        };
      }
    }

    const block = BlockDatabase.getBlock(blockId);
    const evaluation = this.evaluateBreak(item, block);

    if (!evaluation.canBreak) {
      return {
        success: false,
        damageDealt: 0,
        isDestroyed: false,
        drops: [],
        message: evaluation.reason,
      };
    }

    const breakable = block.getComponent(BreakableComponent);
    const drops: Array<{ type: string; count: number; name: string }> = [];

    if (breakable && breakable.dropItems.length > 0) {
      for (const drop of breakable.dropItems) {
        const chance = drop.chance ?? 1.0;
        if (Math.random() <= chance) {
          drops.push({
            type: drop.type,
            count: drop.count,
            name: drop.type,
          });
        }
      }
    }

    return {
      success: true,
      damageDealt: evaluation.damage,
      isDestroyed: true,
      drops,
    };
  }
}
