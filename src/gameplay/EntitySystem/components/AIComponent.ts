import { BaseEntityComponent } from './BaseEntityComponent';

export type AIBehavior = 'passive' | 'hostile' | 'neutral' | 'fleeing';

export interface AIComponentData {
  behavior: AIBehavior;
  detectionRadius: number;
}

export class AIComponent extends BaseEntityComponent {
  static readonly type = 'AIComponent';
  readonly type = 'AIComponent';

  behavior: AIBehavior;
  detectionRadius: number;

  constructor(data?: Partial<AIComponentData>, id?: string) {
    super(id, 60, true);
    this.behavior = data?.behavior ?? 'passive';
    this.detectionRadius = Math.max(0, data?.detectionRadius ?? 128);
  }

  get data(): Record<string, any> {
    return {
      behavior: this.behavior,
      detectionRadius: this.detectionRadius,
    };
  }
}
