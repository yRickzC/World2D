/**
 * Base Abstract Component for Blocks.
 * Blocks are composed from individual components without needing custom subclasses.
 */
export abstract class BlockComponent {
  abstract readonly type: string;
}

