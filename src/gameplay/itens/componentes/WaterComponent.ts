import { ItemComponent } from './ItemComponent';

export interface WaterComponentConfig {
  capacity?: number;
  waterLevel?: number;
  moisturePower?: number;
}

export class WaterComponent extends ItemComponent {
  static readonly type = 'water';
  readonly type = 'water';

  readonly capacity: number;
  waterLevel: number;
  readonly moisturePower: number;

  constructor(config: WaterComponentConfig = {}) {
    super();
    this.capacity = config.capacity ?? 100;
    this.waterLevel = config.waterLevel ?? this.capacity;
    this.moisturePower = config.moisturePower ?? 10;
  }

  hasWater(): boolean {
    return this.waterLevel > 0;
  }
}
