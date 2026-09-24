import { BaseComponent } from './BaseComponent';

export type EquipmentSlot =
  | 'head'
  | 'chest'
  | 'legs'
  | 'feet'
  | 'main_hand'
  | 'off_hand'
  | 'accessory';

export interface EquipmentComponentConfig {
  id?: string;
  slot?: EquipmentSlot;
  requiredLevel?: number;
}

export class EquipmentComponent extends BaseComponent {
  readonly type = 'EquipmentComponent';
  readonly priority = 65;
  readonly isDynamic = false;

  readonly slot: EquipmentSlot;
  readonly requiredLevel: number;

  constructor(config: EquipmentComponentConfig) {
    super(config.id || 'equip_01');
    this.slot = config.slot || 'main_hand';
    this.requiredLevel = Math.max(1, config.requiredLevel ?? 1);
  }

  toJSON(): Record<string, any> {
    return {
      slot: this.slot,
      requiredLevel: this.requiredLevel,
    };
  }
}
