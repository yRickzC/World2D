import { ItemComponent } from './ItemComponent';

export interface BreakComponentConfig {
  toolTag: string; // e.g. 'pickaxe', 'axe', 'shovel'
  strength: number; // e.g. 1 (wood), 3 (stone), 5 (iron), 8 (diamond)
  damage?: number; // e.g. 1, 2, 4
  speed?: number; // multiplier, e.g. 1.0, 1.5, 2.0
  effectiveTags?: string[]; // block/entity tags it can break efficiently
}

export class BreakComponent extends ItemComponent {
  static readonly type = 'break';
  readonly type = 'break';

  readonly toolTag: string;
  readonly strength: number;
  readonly damage: number;
  readonly speed: number;
  readonly effectiveTags: string[];

  constructor(config: BreakComponentConfig) {
    super();
    this.toolTag = config.toolTag;
    this.strength = config.strength;
    this.damage = config.damage ?? 1;
    this.speed = config.speed ?? 1.0;
    this.effectiveTags = config.effectiveTags ?? [];
  }

  isEffectiveAgainst(targetTags: string[] | Set<string>): boolean {
    if (this.effectiveTags.length === 0) return true;
    const tagSet = targetTags instanceof Set ? targetTags : new Set(targetTags);
    return this.effectiveTags.some((tag) => tagSet.has(tag));
  }
}
