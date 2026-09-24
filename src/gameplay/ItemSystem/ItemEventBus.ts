import { ItemEventListener, ItemEventPayload, ItemEventType } from './types';

/**
 * Isolated, low-memory, synchronous Event Bus for ItemSystem.
 * Keeps event communication decoupled between components and subsystems.
 */
export class ItemEventBus {
  private listeners: Map<string, Set<ItemEventListener>> = new Map();

  /**
   * Subscribe to an event. Returns an unsubscribe function for explicit cleanup.
   */
  on(event: ItemEventType | string, listener: ItemEventListener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe a listener explicitly.
   */
  off(event: ItemEventType | string, listener: ItemEventListener): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Synchronous dispatch without allocating queues or accumulating unbounded payloads.
   */
  emit(event: ItemEventType | string, payload: ItemEventPayload): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    // Dispatch directly to registered listeners
    for (const listener of set) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[ItemEventBus] Error in listener for event "${event}":`, err);
      }
    }
  }

  /**
   * Clear all registered listeners (for reset or test tear down).
   */
  clear(): void {
    this.listeners.clear();
  }
}
