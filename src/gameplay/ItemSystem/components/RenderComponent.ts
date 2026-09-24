import { BaseComponent } from './BaseComponent';

export type ItemRendererType =
  | 'label'
  | 'label_icon'
  | 'label_emoji'
  | 'svg_renderer'
  | 'emoji'
  | 'image'
  | 'svg'
  | 'color'
  | 'canvas'
  | 'react';

export interface RenderComponentConfig {
  id?: string;
  renderer?: ItemRendererType;
  showLabel?: boolean;
  scale?: number;
  // Visual fallback or legacy configuration
  value?: string;
  accentColor?: string;
  fill?: string;
  stroke?: string;
  svgPath?: string;
  viewBox?: string;
  imageUrl?: string;
  color?: string;
  shape?: 'rounded' | 'circle' | 'square';
  label?: string;
  customDraw?: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
  reactComponent?: any;
}

export class RenderComponent extends BaseComponent {
  readonly type = 'RenderComponent';
  readonly priority = 100;
  readonly isDynamic = false;

  readonly renderer: ItemRendererType;
  readonly showLabel: boolean;
  readonly scale: number;

  // Legacy/fallback properties
  readonly value: string;
  readonly accentColor: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly svgPath?: string;
  readonly viewBox?: string;
  readonly imageUrl?: string;
  readonly color?: string;
  readonly shape?: 'rounded' | 'circle' | 'square';
  readonly label?: string;
  readonly reactComponent?: any;
  readonly customDraw?: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;

  constructor(config: RenderComponentConfig) {
    super(config.id || 'render_01');
    this.renderer = config.renderer || 'label_emoji';
    this.showLabel = config.showLabel ?? true;
    this.scale = Math.max(0.1, Math.min(3.0, config.scale ?? 1.0));

    this.value = config.value || '';
    this.accentColor = config.accentColor || '#64748b';
    this.fill = config.fill;
    this.stroke = config.stroke;
    this.svgPath = config.svgPath;
    this.viewBox = config.viewBox;
    this.imageUrl = config.imageUrl;
    this.color = config.color;
    this.shape = config.shape;
    this.label = config.label;
    this.reactComponent = config.reactComponent;
    this.customDraw = config.customDraw;
  }

  onRender(ctx: CanvasRenderingContext2D, _instance: any, x: number, y: number, size: number): void {
    ctx.save();

    if (this.scale !== 1.0) {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.translate(cx, cy);
      ctx.scale(this.scale, this.scale);
      ctx.translate(-cx, -cy);
    }

    switch (this.renderer) {
      case 'label_emoji':
      case 'emoji': {
        const fontSize = Math.floor(size * 0.65);
        ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value || '📦', x + size / 2, y + size / 2 + 1);
        break;
      }

      case 'svg_renderer':
      case 'svg': {
        if (this.svgPath) {
          const p = new Path2D(this.svgPath);
          ctx.translate(x + size * 0.15, y + size * 0.15);
          const scale = (size * 0.7) / 24;
          ctx.scale(scale, scale);
          if (this.fill) {
            ctx.fillStyle = this.fill;
            ctx.fill(p);
          }
          if (this.stroke) {
            ctx.strokeStyle = this.stroke;
            ctx.lineWidth = 1.5;
            ctx.stroke(p);
          }
        }
        break;
      }

      case 'color': {
        const shape = this.shape || 'rounded';
        const color = this.color || this.accentColor;
        ctx.fillStyle = color;
        const pad = size * 0.15;
        const drawSize = size - pad * 2;

        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, drawSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(x + pad, y + pad, drawSize, drawSize, 6);
          ctx.fill();
        } else {
          ctx.fillRect(x + pad, y + pad, drawSize, drawSize);
        }

        if (this.showLabel && this.label) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.floor(size * 0.25)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.label, x + size / 2, y + size / 2);
        }
        break;
      }

      case 'canvas': {
        if (this.customDraw) {
          this.customDraw(ctx, x, y, size);
        }
        break;
      }

      default:
        break;
    }

    ctx.restore();
  }

  toJSON(): Record<string, any> {
    return {
      renderer: this.renderer,
      showLabel: this.showLabel,
      scale: this.scale,
      ...(this.value ? { value: this.value } : {}),
      ...(this.accentColor ? { accentColor: this.accentColor } : {}),
      ...(this.label ? { label: this.label } : {}),
      ...(this.svgPath ? { svgPath: this.svgPath } : {}),
    };
  }
}
