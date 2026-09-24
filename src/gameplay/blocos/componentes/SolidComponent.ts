import { BlockComponent } from './BlockComponent';

export interface SolidConfig {
  solid: boolean;
}

export class SolidComponent extends BlockComponent {
  static readonly type = 'solid';
  readonly type = 'solid';

  readonly solid: boolean;

  constructor(config: SolidConfig = { solid: true }) {
    super();
    this.solid = config.solid;
  }
}
