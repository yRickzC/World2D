import { BlockComponent } from './BlockComponent';

export interface CollisionConfig {
  hasCollision: boolean;
  bounciness?: number;
}

export class CollisionComponent extends BlockComponent {
  static readonly type = 'collision';
  readonly type = 'collision';

  readonly hasCollision: boolean;
  readonly bounciness: number;

  constructor(config: CollisionConfig) {
    super();
    this.hasCollision = config.hasCollision;
    this.bounciness = config.bounciness ?? 0;
  }
}
