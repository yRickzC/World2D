import { BaseComponent } from './BaseComponent';

export interface FoodComponentConfig {
  id?: string;
  energyRestored?: number;
  healthRestored?: number;
  prompt?: string;
  soundEffect?: string;
}

export class FoodComponent extends BaseComponent {
  readonly type = 'food';
  readonly priority = 40;
  readonly isDynamic = false;

  readonly energyRestored: number;
  readonly healthRestored: number;
  readonly prompt: string;
  readonly soundEffect: string;

  constructor(config: FoodComponentConfig) {
    super(config.id || 'food_01');
    this.energyRestored = config.energyRestored ?? 10;
    this.healthRestored = config.healthRestored ?? 0;
    this.prompt = config.prompt || 'Comer com Botão Direito';
    this.soundEffect = config.soundEffect || 'eat';
  }

  onConsume(instance: any, consumer: any): boolean | void {
    if (consumer && typeof consumer.restoreEnergy === 'function') {
      consumer.restoreEnergy(this.energyRestored);
    }
    if (consumer && typeof consumer.heal === 'function' && this.healthRestored > 0) {
      consumer.heal(this.healthRestored);
    }
    return true;
  }

  toJSON(): Record<string, any> {
    return {
      energyRestored: this.energyRestored,
      healthRestored: this.healthRestored,
      prompt: this.prompt,
      soundEffect: this.soundEffect,
    };
  }
}
