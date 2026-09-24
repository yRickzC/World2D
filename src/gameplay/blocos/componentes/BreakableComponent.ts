import { BlockComponent } from './BlockComponent';

export interface BlockDropItem {
  type: string;
  count: number;
  chance?: number; // 0 to 1
}

export interface BreakableConfig {
  hardness: number; // e.g. 1 (dirt/sand), 3 (wood), 5 (stone), 10 (obsidian)
  dropItems?: BlockDropItem[];
  requiredToolTag?: string; // e.g. 'pickaxe', 'axe', 'shovel'
  minToolStrength?: number; // e.g. 1 (wood), 3 (stone), 5 (iron)
}

export class BreakableComponent extends BlockComponent {
  static readonly type = 'breakable';
  readonly type = 'breakable';

  readonly hardness: number;
  readonly dropItems: BlockDropItem[];
  readonly requiredToolTag?: string;
  readonly minToolStrength: number;

  constructor(config: BreakableConfig) {
    super();
    this.hardness = config.hardness;
    this.dropItems = config.dropItems ?? [];
    this.requiredToolTag = config.requiredToolTag;
    this.minToolStrength = config.minToolStrength ?? 1;
  }

  canBeHarvestedWith(toolTag?: string, toolStrength: number = 1): boolean {
    if (!this.requiredToolTag) return true;
    if (this.requiredToolTag !== toolTag) return false;
    return toolStrength >= this.minToolStrength;
  }
}
