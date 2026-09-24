import { ItemVisualComponent } from './ItemVisualComponent';

export interface EmojiVisualConfig {
  emoji: string;
  accentColor?: string;
  scale?: number;
}

/**
 * EmojiVisualComponent:
 * Visual representation using standard or unicode emoji glyphs with custom accent colors.
 */
export class EmojiVisualComponent extends ItemVisualComponent {
  static readonly type = 'visual_emoji';
  readonly type = 'visual_emoji';
  readonly visualType = 'emoji';

  readonly emoji: string;
  readonly accentColor: string;
  readonly scale: number;

  constructor(config: EmojiVisualConfig) {
    super();
    this.emoji = config.emoji;
    this.accentColor = config.accentColor ?? '#d97706';
    this.scale = config.scale ?? 1.0;
  }

  getEmojiFallback(): string {
    return this.emoji;
  }
}
