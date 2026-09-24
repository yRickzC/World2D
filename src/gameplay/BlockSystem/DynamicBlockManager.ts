import { BlockEventBus } from './BlockEventBus';
import { BlockInstance, BlockInstanceSerialized } from './BlockInstance';

export class DynamicBlockManager {
  private readonly bus: BlockEventBus;

  // Active instances currently loaded in memory: key is `${x}_${y}`
  private readonly activeByCoord: Map<string, BlockInstance> = new Map();

  // Active instances grouped by chunk for fast bulk loading/unloading
  private readonly chunkInstances: Map<string, Set<string>> = new Map();

  // Serialized snapshots of unloaded dynamic blocks to maintain persistence without memory bloat
  private readonly cachedUnloadedState: Map<string, BlockInstanceSerialized> = new Map();

  constructor(bus: BlockEventBus) {
    this.bus = bus;
  }

  private getCoordKey(x: number, y: number): string {
    return `${x}_${y}`;
  }

  /**
   * Register an active dynamic instance in the world.
   */
  registerInstance(instance: BlockInstance): void {
    const key = this.getCoordKey(instance.x, instance.y);
    this.activeByCoord.set(key, instance);

    if (!this.chunkInstances.has(instance.chunkKey)) {
      this.chunkInstances.set(instance.chunkKey, new Set());
    }
    this.chunkInstances.get(instance.chunkKey)!.add(key);

    // Call onPlaced lifecycle hook
    for (const comp of instance.definition.getSortedComponents()) {
      if (comp.onPlaced) {
        comp.onPlaced(instance);
      }
    }

    this.bus.emit('block.placed', {
      blockId: instance.definitionId,
      instanceId: instance.instanceId,
      x: instance.x,
      y: instance.y,
      chunkKey: instance.chunkKey,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove a dynamic instance (e.g. broken or replaced).
   */
  unregisterInstance(x: number, y: number): BlockInstance | undefined {
    const key = this.getCoordKey(x, y);
    const instance = this.activeByCoord.get(key);
    if (!instance) return undefined;

    // Call onDestroyed lifecycle hook
    for (const comp of instance.definition.getSortedComponents()) {
      if (comp.onDestroyed) {
        comp.onDestroyed(instance);
      }
    }

    this.activeByCoord.delete(key);
    const chunkSet = this.chunkInstances.get(instance.chunkKey);
    if (chunkSet) {
      chunkSet.delete(key);
      if (chunkSet.size === 0) {
        this.chunkInstances.delete(instance.chunkKey);
      }
    }
    this.cachedUnloadedState.delete(key);

    this.bus.emit('block.destroyed', {
      blockId: instance.definitionId,
      instanceId: instance.instanceId,
      x,
      y,
      chunkKey: instance.chunkKey,
      timestamp: Date.now(),
    });

    return instance;
  }

  getInstance(x: number, y: number): BlockInstance | undefined {
    return this.activeByCoord.get(this.getCoordKey(x, y));
  }

  /**
   * Simulates active dynamic blocks for currently loaded chunks only.
   */
  update(dt: number): void {
    for (const instance of this.activeByCoord.values()) {
      for (const comp of instance.definition.getSortedComponents()) {
        if (comp.onTick) {
          comp.onTick(instance, dt);
        }
      }
    }
  }

  /**
   * Handles player interaction with a dynamic block at coordinates.
   */
  interact(x: number, y: number, interactor: any): boolean {
    const instance = this.getInstance(x, y);
    if (!instance) return false;

    let handled = false;
    for (const comp of instance.definition.getSortedComponents()) {
      if (comp.onInteract) {
        const res = comp.onInteract(instance, interactor);
        if (res) handled = true;
      }
    }

    if (handled) {
      this.bus.emit('block.interacted', {
        blockId: instance.definitionId,
        instanceId: instance.instanceId,
        x,
        y,
        chunkKey: instance.chunkKey,
        timestamp: Date.now(),
      });
    }

    return handled;
  }

  // --- Memory Optimization: Chunk-based On-Demand Loading & Unloading ---

  /**
   * Unload all instances belonging to a chunk.
   * Serializes their mutable state to cache and releases object references to free memory.
   */
  unloadChunk(chunkKey: string): void {
    const keys = this.chunkInstances.get(chunkKey);
    if (!keys) return;

    for (const key of keys) {
      const inst = this.activeByCoord.get(key);
      if (inst) {
        // Cache snapshot in serialized form (no object reference retained)
        this.cachedUnloadedState.set(key, inst.toJSON());
        this.activeByCoord.delete(key);
      }
    }

    this.chunkInstances.delete(chunkKey);

    this.bus.emit('block.unloaded', {
      blockId: 'chunk',
      chunkKey,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if any cached unloaded state exists for chunk.
   */
  getCachedChunkSnapshots(chunkKey: string): BlockInstanceSerialized[] {
    const result: BlockInstanceSerialized[] = [];
    for (const [key, snap] of this.cachedUnloadedState.entries()) {
      if (snap.chunkKey === chunkKey) {
        result.push(snap);
      }
    }
    return result;
  }

  /**
   * Consume and clear cached snapshot when chunk is re-loaded.
   */
  popCachedSnapshot(x: number, y: number): BlockInstanceSerialized | undefined {
    const key = this.getCoordKey(x, y);
    const snap = this.cachedUnloadedState.get(key);
    if (snap) {
      this.cachedUnloadedState.delete(key);
    }
    return snap;
  }

  getActiveCount(): number {
    return this.activeByCoord.size;
  }

  getAllActiveInstances(): BlockInstance[] {
    return Array.from(this.activeByCoord.values());
  }

  getAllCachedSnapshots(): BlockInstanceSerialized[] {
    return Array.from(this.cachedUnloadedState.values());
  }

  getLoadedChunkCount(): number {
    return this.chunkInstances.size;
  }

  clear(): void {
    this.activeByCoord.clear();
    this.chunkInstances.clear();
    this.cachedUnloadedState.clear();
  }
}
