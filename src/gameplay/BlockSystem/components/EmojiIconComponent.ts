import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockComponentSchemaDefinition } from '../types';

export interface EmojiIconConfig {
  id?: string;
  emoji: string;
}

export class EmojiIconComponent extends BaseBlockComponent {
  static readonly type = 'EmojiIconComponent';
  readonly type = 'EmojiIconComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'EmojiIconComponent',
    name: 'EmojiIconComponent',
    version: '1.0.0',
    description: 'Renderiza um emoji representativo sobre o bloco no mundo ou em ícones de UI.',
    isDynamic: false,
    isSingleton: true,
    properties: {
      emoji: {
        label: 'Emoji / Símbolo',
        type: 'string',
        required: true,
        default: '🪵',
        description: 'Caractere unicode ou emoji exibido no bloco.',
        editor: { widget: 'text' },
      },
    },
    runtime: {
      priority: 18,
      hooks: ['render'],
    },
    editor: {
      category: 'Visual',
      icon: 'smile',
    },
  };

  readonly emoji: string;

  constructor(config: EmojiIconConfig | string) {
    const id = typeof config === 'object' && config.id ? config.id : 'emoji_01';
    super(id);
    this.emoji = typeof config === 'string' ? config : config.emoji || '⬛';
  }

  toJSON(): Record<string, any> {
    return {
      emoji: this.emoji,
    };
  }
}
