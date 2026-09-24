import { ItemComponent } from './ItemComponent';

export interface PlaceableComponentConfig {
  blockIdToPlace: string;
  validTileTags?: string[]; // ground tags where this can be placed
}

export class PlaceableComponent extends ItemComponent {
  static readonly type = 'placeable';
  readonly type = 'placeable';

  readonly blockIdToPlace: string;
  readonly validTileTags: string[];

  constructor(config: PlaceableComponentConfig) {
    super();
    this.blockIdToPlace = config.blockIdToPlace;
    this.validTileTags = config.validTileTags ?? ['walkable', 'ground'];
  }

  canPlaceOn(tileTags: string[] | Set<string>): boolean {
    if (this.validTileTags.length === 0) return true;
    const tagSet = tileTags instanceof Set ? tileTags : new Set(tileTags);
    return this.validTileTags.some((tag) => tagSet.has(tag));
  }
}
