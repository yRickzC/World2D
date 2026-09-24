import { BlockComponent } from './BlockComponent';

export interface FluidConfig {
  isFluid: boolean;
  viscosity?: number;
  swimSpeedMultiplier?: number;
  drownHazard?: boolean;
}

export class FluidComponent extends BlockComponent {
  static readonly type = 'fluid';
  readonly type = 'fluid';

  readonly isFluid: boolean;
  readonly viscosity: number;
  readonly swimSpeedMultiplier: number;
  readonly drownHazard: boolean;

  constructor(config: FluidConfig) {
    super();
    this.isFluid = config.isFluid;
    this.viscosity = config.viscosity ?? 1.0;
    this.swimSpeedMultiplier = config.swimSpeedMultiplier ?? 0.6;
    this.drownHazard = config.drownHazard ?? false;
  }
}
