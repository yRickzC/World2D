import { ItemVisualComponent } from './ItemVisualComponent';

export interface SvgVisualConfig {
  svgPath?: string; // SVG path data (d="...")
  svgMarkup?: string; // Full SVG markup
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  accentColor?: string;
  fallbackEmoji?: string;
}

/**
 * SvgVisualComponent:
 * Visual representation using scalable vector graphics (SVG paths or markup).
 */
export class SvgVisualComponent extends ItemVisualComponent {
  static readonly type = 'visual_svg';
  readonly type = 'visual_svg';
  readonly visualType = 'svg';

  readonly svgPath?: string;
  readonly svgMarkup?: string;
  readonly viewBox: string;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly accentColor: string;
  readonly fallbackEmoji: string;

  constructor(config: SvgVisualConfig) {
    super();
    this.svgPath = config.svgPath;
    this.svgMarkup = config.svgMarkup;
    this.viewBox = config.viewBox ?? '0 0 24 24';
    this.fill = config.fill ?? 'currentColor';
    this.stroke = config.stroke ?? 'none';
    this.strokeWidth = config.strokeWidth ?? 1.5;
    this.accentColor = config.accentColor ?? '#10b981';
    this.fallbackEmoji = config.fallbackEmoji ?? '✨';
  }

  getEmojiFallback(): string {
    return this.fallbackEmoji;
  }
}
