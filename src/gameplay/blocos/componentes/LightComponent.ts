import { BlockComponent } from './BlockComponent';

export interface BlockLightConfig {
  intensity: number;
  radius?: number;
  color?: string;
}

export class LightComponent extends BlockComponent {
  static readonly type = 'light';
  readonly type = 'light';

  readonly intensity: number;
  readonly radius: number;
  readonly color: string;

  constructor(config: BlockLightConfig) {
    super();
    this.intensity = config.intensity;
    this.radius = config.radius ?? 120;
    this.color = config.color ?? '#f59e0b';
  }
}
