import { BaseEntityComponent } from './BaseEntityComponent';

export interface PhysicsComponentData {
  solid: boolean;
  mass: number;
  pushable: boolean;
}

export class PhysicsComponent extends BaseEntityComponent {
  static readonly type = 'PhysicsComponent';
  readonly type = 'PhysicsComponent';

  solid: boolean;
  mass: number;
  pushable: boolean;

  constructor(data?: Partial<PhysicsComponentData>, id?: string) {
    super(id, 80, true);
    this.solid = data?.solid !== undefined ? Boolean(data.solid) : true;
    this.mass = Math.max(0.1, data?.mass ?? 1.0);
    this.pushable = data?.pushable !== undefined ? Boolean(data.pushable) : true;
  }

  get data(): Record<string, any> {
    return {
      solid: this.solid,
      mass: this.mass,
      pushable: this.pushable,
    };
  }
}
