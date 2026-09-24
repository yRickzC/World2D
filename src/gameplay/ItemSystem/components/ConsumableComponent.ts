import { BaseComponent } from './BaseComponent';

export type ConsumeEffectType = 'heal' | 'energy' | 'speed_boost' | 'strength';

export interface ConsumableComponentConfig {
  id?: string;
  restoreAmount?: number;
  consumeTime?: number;
  consumeEffect?: ConsumeEffectType;
  prompt?: string;
}

export class ConsumableComponent extends BaseComponent {
  readonly type = 'ConsumableComponent';
  readonly priority = 40;
  readonly isDynamic = false;

  readonly restoreAmount: number;
  readonly consumeTime: number;
  readonly consumeEffect: ConsumeEffectType;
  readonly prompt: string;

  constructor(config: ConsumableComponentConfig) {
    super(config.id || 'consumable_01');
    this.restoreAmount = Math.max(0, config.restoreAmount ?? 20);
    this.consumeTime = Math.max(0, config.consumeTime ?? 1.5);
    this.consumeEffect = config.consumeEffect || 'heal';
    this.prompt = config.prompt || 'Consumir';
  }

  toJSON(): Record<string, any> {
    return {
      restoreAmount: this.restoreAmount,
      consumeTime: this.consumeTime,
      consumeEffect: this.consumeEffect,
      prompt: this.prompt,
    };
  }
}
