import { BlockLogger } from './BlockLogger';
import { BlockEventListener, BlockEventPayload, BlockEventType } from './types';

export class BlockEventBus {
  private listeners: Map<string, Set<BlockEventListener>> = new Map();

  /**
   * Subscribe to a block event.
   */
  on(event: BlockEventType | string, listener: BlockEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unbind function
    return () => {
      this.off(event, listener);
    };
  }

  /**
   * Subscribe to an event once.
   */
  once(event: BlockEventType | string, listener: BlockEventListener): void {
    const wrapper: BlockEventListener = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event: BlockEventType | string, listener: BlockEventListener): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit a synchronous event across the system.
   */
  emit(event: BlockEventType | string, payload: BlockEventPayload): void {
    BlockLogger.debug('eventos', `Evento síncrono emitido: "${event}"`, payload);

    const set = this.listeners.get(event);
    if (set) {
      for (const listener of Array.from(set)) {
        try {
          listener(payload);
        } catch (err) {
          BlockLogger.error('erros', `Erro no listener do evento "${event}":`, err);
        }
      }
    }

    // Also notify wildcard listeners if registered
    const wildcardSet = this.listeners.get('*');
    if (wildcardSet) {
      for (const listener of Array.from(wildcardSet)) {
        try {
          listener(payload);
        } catch (err) {
          BlockLogger.error('erros', 'Erro no listener curinga (*):', err);
        }
      }
    }
  }

  /**
   * Clear all listeners (used on world unload / reset).
   */
  clear(): void {
    this.listeners.clear();
  }
}
