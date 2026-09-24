import { BaseComponent } from './BaseComponent';

export interface ValueComponentConfig {
  id?: string;
  buyPrice?: number;
  sellPrice?: number;
}

export class ValueComponent extends BaseComponent {
  readonly type = 'ValueComponent';
  readonly priority = 20;
  readonly isDynamic = false;

  readonly buyPrice: number;
  readonly sellPrice: number;

  constructor(config: ValueComponentConfig) {
    super(config.id || 'value_01');
    this.buyPrice = Math.max(0, config.buyPrice ?? 50);
    this.sellPrice = Math.max(0, config.sellPrice ?? 25);
  }

  toJSON(): Record<string, any> {
    return {
      buyPrice: this.buyPrice,
      sellPrice: this.sellPrice,
    };
  }
}
