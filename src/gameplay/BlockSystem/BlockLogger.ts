/**
 * BlockLogger provides centralized debug logging controlled by the BLOCK_DEBUG environment variable.
 * When BLOCK_DEBUG=true, diagnostic information about loading, unloading, cache,
 * dependencies, events, errors, cycles, creation/destruction, and mods is printed.
 * When disabled (default), zero debug prints are emitted.
 */
export type BlockDebugTopic =
  | 'carregamento'
  | 'descarregamento'
  | 'cache'
  | 'dependencias'
  | 'eventos'
  | 'erros'
  | 'ciclos'
  | 'criacao_destruicao'
  | 'mods';

export class BlockLogger {
  private static cachedState: boolean | null = null;

  /**
   * Check if BLOCK_DEBUG is enabled via import.meta.env or process.env.
   */
  static isEnabled(): boolean {
    if (this.cachedState !== null) {
      return this.cachedState;
    }

    let enabled = false;

    try {
      // Check Vite client-side environment
      if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        const env = (import.meta as any).env;
        if (env.BLOCK_DEBUG === 'true' || env.VITE_BLOCK_DEBUG === 'true') {
          enabled = true;
        }
      }
    } catch {
      // ignore
    }

    try {
      // Check Node/server process environment
      if (!enabled && typeof process !== 'undefined' && process.env) {
        if (process.env.BLOCK_DEBUG === 'true' || process.env.VITE_BLOCK_DEBUG === 'true') {
          enabled = true;
        }
      }
    } catch {
      // ignore
    }

    this.cachedState = enabled;
    return enabled;
  }

  /**
   * Allows manually forcing or toggling debug mode at runtime (e.g. from developer console).
   */
  static setEnabled(enabled: boolean): void {
    this.cachedState = enabled;
  }

  static debug(topic: BlockDebugTopic | string, message: string, data?: any): void {
    if (!this.isEnabled()) return;
    const prefix = `[BlockSystem:${topic}]`;
    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  static warn(topic: BlockDebugTopic | string, message: string, data?: any): void {
    if (!this.isEnabled()) return;
    const prefix = `[BlockSystem:${topic}]`;
    if (data !== undefined) {
      console.warn(`${prefix} ⚠️ ${message}`, data);
    } else {
      console.warn(`${prefix} ⚠️ ${message}`);
    }
  }

  static error(topic: BlockDebugTopic | string, message: string, data?: any): void {
    // Critical errors are always logged if serious, but with debug prefix
    const prefix = `[BlockSystem:${topic}]`;
    if (data !== undefined) {
      console.error(`${prefix} ❌ ${message}`, data);
    } else {
      console.error(`${prefix} ❌ ${message}`);
    }
  }
}
