import { globalBlockDB } from '../BlockSystem/BlockDB';
import { globalBlockEventBus, globalBlockManager } from '../BlockSystem/BlockManager';
import { globalItemDB, globalItemManager } from '../ItemSystem/ItemManager';
import { ModValidator } from './ModValidator';
import { LoadedMod, ModError, ModManifest, ModPackage } from './types';

export class ModManager {
  private readonly loadedMods = new Map<string, LoadedMod>();
  private readonly assets = new Map<string, string>(); // @mod_id/assets/... -> content

  /**
   * Load and register a ModPackage atomically.
   * If ANY definition or validation rule fails, the entire mod is rejected.
   */
  loadMod(pkg: ModPackage): { success: boolean; errors?: ModError[]; warnings?: string[] } {
    const manifestMap = new Map<string, ModManifest>();
    for (const [id, m] of this.loadedMods.entries()) {
      manifestMap.set(id, m.manifest);
    }

    // 1. Validate complete package
    const report = ModValidator.validate(pkg, manifestMap);
    if (!report.valid) {
      console.warn(`[ModManager] Mod "${pkg.manifest?.mod_id}" rejeitado na validação:`, report.errors);
      return {
        success: false,
        errors: report.errors,
        warnings: report.warnings,
      };
    }

    const { manifest, definitions, assets } = pkg;
    const modId = manifest.mod_id.replace(/^@/, '');

    // Prevent duplicate loading
    if (this.loadedMods.has(modId)) {
      const err: ModError = {
        mod_id: modId,
        object_id: modId,
        reason: `Mod "${modId}" já está carregado no sistema. Desinstale a versão anterior antes de recarregar.`,
      };
      return { success: false, errors: [err] };
    }

    const registeredBlockIds: string[] = [];
    const registeredItemIds: string[] = [];

    try {
      // 2. Register Assets
      if (assets) {
        for (const [assetPath, content] of Object.entries(assets)) {
          this.assets.set(assetPath, content);
        }
      }

      // 3. Register Items
      const items = definitions?.items || [];
      for (const item of items) {
        const itemRes = globalItemManager.registerModItem(item);
        if (!itemRes.success) {
          throw new Error(`Falha ao registrar item "${item.id}": ${itemRes.error}`);
        }
        registeredItemIds.push(item.id);
      }

      // 4. Register Blocks
      const blocks = definitions?.blocks || [];
      for (const block of blocks) {
        const blockRes = globalBlockManager.registerModBlock(block);
        if (!blockRes.success) {
          throw new Error(`Falha ao registrar bloco "${block.id}": ${blockRes.error}`);
        }
        registeredBlockIds.push(block.id);
      }

      // 5. Store Loaded Mod
      const loaded: LoadedMod = {
        manifest,
        definitions,
        assets: assets || {},
        loadedAt: Date.now(),
        blockIds: registeredBlockIds,
        itemIds: registeredItemIds,
      };

      this.loadedMods.set(modId, loaded);

      globalBlockEventBus.emit('block.created', {
        blockId: `mod:${modId}`,
        timestamp: Date.now(),
      });

      return { success: true, warnings: report.warnings };
    } catch (err: any) {
      // Rollback any partially registered items/blocks to uphold atomic integrity:
      // "Se qualquer Block/Definition do Mod estiver inválido: Mod inteiro não carrega."
      for (const bId of registeredBlockIds) {
        globalBlockDB.delete(bId);
      }
      for (const iId of registeredItemIds) {
        globalItemDB.delete(iId);
      }
      if (assets) {
        for (const assetPath of Object.keys(assets)) {
          this.assets.delete(assetPath);
        }
      }

      const modError: ModError = {
        mod_id: modId,
        object_id: modId,
        reason: `Erro crítico na montagem do Mod "${modId}": ${err.message}. Mod inteiro revertido.`,
      };

      return { success: false, errors: [modError] };
    }
  }

  /**
   * Uninstalls/removes a mod from the game.
   *
   * Architectural Rule:
   * "Se um Mod for removido/desinstalado e o mundo possuir Blocks pertencentes a ele,
   * esses Blocks devem ser removidos do mundo conforme as regras do sistema.
   * Não substitua automaticamente esses Blocks por outro Block."
   */
  uninstallMod(modId: string): { success: boolean; removedBlocksCount: number; error?: string } {
    const cleanModId = modId.replace(/^@/, '');
    const loaded = this.loadedMods.get(cleanModId);

    if (!loaded) {
      return { success: false, removedBlocksCount: 0, error: `Mod "${cleanModId}" não está carregado.` };
    }

    const modPrefix = `@${cleanModId}:`;
    let removedBlocksCount = 0;

    // 1. Remove all active instances of mod blocks from DynamicBlockManager
    const dynamic = globalBlockManager.dynamic;
    const activeInstances = dynamic.getAllActiveInstances();

    for (const inst of activeInstances) {
      if (inst.definitionId.startsWith(modPrefix)) {
        dynamic.unregisterInstance(inst.x, inst.y);
        removedBlocksCount++;
      }
    }

    // 2. Remove all cached unloaded snapshots of mod blocks from chunks
    const cached = dynamic.getAllCachedSnapshots();
    for (const snap of cached) {
      if (snap.definitionId.startsWith(modPrefix)) {
        dynamic.popCachedSnapshot(snap.x, snap.y);
        removedBlocksCount++;
      }
    }

    // 3. Remove Block Definitions from BlockDB
    for (const bId of loaded.blockIds) {
      globalBlockDB.delete(bId);
    }

    // 4. Remove Item Definitions from ItemDB
    for (const iId of loaded.itemIds) {
      globalItemDB.delete(iId);
    }

    // 5. Remove Mod Assets
    for (const assetPath of Object.keys(loaded.assets)) {
      this.assets.delete(assetPath);
    }

    // 6. Delete from loaded registry
    this.loadedMods.delete(cleanModId);

    return {
      success: true,
      removedBlocksCount,
    };
  }

  getLoadedMods(): LoadedMod[] {
    return Array.from(this.loadedMods.values());
  }

  getMod(modId: string): LoadedMod | undefined {
    return this.loadedMods.get(modId.replace(/^@/, ''));
  }

  isModLoaded(modId: string): boolean {
    return this.loadedMods.has(modId.replace(/^@/, ''));
  }

  getAsset(path: string): string | undefined {
    return this.assets.get(path);
  }

  getAllAssets(): Record<string, string> {
    const res: Record<string, string> = {};
    for (const [k, v] of this.assets.entries()) {
      res[k] = v;
    }
    return res;
  }
}

// Global Singleton
export const globalModManager = new ModManager();
