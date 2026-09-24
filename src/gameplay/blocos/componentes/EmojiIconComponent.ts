import { BlockComponent } from './BlockComponent';

export interface EmojiIconConfig {
  emoji: string;
}

export class EmojiIconComponent extends BlockComponent {
  static readonly type = 'emoji_icon';
  readonly type = 'emoji_icon';

  readonly emoji: string;

  constructor(config: EmojiIconConfig) {
    super();
    this.emoji = config.emoji;
  }
}
