import { BaseComponent } from './BaseComponent';

export interface DurabilityComponentConfig {
  id?: string;
  maxDurability: number;
}

export class DurabilityComponent extends BaseComponent {
  readonly type = 'durability';
  readonly priority = 20;
  readonly isDynamic = true;

  /** Maximum durability value */
  readonly maxDurability: number;

  constructor(config: DurabilityComponentConfig) {
    super(config.id || 'durability_01');
    this.maxDurability = Math.max(1, config.maxDurability ?? 100);
  }

  getInitialDynamicState(): Record<string, any> {
    return {
      durability: this.maxDurability,
    };
  }

  toJSON(): Record<string, any> {
    return {
      maxDurability: this.maxDurability,
    };
  }
}
