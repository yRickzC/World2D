import { BaseComponent } from './BaseComponent';

export type VisualType = 'Emoji' | 'SVG';
export type SvgSourceType = 'SVG Code' | 'SVG Path';

export interface VisualComponentConfig {
  id?: string;
  visualType?: VisualType;
  source?: string;
  svgSourceType?: SvgSourceType;
  accentColor?: string;
}

export class VisualComponent extends BaseComponent {
  readonly type = 'VisualComponent';
  readonly priority = 95;
  readonly isDynamic = false;

  readonly visualType: VisualType;
  readonly source: string;
  readonly svgSourceType: SvgSourceType;
  readonly accentColor: string;

  constructor(config: VisualComponentConfig) {
    super(config.id || 'visual_01');
    this.visualType = config.visualType || 'Emoji';
    this.source = config.source || (this.visualType === 'Emoji' ? '⚔️' : '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L2 22h20L12 2z"/></svg>');
    this.svgSourceType = config.svgSourceType || (this.source.trim().startsWith('<') ? 'SVG Code' : 'SVG Path');
    this.accentColor = config.accentColor || '#38bdf8';
  }

  toJSON(): Record<string, any> {
    return {
      visualType: this.visualType,
      source: this.source,
      svgSourceType: this.svgSourceType,
      accentColor: this.accentColor,
    };
  }
}
