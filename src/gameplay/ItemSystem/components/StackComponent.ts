import { BaseComponent } from './BaseComponent';

export interface StackComponentConfig {
  id?: string;
  weight?: number;
  // Legacy support for core static items
  maxStack?: number;
}

export class StackComponent extends BaseComponent {
  readonly type = 'StackComponent';
  readonly priority = 15;
  readonly isDynamic = true;

  /**
   * Item weight used to calculate stack limits at runtime.
   * Final limit depends on equipped backpack and container capacity.
   */
  readonly weight: number;

  constructor(config: StackComponentConfig) {
    super(config.id || 'stack_01');
    if (config.weight !== undefined) {
      this.weight = Math.max(0.1, Number(config.weight));
    } else if (config.maxStack !== undefined && config.maxStack > 0) {
      // Compatibility bridge: derives weight from static maxStack
      this.weight = Math.max(0.1, Math.round((64 / config.maxStack) * 10) / 10);
    } else {
      this.weight = 1.0;
    }
  }

  /**
   * Calculates maximum stack size at runtime based on container or backpack capacity.
   * maxStack is NEVER stored as a permanent fixed schema field.
   */
  calculateMaxStack(containerCapacity: number = 64): number {
    return Math.max(1, Math.floor(containerCapacity / this.weight));
  }

  /**
   * Runtime getter for systems expecting maxStack property.
   */
  get maxStack(): number {
    return this.calculateMaxStack(64);
  }

  getInitialDynamicState(): Record<string, any> {
    return {
      quantity: 1,
    };
  }

  toJSON(): Record<string, any> {
    return {
      weight: this.weight,
    };
  }
}
