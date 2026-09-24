import { BaseComponent } from './BaseComponent';

export type PassiveTriggerCondition = 'always' | 'low_health' | 'night_time' | 'in_combat';

export interface PassiveComponentConfig {
  id?: string;
  passiveName?: string;
  effectMultiplier?: number;
  triggerCondition?: PassiveTriggerCondition;
}

export class PassiveComponent extends BaseComponent {
  readonly type = 'PassiveComponent';
  readonly priority = 68;
  readonly isDynamic = false;

  readonly passiveName: string;
  readonly effectMultiplier: number;
  readonly triggerCondition: PassiveTriggerCondition;

  constructor(config: PassiveComponentConfig) {
    super(config.id || 'passive_01');
    this.passiveName = config.passiveName || 'Vitalidade Férrea';
    this.effectMultiplier = config.effectMultiplier ?? 1.15;
    this.triggerCondition = config.triggerCondition || 'always';
  }

  toJSON(): Record<string, any> {
    return {
      passiveName: this.passiveName,
      effectMultiplier: this.effectMultiplier,
      triggerCondition: this.triggerCondition,
    };
  }
}
