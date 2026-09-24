import { ItemComponent } from './ItemComponent';

export interface StackConfig {
  maxStack: number;
}

/**
 * StackComponent:
 * Defines stack limits and stacking behavior for an item.
 * Default maxStack is 64, but can be 1 (tools, weapons) or 16/99/etc.
 */
export class StackComponent extends ItemComponent {
  static readonly type = 'stack';
  readonly type = 'stack';

  readonly maxStack: number;

  constructor(config: StackConfig | number = 64) {
    super();
    this.maxStack = typeof config === 'number' ? config : config.maxStack;
  }
}
