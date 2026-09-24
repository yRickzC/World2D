import { BlockInstance } from '../BlockInstance';

export interface BaseBlockComponentConfig {
  id: string;
  [key: string]: any;
}

export abstract class BaseBlockComponent {
  abstract readonly type: string;
  readonly id: string;
  readonly priority: number = 50;
  readonly isDynamic: boolean = false;
  readonly requires?: string[];
  readonly incompatibleWith?: string[];

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Called when a block instance is placed in the world.
   */
  onPlaced?(instance: BlockInstance, context?: any): void;

  /**
   * Called when a block instance is destroyed/mined.
   */
  onDestroyed?(instance: BlockInstance, context?: any): void;

  /**
   * Called on dynamic simulation ticks (managed by DynamicBlockManager).
   */
  onTick?(instance: BlockInstance, dt: number): void;

  /**
   * Called when player interacts/clicks on the block.
   */
  onInteract?(instance: BlockInstance, interactor: any): boolean;

  /**
   * Returns initial mutable state for dynamic instances.
   */
  getInitialDynamicState?(): Record<string, any> {
    return {};
  }

  /**
   * Serializes static component data for persistence or inspection.
   */
  abstract toJSON(): Record<string, any>;
}
