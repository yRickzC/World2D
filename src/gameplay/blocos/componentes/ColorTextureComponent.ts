import { BlockComponent } from './BlockComponent';

export type BlockTexturePattern = 'plain' | 'checker' | 'speckle' | 'wave' | 'blades';

export interface ColorTextureConfig {
  primaryColor: string;
  secondaryColor?: string;
  pattern?: BlockTexturePattern;
}

export class ColorTextureComponent extends BlockComponent {
  static readonly type = 'color_texture';
  readonly type = 'color_texture';

  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly pattern: BlockTexturePattern;

  constructor(config: ColorTextureConfig) {
    super();
    this.primaryColor = config.primaryColor;
    this.secondaryColor = config.secondaryColor ?? config.primaryColor;
    this.pattern = config.pattern ?? 'plain';
  }
}
