/**
 * Base Abstract Component for Items.
 * Designed to be composed to create items without needing specific classes per item.
 */
export abstract class ItemComponent {
  abstract readonly type: string;
}

