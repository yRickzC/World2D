import { ItemComponent } from './ItemComponent';

export interface DescriptionConfig {
  text: string;
  detailedText?: string;
  lore?: string;
  categoryName?: string;
  badge?: string;
  customAttributes?: Record<string, string | number>;
}

/**
 * DescriptionComponent:
 * Dynamic description component for items.
 * Allows items to have rich, custom component-based descriptions, lore, hints, and category labels.
 */
export class DescriptionComponent extends ItemComponent {
  static readonly type = 'description';
  readonly type = 'description';

  readonly text: string;
  readonly detailedText?: string;
  readonly lore?: string;
  readonly categoryName?: string;
  readonly badge?: string;
  readonly customAttributes?: Record<string, string | number>;

  constructor(config: DescriptionConfig | string) {
    super();
    if (typeof config === 'string') {
      this.text = config;
    } else {
      this.text = config.text;
      this.detailedText = config.detailedText;
      this.lore = config.lore;
      this.categoryName = config.categoryName;
      this.badge = config.badge;
      this.customAttributes = config.customAttributes;
    }
  }
}
