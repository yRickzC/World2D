import { ItemComponent } from './ItemComponent';

export interface ConsumableComponentConfig {
  energyRestored?: number;
  healthRestored?: number;
  prompt?: string;
  soundEffect?: string;
}

export class ConsumableComponent extends ItemComponent {
  static readonly type = 'consumable';
  readonly type = 'consumable';

  readonly energyRestored: number;
  readonly healthRestored: number;
  readonly prompt: string;
  readonly soundEffect: string;

  constructor(config: ConsumableComponentConfig = {}) {
    super();
    this.energyRestored = config.energyRestored ?? 15;
    this.healthRestored = config.healthRestored ?? 5;
    this.prompt = config.prompt ?? 'Comer com Botão Direito';
    this.soundEffect = config.soundEffect ?? 'eat';
  }
}
