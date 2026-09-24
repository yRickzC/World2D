import { BaseComponent } from './BaseComponent';

export interface StatsComponentConfig {
  id?: string;
  attack?: number;
  defense?: number;
  speed?: number;
  durability?: number;
}

export class StatsComponent extends BaseComponent {
  readonly type = 'StatsComponent';
  readonly priority = 60;
  readonly isDynamic = true;

  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly durability: number;

  constructor(config: StatsComponentConfig) {
    super(config.id || 'stats_01');
    this.attack = Math.max(0, config.attack ?? 0);
    this.defense = Math.max(0, config.defense ?? 0);
    this.speed = Math.max(0, config.speed ?? 1.0);
    this.durability = Math.max(1, config.durability ?? 100);
  }

  getInitialDynamicState(): Record<string, any> {
    return {
      currentDurability: this.durability,
    };
  }

  toJSON(): Record<string, any> {
    return {
      attack: this.attack,
      defense: this.defense,
      speed: this.speed,
      durability: this.durability,
    };
  }
}
