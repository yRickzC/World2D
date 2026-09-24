import { BaseEntityComponent } from './BaseEntityComponent';

export interface MovementComponentData {
  speed: number;
  canFly?: boolean;
  canSwim?: boolean;
}

export class MovementComponent extends BaseEntityComponent {
  static readonly type = 'MovementComponent';
  readonly type = 'MovementComponent';

  speed: number;
  canFly: boolean;
  canSwim: boolean;

  constructor(data?: Partial<MovementComponentData>, id?: string) {
    super(id, 30, true);
    this.speed = Math.max(0, data?.speed ?? 2.5);
    this.canFly = Boolean(data?.canFly);
    this.canSwim = data?.canSwim !== undefined ? Boolean(data.canSwim) : true;
  }

  get data(): Record<string, any> {
    return {
      speed: this.speed,
      canFly: this.canFly,
      canSwim: this.canSwim,
    };
  }
}
