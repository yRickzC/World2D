import { CORE_BLOCKS_DATA } from './data/blocks';
import { BlockDB, globalBlockDB } from './BlockDB';
import { BlockDefinition } from './BlockDefinition';
import { BlockEventBus } from './BlockEventBus';
import { BlockInstance, BlockInstanceSerialized } from './BlockInstance';
import { BlockLogger } from './BlockLogger';
import { BaseBlockComponent, BlockComponentRegistry } from './components';
import { DynamicBlockManager } from './DynamicBlockManager';
import { BlockSchemaRegistry } from './schemas/BlockSchemaRegistry';
import {
  BlockComponentSerializedData,
  BlockDefinitionJSON,
  BlockSystemError,
  BlockValidationReport,
} from './types';

export class BlockManager {
  readonly db: BlockDB;
  readonly bus: BlockEventBus;
  readonly dynamic: DynamicBlockManager;

  constructor(db?: BlockDB, bus?: BlockEventBus) {
    this.db = db || globalBlockDB;
    this.bus = bus || new BlockEventBus();
    this.dynamic = new DynamicBlockManager(this.bus);
  }

  /**
   * Initializes all core block definitions.
   * A critical error in core definitions will throw a fatal error preventing game startup.
   */
  initializeCore(): void {
    const rawList = Array.isArray(CORE_BLOCKS_DATA) ? CORE_BLOCKS_DATA : [];
    BlockLogger.debug('lifecycle', `Inicializando ${rawList.length} blocos Core.`);

    for (const raw of rawList) {
      try {
        const def = this.buildDefinitionFromJSON(raw as BlockDefinitionJSON, false);
        this.db.register(def);
      } catch (err: any) {
        BlockLogger.error(
          'erros',
          `[BlockSystem FATAL] Core Block Definition "${raw?.id}" falhou na inicialização:`,
          err
        );
        throw new Error(
          `[BlockSystem FATAL] Core Block Definition "${raw?.id}" failed initialization: ${err.message}`
        );
      }
    }
  }

  /**
   * Builds and validates a BlockDefinition from raw JSON data.
   */
  buildDefinitionFromJSON(json: BlockDefinitionJSON, isMod: boolean = false): BlockDefinition {
    // 1. Validate through SchemaRegistry
    const report = BlockSchemaRegistry.validateDefinition(json);
    if (!report.valid) {
      const firstErr = report.errors[0];
      throw new Error(`Validação falhou para o bloco "${json.id}": ${firstErr}`);
    }

    // 2. Instantiate components via BlockComponentRegistry
    const components: BaseBlockComponent[] = [];
    const rawComponents: BlockComponentSerializedData[] = Array.isArray(json.components)
      ? json.components
      : [];

    for (const rawComp of rawComponents) {
      const factory = BlockComponentRegistry.get(rawComp.type);
      if (!factory) {
        if (isMod) {
          throw new Error(
            `Mods não podem criar novos tipos de componentes: tipo desconhecido "${rawComp.type}".`
          );
        } else {
          throw new Error(`Tipo de componente não registrado: "${rawComp.type}".`);
        }
      }

      const compInstance = factory(rawComp.id, rawComp.data || {});
      components.push(compInstance);
    }

    return new BlockDefinition(
      json.id,
      json.name,
      json.category || 'natural',
      json.tags || [],
      components
    );
  }

  /**
   * Registers an external mod block definition safely.
   * Enforces the `@mod_id:object_id` namespace rule and schema compliance.
   */
  registerModBlock(json: any): {
    success: boolean;
    error?: string;
    errorDetails?: BlockSystemError[];
  } {
    try {
      if (!json || typeof json !== 'object') {
        throw new Error('Mod block definition payload must be an object.');
      }

      if (!json.id || typeof json.id !== 'string' || !json.id.startsWith('@')) {
        const errorReason = `Namespace incorreto no bloco "${json?.id}". IDs de Mods devem obrigatoriamente utilizar o padrão "@mod_id:object_id".`;
        BlockLogger.warn('erros', errorReason);
        return {
          success: false,
          error: errorReason,
          errorDetails: [
            {
              system: 'BlockSystem',
              object_id: json?.id || 'unknown',
              reason: errorReason,
            },
          ],
        };
      }

      const report = BlockSchemaRegistry.validateDefinition(json);
      if (!report.valid) {
        BlockLogger.warn('erros', `Mod block "${json.id}" rejeitado por validação de schema:`, report.errors);
        return {
          success: false,
          error: report.errors.join('; '),
          errorDetails: report.errorDetails,
        };
      }

      const def = this.buildDefinitionFromJSON(json as BlockDefinitionJSON, true);
      this.db.register(def);

      BlockLogger.debug('lifecycle', `Mod block "${def.id}" registrado com sucesso.`);

      this.bus.emit('block.created', {
        blockId: def.id,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (err: any) {
      BlockLogger.warn('erros', `External mod block "${json?.id}" rejeitado:`, err.message);
      return {
        success: false,
        error: err.message,
        errorDetails: [
          {
            system: 'BlockSystem',
            object_id: json?.id || 'unknown',
            reason: err.message,
          },
        ],
      };
    }
  }

  /**
   * Instantiate a new BlockInstance in the world.
   * If the block has dynamic components, registers it with DynamicBlockManager.
   */
  createInstance(
    definitionId: string,
    x: number,
    y: number,
    initialState?: Record<string, any>,
    customInstanceId?: string
  ): BlockInstance {
    const def = this.db.getBlock(definitionId);
    const instanceId =
      customInstanceId ||
      `block_${definitionId}_${x}_${y}_${Date.now().toString(36)}`;

    // Check if there was a cached snapshot for this coordinate from an unloaded chunk
    const cachedSnap = this.dynamic.popCachedSnapshot(x, y);
    const state = {
      ...(cachedSnap ? cachedSnap.state : {}),
      ...(initialState || {}),
    };

    const instance = new BlockInstance(instanceId, def, x, y, state);

    if (def.isDynamic) {
      this.dynamic.registerInstance(instance);
    }

    return instance;
  }

  /**
   * Remove/destroy a block instance at world coordinates.
   */
  destroyInstance(x: number, y: number): BlockInstance | undefined {
    return this.dynamic.unregisterInstance(x, y);
  }

  /**
   * Validates a block definition payload against schemas without registering it.
   */
  validateBlock(json: Partial<BlockDefinitionJSON>): BlockValidationReport {
    return BlockSchemaRegistry.validateDefinition(json);
  }

  /**
   * Serializes all dynamic block states across the world for game saving.
   */
  serializeWorldState(): BlockInstanceSerialized[] {
    const snapshots: BlockInstanceSerialized[] = [];
    const recordedCoords = new Set<string>();

    // 1. From currently active loaded instances
    for (const inst of this.dynamic.getAllActiveInstances()) {
      const key = `${inst.x}_${inst.y}`;
      recordedCoords.add(key);
      snapshots.push(inst.toJSON());
    }

    // 2. From unloaded chunk snapshots
    for (const cached of this.dynamic.getAllCachedSnapshots()) {
      const key = `${cached.x}_${cached.y}`;
      if (!recordedCoords.has(key)) {
        recordedCoords.add(key);
        snapshots.push(cached);
      }
    }

    return snapshots;
  }

  /**
   * Deserializes saved block states into the world.
   */
  deserializeWorldState(savedList: BlockInstanceSerialized[]): void {
    if (!Array.isArray(savedList)) return;
    for (const snap of savedList) {
      this.createInstance(snap.definitionId, snap.x, snap.y, snap.state, snap.instanceId);
    }
  }
}

// Global Singleton instances
export const globalBlockEventBus = new BlockEventBus();
export const globalBlockManager = new BlockManager(globalBlockDB, globalBlockEventBus);

// Canonical aliases for the system
export const BlockSystem_manager = globalBlockManager;
export const BlockSystem_bus = globalBlockEventBus;

// Initialize Core blocks on startup
globalBlockManager.initializeCore();
