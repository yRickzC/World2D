import { BaseEntityComponent } from './BaseEntityComponent';

export interface HealthComponentData {
  maxHealth: number;
  currentHealth?: number;
  invulnerable?: boolean;
}

export class HealthComponent extends BaseEntityComponent {
  static readonly type = 'HealthComponent';
  readonly type = 'HealthComponent';

  maxHealth: number;
  currentHealth: number;
  invulnerable: boolean;

  constructor(data?: Partial<HealthComponentData>, id?: string) {
    super(id, 20, true);
    this.maxHealth = Math.max(1, data?.maxHealth ?? 100);
    this.currentHealth = Math.min(this.maxHealth, data?.currentHealth ?? this.maxHealth);
    this.invulnerable = Boolean(data?.invulnerable);
  }

  get data(): Record<string, any> {
    return {
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      invulnerable: this.invulnerable,
    };
  }
}
