import { BaseComponent } from './BaseComponent';

export interface DescriptionComponentConfig {
  id?: string;
  text: string;
  categoryName?: string;
  lore?: string;
  dynamicGenerator?: (instance: any) => string;
}

export class DescriptionComponent extends BaseComponent {
  readonly type = 'description';
  readonly priority = 10;
  readonly isDynamic = false;

  readonly text: string;
  readonly categoryName: string;
  readonly lore?: string;
  private readonly dynamicGenerator?: (instance: any) => string;

  constructor(config: DescriptionComponentConfig) {
    super(config.id || 'desc_01');
    this.text = config.text;
    this.categoryName = config.categoryName || 'Item';
    this.lore = config.lore;
    this.dynamicGenerator = config.dynamicGenerator;
  }

  /**
   * Get the formatted description text, incorporating instance dynamic states if generator is defined.
   */
  getDescription(instance?: any): string {
    if (this.dynamicGenerator && instance) {
      try {
        return this.dynamicGenerator(instance);
      } catch {
        return this.text;
      }
    }
    return this.text;
  }

  toJSON(): Record<string, any> {
    return {
      text: this.text,
      categoryName: this.categoryName,
      lore: this.lore,
    };
  }
}
