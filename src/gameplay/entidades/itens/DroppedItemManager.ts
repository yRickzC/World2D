import { DroppedItem, ItemStack, ItemType, Player } from '../../../core/configuracao/types';
import { addItemToSlots } from '../../inventario/slots/InventorySlots';
import { ChunkManager } from '../../mundo/chunks/ChunkManager';

export class DroppedItemManager {
  private items: DroppedItem[] = [];

  getItems(): DroppedItem[] {
    return this.items;
  }

  clear() {
    this.items = [];
  }

  /**
   * Spawns a dropped item near the player with a directional ejection velocity
   */
  spawnItem(
    type: ItemType,
    count: number,
    playerX: number,
    playerY: number,
    facing: 'down' | 'up' | 'left' | 'right' = 'down',
    chunkManager?: ChunkManager
  ): DroppedItem {
    let offsetX = 0;
    let offsetY = 0;
    const ejectDistance = 28;

    switch (facing) {
      case 'up':
        offsetY = -ejectDistance;
        break;
      case 'left':
        offsetX = -ejectDistance;
        break;
      case 'right':
        offsetX = ejectDistance;
        break;
      case 'down':
      default:
        offsetY = ejectDistance;
        break;
    }

    // Add gentle organic variation
    offsetX += (Math.random() - 0.5) * 12;
    offsetY += (Math.random() - 0.5) * 12;

    let targetX = playerX + offsetX;
    let targetY = playerY + offsetY;

    // Avoid dropping inside solid tree trunks or deep water if chunkManager provided
    if (chunkManager && chunkManager.isSolid(targetX, targetY, 6)) {
      // Fallback closer to player
      targetX = playerX + (Math.random() - 0.5) * 16;
      targetY = playerY + (Math.random() - 0.5) * 16;
    }

    const newItem: DroppedItem = {
      id: `drop_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      count,
      x: playerX,
      y: playerY,
      vx: (targetX - playerX) * 3.5 + (Math.random() - 0.5) * 20,
      vy: (targetY - playerY) * 3.5 + (Math.random() - 0.5) * 20,
      bobOffset: Math.random() * Math.PI * 2,
      pickupCooldown: 0.8, // 800ms cooldown so player doesn't instantly reabsorb it
      createdAt: performance.now(),
    };

    this.items.push(newItem);
    return newItem;
  }

  /**
   * Update physics, floating animations, and magnetic pickup
   */
  update(
    dt: number,
    player: Player,
    slots: (ItemStack | null)[],
    onCollect: (type: ItemType, collectedCount: number, x: number, y: number, newSlots: (ItemStack | null)[]) => void,
    onFullInventory?: () => void
  ) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      // Physics velocity and friction
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vx *= Math.pow(0.12, dt);
      item.vy *= Math.pow(0.12, dt);

      if (item.pickupCooldown > 0) {
        item.pickupCooldown = Math.max(0, item.pickupCooldown - dt);
      }

      // Proximity pickup logic (once cooldown has elapsed)
      if (item.pickupCooldown <= 0) {
        const dx = player.x - item.x;
        const dy = (player.y + 4) - item.y;
        const dist = Math.hypot(dx, dy);

        // Magnetic attraction when player is nearby
        if (dist < 42) {
          const pullSpeed = Math.max(60, 220 - dist * 3);
          item.x += (dx / dist) * pullSpeed * dt;
          item.y += (dy / dist) * pullSpeed * dt;

          // Collection radius
          if (dist < 18) {
            const { newSlots, leftover } = addItemToSlots(slots, item.type, item.count);

            if (leftover < item.count) {
              const collected = item.count - leftover;
              onCollect(item.type, collected, item.x, item.y, newSlots);

              if (leftover <= 0) {
                // Fully collected
                this.items.splice(i, 1);
                continue;
              } else {
                // Partial collect (inventory filled up)
                item.count = leftover;
                item.pickupCooldown = 1.2;
                item.vx = -dx * 2;
                item.vy = -dy * 2;
                if (onFullInventory) onFullInventory();
              }
            } else {
              // Inventory completely full
              item.pickupCooldown = 1.5;
              item.vx = -dx * 1.5;
              item.vy = -dy * 1.5;
              if (onFullInventory) onFullInventory();
            }
          }
        }
      }
    }
  }
}
