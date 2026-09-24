import { BaseComponent } from './BaseComponent';

export interface TagComponentConfig {
  id?: string;
  tags?: string[] | string;
}

export class TagComponent extends BaseComponent {
  readonly type = 'TagComponent';
  readonly priority = 50;
  readonly isDynamic = false;

  readonly tags: string[];

  constructor(config: TagComponentConfig) {
    super(config.id || 'tag_01');
    if (Array.isArray(config.tags)) {
      this.tags = config.tags;
    } else if (typeof config.tags === 'string') {
      this.tags = config.tags.split(',').map((t) => t.trim()).filter(Boolean);
    } else {
      this.tags = [];
    }
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  toJSON(): Record<string, any> {
    return {
      tags: this.tags,
    };
  }
}
