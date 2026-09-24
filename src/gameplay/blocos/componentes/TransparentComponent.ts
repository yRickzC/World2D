import { BlockComponent } from './BlockComponent';

export interface TransparentConfig {
  opacity: number; // 0 (fully invisible) to 1 (fully opaque)
}

export class TransparentComponent extends BlockComponent {
  static readonly type = 'transparent';
  readonly type = 'transparent';

  readonly opacity: number;

  constructor(config: TransparentConfig) {
    super();
    this.opacity = config.opacity;
  }
}
