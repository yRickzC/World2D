import { ItemComponent } from './ItemComponent';

export type ItemVisualType = 'emoji' | 'color' | 'image' | 'svg' | 'custom';

/**
 * Base abstract class for any visual representation of an Item.
 * Allows items to be represented as emojis, colors/shapes, images, SVGs, or custom visual components.
 */
export abstract class ItemVisualComponent extends ItemComponent {
  abstract readonly visualType: ItemVisualType;
  abstract readonly accentColor: string;

  /**
   * Returns a fallback emoji character when text-only rendering is required.
   */
  abstract getEmojiFallback(): string;
}
