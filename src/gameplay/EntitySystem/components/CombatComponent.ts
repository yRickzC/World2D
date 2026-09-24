import { BaseEntityComponent } from './BaseEntityComponent';

export interface CombatComponentData {
  damage: number;
  attackRange: number;
  attackCooldown: number;
}

export class CombatComponent extends BaseEntityComponent {
  static readonly type = 'CombatComponent';
  readonly type = 'CombatComponent';

  damage: number;
  attackRange: number;
  attackCooldown: number;

  constructor(data?: Partial<CombatComponentData>, id?: string) {
    super(id, 50, true);
    this.damage = Math.max(0, data?.damage ?? 10);
    this.attackRange = Math.max(1, data?.attackRange ?? 32);
    this.attackCooldown = Math.max(0.1, data?.attackCooldown ?? 1.0);
  }

  get data(): Record<string, any> {
    return {
      damage: this.damage,
      attackRange: this.attackRange,
      attackCooldown: this.attackCooldown,
    };
  }
}
