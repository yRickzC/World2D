/**
 * Mod Loader
 * Executes lifecycle loading: Initialize Registries -> Register Core -> Resolve Dependencies ->
 * Load Mods in Order -> Apply Patches -> Register Content -> Synchronize with runtime DBs.
 */
import { ModDependencyResolver } from './ModDependency';
import { ModPackageHelper } from './ModPackage';
import { globalModRegistries, ModRegistryHub } from './ModRegistry';
import { ModValidator } from './ModValidator';
import { ModPackage, ModValidationReport } from './types';
import { globalBlockDB } from '../gameplay/BlockSystem/BlockDB';
import { BlockDefinition } from '../gameplay/BlockSystem/BlockDefinition';
import { BaseBlockComponent, BlockComponentRegistry } from '../gameplay/BlockSystem/components';
import { globalItemDB, globalItemManager } from '../gameplay/ItemSystem/ItemManager';
import { ItemDefinition } from '../gameplay/ItemSystem/ItemDefinition';
import { EntitySystem_db } from '../gameplay/EntitySystem/EntityDB';
import { EntityDefinition } from '../gameplay/EntitySystem/EntityDefinition';
import { globalBiomeRegistry } from '../gameplay/mundo/biomas/BiomeRegistry';
import { BiomeDefinition } from '../gameplay/mundo/biomas/BiomeDefinition';

export interface ModLoadResult {
  success: boolean;
  loadedMods: string[];
  failedMods: { modId: string; reason: string }[];
  reports: ModValidationReport[];
}

export class ModLoader {
  constructor(private readonly registryHub: ModRegistryHub = globalModRegistries) {}

  /**
   * Initializes Registries and registers all Core content.
   */
  initializeCore(corePkg?: ModPackage): ModPackage {
    const core = corePkg || ModPackageHelper.getCorePackage();

    // Reset registries
    this.registryHub.clearMods();

    // 1. Register Core Blocks
    for (const b of core.content.blocks) {
      this.registryHub.blocks.register(b.id, b, 'core', true, b.name);
    }

    // 2. Register Core Items
    for (const i of core.content.items) {
      this.registryHub.items.register(i.id, i, 'core', true, i.nome || i.name);
    }

    // 3. Register Core Entities
    for (const e of core.content.entities) {
      this.registryHub.entities.register(e.id, e, 'core', true, e.name);
    }

    // 4. Register Core Biomes
    for (const bm of core.content.biomes) {
      this.registryHub.biomes.register(bm.id, bm, 'core', true, bm.name);
    }

    // 5. Register Core Surfaces
    for (const s of core.content.surfaces) {
      this.registryHub.surfaces.register(s.id, s, 'core', true, s.name);
    }

    // 6. Register Core Components
    for (const c of core.content.components) {
      this.registryHub.components.register(c.id, c, 'core', true, c.name);
    }

    // 7. Register Core Tags
    for (const t of core.content.tags) {
      this.registryHub.tags.register(t, [t], 'core', true, t);
    }

    this.registryHub.markInitialized();
    return core;
  }

  /**
   * Loads a set of mod packages on top of Core.
   */
  loadModPackages(
    packages: ModPackage[],
    corePkg: ModPackage
  ): ModLoadResult {
    const loadedMods: string[] = [];
    const failedMods: { modId: string; reason: string }[] = [];
    const reports: ModValidationReport[] = [];

    // Step 1: Ensure Core is initialized
    this.initializeCore(corePkg);

    // Step 2: Resolve dependency load order
    const modManifests = packages.map((p) => p.manifest);
    const orderResult = ModDependencyResolver.resolveOrder(modManifests, corePkg.manifest);

    if (orderResult.errors.length > 0) {
      for (const err of orderResult.errors) {
        failedMods.push({
          modId: err.objectId || 'unknown',
          reason: err.message,
        });
      }
    }

    const pkgMap = new Map<string, ModPackage>();
    for (const p of packages) {
      pkgMap.set(p.manifest.id, p);
    }

    const loadOrder = orderResult.loadOrder.filter((id) => id !== 'core');

    // Step 3: Load each mod in sorted order
    for (const modId of loadOrder) {
      const pkg = pkgMap.get(modId);
      if (!pkg) continue;

      // Validate mod
      const report = ModValidator.validate(pkg, [corePkg, ...packages]);
      reports.push(report);

      if (!report.valid) {
        const firstErr = report.issues.find((i) => i.severity === 'error')?.message || 'Falha de validação';
        failedMods.push({
          modId,
          reason: firstErr,
        });
        continue;
      }

      try {
        this.registerModContent(pkg);
        loadedMods.push(modId);
      } catch (err: any) {
        failedMods.push({
          modId,
          reason: err.message || 'Erro ao registrar conteúdo do mod',
        });
      }
    }

    // Step 4: Sync loaded definitions to runtime DBs (BlockDB, ItemDB, EntityDB, BiomeRegistry)
    this.syncToRuntimeDatabases();

    return {
      success: failedMods.length === 0,
      loadedMods,
      failedMods,
      reports,
    };
  }

  /**
   * Registers a validated mod's definitions into ModRegistryHub.
   */
  private registerModContent(pkg: ModPackage): void {
    const modId = pkg.manifest.id;

    // Apply Patches first
    for (const patch of pkg.content.patches || []) {
      if (patch.targetType === 'block') {
        this.registryHub.blocks.applyPatch(patch, modId);
      } else if (patch.targetType === 'item') {
        this.registryHub.items.applyPatch(patch, modId);
      }
    }

    // Register Blocks
    for (const b of pkg.content.blocks || []) {
      this.registryHub.blocks.register(b.id, b, modId, false, b.name);
    }

    // Register Items
    for (const i of pkg.content.items || []) {
      this.registryHub.items.register(i.id, i, modId, false, i.nome || i.name);
    }

    // Register Entities
    for (const e of pkg.content.entities || []) {
      this.registryHub.entities.register(e.id, e, modId, false, e.name);
    }

    // Register Biomes
    for (const bm of pkg.content.biomes || []) {
      this.registryHub.biomes.register(bm.id, bm, modId, false, bm.name);
    }

    // Register Surfaces
    for (const s of pkg.content.surfaces || []) {
      this.registryHub.surfaces.register(s.id, s, modId, false, s.name);
    }

    // Register Tags
    for (const t of pkg.content.tags || []) {
      this.registryHub.tags.register(t, [t], modId, false, t);
    }

    // Register Recipes
    for (const r of pkg.content.recipes || []) {
      this.registryHub.recipes.register(r.id, r, modId, false, r.name);
    }
  }

  /**
   * Propagate all loaded Mod + Core objects to the game's actual runtime engines
   * so the In-Game Canvas and World Generator seamlessly utilize them!
   */
  private syncToRuntimeDatabases(): void {
    // 1. Sync Blocks to globalBlockDB
    for (const entry of this.registryHub.blocks.getAll()) {
      const json = entry.data;
      if (!globalBlockDB.has(entry.id)) {
        try {
          const comps: BaseBlockComponent[] = [];
          for (const rawComp of json.components || []) {
            const factory = BlockComponentRegistry.get(rawComp.type);
            if (factory) {
              comps.push(factory(rawComp.id || rawComp.type, rawComp.data || {}));
            }
          }
          const blockDef = new BlockDefinition(
            entry.id,
            json.name || entry.name,
            json.category || 'natural',
            json.tags || [],
            comps
          );
          globalBlockDB.register(blockDef);
          // Also register under un-prefixed alias for compatibility
          if (entry.id.includes(':')) {
            const shortId = entry.id.split(':')[1];
            if (!globalBlockDB.has(shortId)) {
              globalBlockDB.register(new BlockDefinition(shortId, json.name, json.category, json.tags, comps));
            }
          }
        } catch (e) {
          console.warn(`[ModLoader] Failed to register block "${entry.id}" into globalBlockDB`, e);
        }
      }
    }

    // 2. Sync Items to globalItemDB
    for (const entry of this.registryHub.items.getAll()) {
      const json = entry.data;
      if (!globalItemDB.has(entry.id)) {
        try {
          const itemDef = globalItemManager.buildDefinitionFromJSON(json, true);
          globalItemDB.register(itemDef);
          if (entry.id.includes(':')) {
            const shortId = entry.id.split(':')[1];
            if (!globalItemDB.has(shortId)) {
              const shortDef = globalItemManager.buildDefinitionFromJSON({ ...json, id: shortId }, true);
              globalItemDB.register(shortDef);
            }
          }
        } catch (e) {
          console.warn(`[ModLoader] Failed to register item "${entry.id}" into globalItemDB`, e);
        }
      }
    }

    // 3. Sync Entities to EntitySystem_db
    for (const entry of this.registryHub.entities.getAll()) {
      const json = entry.data;
      if (!EntitySystem_db.get(entry.id)) {
        try {
          const entityDef = EntityDefinition.fromJSON(json);
          EntitySystem_db.register(entityDef);
          if (entry.id.includes(':')) {
            const shortId = entry.id.split(':')[1];
            if (!EntitySystem_db.get(shortId)) {
              EntitySystem_db.register(EntityDefinition.fromJSON({ ...json, id: shortId }));
            }
          }
        } catch (e) {
          console.warn(`[ModLoader] Failed to register entity "${entry.id}" into EntitySystem_db`, e);
        }
      }
    }

    // 4. Sync Biomes to globalBiomeRegistry
    for (const entry of this.registryHub.biomes.getAll()) {
      const json = entry.data;
      if (!globalBiomeRegistry.has(entry.id)) {
        try {
          const biomeDef = BiomeDefinition.fromJSON(json);
          globalBiomeRegistry.register(biomeDef);
          if (entry.id.includes(':')) {
            const shortId = entry.id.split(':')[1];
            if (!globalBiomeRegistry.has(shortId)) {
              globalBiomeRegistry.register(BiomeDefinition.fromJSON({ ...json, id: shortId }));
            }
          }
        } catch (e) {
          console.warn(`[ModLoader] Failed to register biome "${entry.id}" into globalBiomeRegistry`, e);
        }
      }
    }
  }
}

export const globalModLoader = new ModLoader();
