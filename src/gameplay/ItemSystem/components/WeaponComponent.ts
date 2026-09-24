import { BaseComponent } from './BaseComponent';

export type DamageType = 'physical' | 'magical' | 'fire' | 'pierce';

export interface WeaponComponentConfig {
  id?: string;
  damageType?: DamageType;
  criticalRate?: number;
  range?: number;
  attackDamage?: number;
  attackSpeed?: number;
}

export class WeaponComponent extends BaseComponent {
  readonly type = 'WeaponComponent';
  readonly priority = 45;
  readonly isDynamic = false;

  readonly damageType: DamageType;
  readonly criticalRate: number;
  readonly range: number;
  readonly attackDamage: number;
  readonly attackSpeed: number;

  constructor(config: WeaponComponentConfig) {
    super(config.id || 'weapon_01');
    this.damageType = config.damageType || 'physical';
    this.criticalRate = Math.max(0, Math.min(100, config.criticalRate ?? 5));
    this.range = Math.max(1, config.range ?? 2);
    this.attackDamage = Math.max(1, config.attackDamage ?? 5);
    this.attackSpeed = Math.max(0.1, config.attackSpeed ?? 1.0);
  }

  toJSON(): Record<string, any> {
    return {
      damageType: this.damageType,
      criticalRate: this.criticalRate,
      range: this.range,
      attackDamage: this.attackDamage,
      attackSpeed: this.attackSpeed,
    };
  }
}
