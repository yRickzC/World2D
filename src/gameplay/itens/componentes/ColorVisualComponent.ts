import { ItemVisualComponent } from './ItemVisualComponent';

export type ColorItemShape = 'square' | 'rounded' | 'circle' | 'gem' | 'ingot';

export interface ColorVisualConfig {
  color: string;
  shape?: ColorItemShape;
  borderColor?: string;
  accentColor?: string;
  innerPattern?: 'plain' | 'gloss' | 'stripe' | 'grid';
  label?: string;
}

/**
 * ColorVisualComponent:
 * Visual representation using pure CSS/canvas colors, shapes, glosses and accents.
 */
export class ColorVisualComponent extends ItemVisualComponent {
  static readonly type = 'visual_color';
  readonly type = 'visual_color';
  readonly visualType = 'color';

  readonly color: string;
  readonly shape: ColorItemShape;
  readonly borderColor: string;
  readonly accentColor: string;
  readonly innerPattern: 'plain' | 'gloss' | 'stripe' | 'grid';
  readonly label?: string;

  constructor(config: ColorVisualConfig) {
    super();
    this.color = config.color;
    this.shape = config.shape ?? 'rounded';
    this.borderColor = config.borderColor ?? '#52525b';
    this.accentColor = config.accentColor ?? config.color;
    this.innerPattern = config.innerPattern ?? 'plain';
    this.label = config.label;
  }

  getEmojiFallback(): string {
    return '🟩';
  }
}
