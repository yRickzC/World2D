import { BaseComponent } from './BaseComponent';

export interface BlockItemComponentConfig {
  id?: string;
  blockIdToPlace: string;
  validTileTags?: string[];
}

export class BlockItemComponent extends BaseComponent {
  readonly type = 'block_item';
  readonly priority = 30;
  readonly isDynamic = false;

  readonly blockIdToPlace: string;
  readonly validTileTags: string[];

  constructor(config: BlockItemComponentConfig) {
    super(config.id || 'block_item_01');
    this.blockIdToPlace = config.blockIdToPlace;
    this.validTileTags = config.validTileTags || ['walkable', 'ground', 'dug'];
  }

  canPlaceOn(tileTags: string[] | Set<string>): boolean {
    if (!this.validTileTags || this.validTileTags.length === 0) return true;
    const tagSet = tileTags instanceof Set ? tileTags : new Set(tileTags);
    return this.validTileTags.some((tag) => tagSet.has(tag));
  }

  onUse(instance: any, context: any): boolean | void {
    if (context?.bus) {
      context.bus.emit('item.used', {
        itemId: instance.definitionId,
        instanceId: instance.id,
        componentId: this.id,
        componentType: this.type,
        timestamp: Date.now(),
        data: {
          blockIdToPlace: this.blockIdToPlace,
          tileX: context.tileX,
          tileY: context.tileY,
        },
      });
    }
    return true;
  }

  toJSON(): Record<string, any> {
    return {
      blockIdToPlace: this.blockIdToPlace,
      validTileTags: this.validTileTags,
    };
  }
}
