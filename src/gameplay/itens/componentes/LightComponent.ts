import { ItemComponent } from './ItemComponent';

export interface LightComponentConfig {
  intensity?: number;
  radius?: number;
  color?: string;
}

export class LightComponent extends ItemComponent {
  static readonly type = 'light';
  readonly type = 'light';

  readonly intensity: number;
  readonly radius: number;
  readonly color: string;

  constructor(config: LightComponentConfig = {}) {
    super();
    this.intensity = config.intensity ?? 0.8;
    this.radius = config.radius ?? 100;
    this.color = config.color ?? '#f59e0b';
  }
}
