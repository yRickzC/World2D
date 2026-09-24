import { BlockDefinition } from './BlockDefinition';

export interface BlockInstanceSerialized {
  instanceId: string;
  definitionId: string;
  x: number;
  y: number;
  chunkKey?: string;
  state: Record<string, any>;
}

export class BlockInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly x: number;
  readonly y: number;
  readonly chunkKey: string;

  /**
   * Only mutable dynamic state is held here (e.g. progress, currentDamage, activation state).
   * Static definition properties are NEVER duplicated in instance state.
   */
  readonly state: Record<string, any>;

  private _definition: BlockDefinition;

  constructor(
    instanceId: string,
    definition: BlockDefinition,
    x: number,
    y: number,
    initialState: Record<string, any> = {},
    chunkKey?: string
  ) {
    this.instanceId = instanceId;
    this.definitionId = definition.id;
    this._definition = definition;
    this.x = x;
    this.y = y;
    this.chunkKey = chunkKey || `chunk_${Math.floor(x / 16)}_${Math.floor(y / 16)}`;

    // Build initial dynamic state from components without duplicating static definitions
    const componentDefaults: Record<string, any> = {};
    for (const comp of definition.getAllComponents()) {
      if (comp.getInitialDynamicState) {
        Object.assign(componentDefaults, comp.getInitialDynamicState());
      }
    }

    this.state = {
      ...componentDefaults,
      ...initialState,
    };
  }

  get definition(): BlockDefinition {
    return this._definition;
  }

  /**
   * Allows refreshing definition reference if hot-reloaded by a mod or dev editor.
   */
  setDefinition(definition: BlockDefinition): void {
    if (definition.id === this.definitionId) {
      this._definition = definition;
    }
  }

  /**
   * Serializes ONLY mutable state and coordinates for lightweight, low-memory persistence.
   */
  toJSON(): BlockInstanceSerialized {
    return {
      instanceId: this.instanceId,
      definitionId: this.definitionId,
      x: this.x,
      y: this.y,
      chunkKey: this.chunkKey,
      state: { ...this.state },
    };
  }
}
