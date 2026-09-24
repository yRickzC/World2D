import { ItemComponent } from './ItemComponent';

export interface ToolComponentConfig {
  toolType: string; // 'pickaxe', 'axe', 'shovel', 'sword', 'watering_tool'
  durability?: number;
  maxDurability?: number;
}

export class ToolComponent extends ItemComponent {
  static readonly type = 'tool';
  readonly type = 'tool';

  readonly toolType: string;
  readonly durability: number;
  readonly maxDurability: number;

  constructor(config: ToolComponentConfig) {
    super();
    this.toolType = config.toolType;
    this.maxDurability = config.maxDurability ?? 100;
    this.durability = config.durability ?? this.maxDurability;
  }
}
