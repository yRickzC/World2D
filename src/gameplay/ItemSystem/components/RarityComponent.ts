import { BaseComponent } from './BaseComponent';

export type ItemRarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário';

export interface RarityComponentConfig {
  id?: string;
  rarity: ItemRarity;
}

export class RarityComponent extends BaseComponent {
  readonly type = 'RarityComponent';
  readonly priority = 85;
  readonly isDynamic = false;

  readonly rarity: ItemRarity;

  constructor(config: RarityComponentConfig) {
    super(config.id || 'rarity_01');
    this.rarity = config.rarity || 'Comum';
  }

  toJSON(): Record<string, any> {
    return {
      rarity: this.rarity,
    };
  }
}
