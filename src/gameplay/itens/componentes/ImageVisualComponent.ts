import { ItemVisualComponent } from './ItemVisualComponent';

export interface ImageVisualConfig {
  src: string;
  alt?: string;
  accentColor?: string;
  pixelated?: boolean;
  fallbackEmoji?: string;
}

/**
 * ImageVisualComponent:
 * Visual representation using external or local raster images (PNG, WebP, etc.).
 */
export class ImageVisualComponent extends ItemVisualComponent {
  static readonly type = 'visual_image';
  readonly type = 'visual_image';
  readonly visualType = 'image';

  readonly src: string;
  readonly alt: string;
  readonly accentColor: string;
  readonly pixelated: boolean;
  readonly fallbackEmoji: string;

  constructor(config: ImageVisualConfig) {
    super();
    this.src = config.src;
    this.alt = config.alt ?? 'Item image';
    this.accentColor = config.accentColor ?? '#6366f1';
    this.pixelated = config.pixelated ?? true;
    this.fallbackEmoji = config.fallbackEmoji ?? '🖼️';
  }

  getEmojiFallback(): string {
    return this.fallbackEmoji;
  }
}
