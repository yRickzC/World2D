/**
 * Mod Manager
 * Primary state management and repository for Mod Packages and Core in the game and Mod Dev studio.
 * Handles persistence (localStorage), package lifecycle, CRUD, import/export, and synchronization.
 */
import { ModLoader, globalModLoader } from './ModLoader';
import { ModPackageHelper } from './ModPackage';
import { globalModRegistries, ModRegistryHub } from './ModRegistry';
import { ModValidator } from './ModValidator';
import { ModManifest, ModPackage, ModPatch, ModValidationReport } from './types';

const STORAGE_MODS_KEY = 'craft_survival_2d_mod_packages_v2';
const STORAGE_CORE_KEY = 'craft_survival_2d_core_package_v2';

export class ModManager {
  private corePackage: ModPackage;
  private modPackages = new Map<string, ModPackage>();
  private activePackageId: string = 'core';
  private listeners: (() => void)[] = [];

  constructor(
    private readonly loader: ModLoader = globalModLoader,
    private readonly registryHub: ModRegistryHub = globalModRegistries
  ) {
    this.corePackage = this.loadCorePackage();
    this.loadPackagesFromStorage();
    this.reloadAll();
  }

  // ==========================================
  // Persistence & Initialization
  // ==========================================

  private loadCorePackage(): ModPackage {
    try {
      const raw = localStorage.getItem(STORAGE_CORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.manifest?.id === 'core') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[ModManager] Using fresh core package', e);
    }
    const freshCore = ModPackageHelper.getCorePackage();
    this.saveCoreToStorage(freshCore);
    return freshCore;
  }

  private saveCoreToStorage(core: ModPackage): void {
    try {
      localStorage.setItem(STORAGE_CORE_KEY, JSON.stringify(core));
    } catch (e) {
      console.warn('[ModManager] Failed to persist core package', e);
    }
  }

  private loadPackagesFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_MODS_KEY);
      if (raw) {
        const list: ModPackage[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          this.modPackages.clear();
          for (const p of list) {
            if (p?.manifest?.id && p.manifest.id !== 'core') {
              this.modPackages.set(p.manifest.id, p);
            }
          }
          return;
        }
      }
    } catch (e) {
      console.warn('[ModManager] Error loading mods from storage', e);
    }

    // Seed with pre-configured default mods: Nature Mod & Test Mod
    const natureMod = ModPackageHelper.getNatureModSample();
    const testMod = ModPackageHelper.getTestModSample();
    this.modPackages.set(natureMod.manifest.id, natureMod);
    this.modPackages.set(testMod.manifest.id, testMod);
    this.savePackagesToStorage();
  }

  private savePackagesToStorage(): void {
    try {
      const list = Array.from(this.modPackages.values());
      localStorage.setItem(STORAGE_MODS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[ModManager] Failed to persist mod packages', e);
    }
  }

  public reloadAll(): void {
    const modsList = Array.from(this.modPackages.values());
    this.loader.loadModPackages(modsList, this.corePackage);
    this.notify();
  }

  // ==========================================
  // Subscriptions & Reactivity
  // ==========================================

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch (e) {
        console.error('[ModManager] Listener error', e);
      }
    }
  }

  // ==========================================
  // Selection & Querying
  // ==========================================

  getActivePackageId(): string {
    return this.activePackageId;
  }

  setActivePackageId(id: string): void {
    this.activePackageId = id;
    this.notify();
  }

  getCorePackage(): ModPackage {
    return this.corePackage;
  }

  getAllPackages(): ModPackage[] {
    return [this.corePackage, ...Array.from(this.modPackages.values())];
  }

  getModPackages(): ModPackage[] {
    return Array.from(this.modPackages.values());
  }

  getPackage(id: string): ModPackage | undefined {
    if (id === 'core') return this.corePackage;
    return this.modPackages.get(id);
  }

  getActivePackage(): ModPackage {
    return this.getPackage(this.activePackageId) || this.corePackage;
  }

  // ==========================================
  // Mod Package Operations (CRUD)
  // ==========================================

  /**
   * 3. CRIAR MOD
   */
  createMod(manifest: {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    dependencies?: Record<string, string>;
  }): { success: boolean; error?: string; pkg?: ModPackage } {
    const cleanId = manifest.id?.trim().toLowerCase();

    // Validation
    if (!cleanId) return { success: false, error: 'ID do Mod é obrigatório.' };
    if (cleanId === 'core') return { success: false, error: 'O ID "core" é reservado para o sistema.' };
    if (!/^[a-z0-9_]+$/.test(cleanId)) {
      return {
        success: false,
        error: 'O ID do Mod deve conter apenas letras minúsculas, números e sublinhados (_).',
      };
    }
    if (this.modPackages.has(cleanId)) {
      return { success: false, error: `Já existe um mod com o ID "${cleanId}".` };
    }
    if (!manifest.name?.trim()) {
      return { success: false, error: 'Nome do Mod é obrigatório.' };
    }
    if (!manifest.version || !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
      return { success: false, error: 'Versão deve seguir formato semver (ex: 1.0.0).' };
    }

    const newPkg: ModPackage = {
      manifest: {
        id: cleanId,
        name: manifest.name.trim(),
        version: manifest.version.trim(),
        author: manifest.author?.trim() || 'Desconhecido',
        description: manifest.description?.trim() || '',
        dependencies: manifest.dependencies || { core: '>=1.0.0' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      content: {
        blocks: [],
        items: [],
        entities: [],
        biomes: [],
        surfaces: [],
        components: [],
        recipes: [],
        tags: [],
        patches: [],
        assets: {},
      },
      isCore: false,
    };

    this.modPackages.set(cleanId, newPkg);
    this.savePackagesToStorage();
    this.setActivePackageId(cleanId);
    this.reloadAll();

    return { success: true, pkg: newPkg };
  }

  /**
   * 4. EDITAR MOD (General / mod.json)
   */
  updateModManifest(
    modId: string,
    updates: Partial<ModManifest>
  ): { success: boolean; error?: string } {
    const pkg = this.getPackage(modId);
    if (!pkg) return { success: false, error: 'Pacote não encontrado.' };

    if (pkg.isCore) {
      // Core metadata is strictly protected
      if (updates.id && updates.id !== 'core') {
        return { success: false, error: 'Não é permitido alterar o ID do Core.' };
      }
    }

    pkg.manifest = {
      ...pkg.manifest,
      ...updates,
      id: pkg.manifest.id, // ID remains immutable after creation
      updatedAt: Date.now(),
    };

    if (pkg.isCore) {
      this.saveCoreToStorage(this.corePackage);
    } else {
      this.savePackagesToStorage();
    }

    this.reloadAll();
    return { success: true };
  }

  /**
   * 5. DUPLICAR MOD
   */
  duplicateMod(sourceId: string, newId: string, newName?: string): { success: boolean; error?: string; pkg?: ModPackage } {
    const original = this.getPackage(sourceId);
    if (!original) return { success: false, error: 'Mod de origem não encontrado.' };

    const cleanId = newId.trim().toLowerCase();
    if (!cleanId) return { success: false, error: 'Novo ID é obrigatório.' };
    if (cleanId === 'core') return { success: false, error: 'O ID "core" é reservado.' };
    if (this.modPackages.has(cleanId)) {
      return { success: false, error: `Já existe um mod com o ID "${cleanId}".` };
    }

    const duplicated = ModPackageHelper.duplicatePackage(original, cleanId, newName);
    this.modPackages.set(cleanId, duplicated);
    this.savePackagesToStorage();
    this.setActivePackageId(cleanId);
    this.reloadAll();

    return { success: true, pkg: duplicated };
  }

  /**
   * 6. EXCLUIR MOD
   */
  deleteMod(modId: string): { success: boolean; error?: string } {
    if (modId === 'core') {
      return { success: false, error: 'O Core é o núcleo do jogo e está protegido contra exclusão.' };
    }
    if (!this.modPackages.has(modId)) {
      return { success: false, error: `Mod "${modId}" não encontrado.` };
    }

    this.modPackages.delete(modId);
    this.savePackagesToStorage();

    if (this.activePackageId === modId) {
      this.activePackageId = 'core';
    }

    this.reloadAll();
    return { success: true };
  }

  /**
   * 7. IMPORTAR MOD
   */
  importMod(input: string | ModPackage): { success: boolean; error?: string; report?: ModValidationReport } {
    try {
      const parsed: ModPackage = typeof input === 'string' ? JSON.parse(input) : input;
      if (!parsed?.manifest?.id) {
        return { success: false, error: 'Arquivo inválido: manifest.id não encontrado.' };
      }
      if (parsed.manifest.id === 'core') {
        return { success: false, error: 'Não é possível importar um pacote com o ID protegido "core".' };
      }

      // Validate package
      const report = ModValidator.validate(parsed, this.getAllPackages());
      if (!report.valid) {
        const firstErr = report.issues.find((i) => i.severity === 'error')?.message || 'Validação falhou';
        return { success: false, error: `Mod inválido: ${firstErr}`, report };
      }

      this.modPackages.set(parsed.manifest.id, parsed);
      this.savePackagesToStorage();
      this.setActivePackageId(parsed.manifest.id);
      this.reloadAll();

      return { success: true, report };
    } catch (e: any) {
      return { success: false, error: `Falha ao processar JSON: ${e.message}` };
    }
  }

  /**
   * 8. EXPORTAR MOD
   */
  exportMod(modId: string): string | null {
    const pkg = this.getPackage(modId);
    if (!pkg) return null;
    return JSON.stringify(pkg, null, 2);
  }

  // ==========================================
  // Content Items CRUD within Package
  // ==========================================

  saveBlock(pkgId: string, block: any): void {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return;

    const blocks = pkg.content.blocks || [];
    const index = blocks.findIndex((b: any) => b.id === block.id);
    if (index >= 0) {
      blocks[index] = block;
    } else {
      blocks.push(block);
    }
    pkg.content.blocks = blocks;
    this.persist(pkg);
    this.reloadAll();
  }

  deleteBlock(pkgId: string, blockId: string): boolean {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return false;
    if (pkg.isCore) {
      // Prevent deleting fundamental core blocks
      const critical = ['core:grass', 'core:dirt', 'core:stone', 'core:water'];
      if (critical.includes(blockId) || critical.includes(`core:${blockId}`)) {
        console.warn(`[ModManager] Block "${blockId}" is vital to the core world generator and cannot be deleted.`);
        return false;
      }
    }
    pkg.content.blocks = (pkg.content.blocks || []).filter((b: any) => b.id !== blockId);
    this.persist(pkg);
    this.reloadAll();
    return true;
  }

  saveItem(pkgId: string, item: any): void {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return;

    const items = pkg.content.items || [];
    const index = items.findIndex((i: any) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    pkg.content.items = items;
    this.persist(pkg);
    this.reloadAll();
  }

  deleteItem(pkgId: string, itemId: string): boolean {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return false;
    pkg.content.items = (pkg.content.items || []).filter((i: any) => i.id !== itemId);
    this.persist(pkg);
    this.reloadAll();
    return true;
  }

  saveEntity(pkgId: string, entity: any): void {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return;

    const entities = pkg.content.entities || [];
    const index = entities.findIndex((e: any) => e.id === entity.id);
    if (index >= 0) {
      entities[index] = entity;
    } else {
      entities.push(entity);
    }
    pkg.content.entities = entities;
    this.persist(pkg);
    this.reloadAll();
  }

  deleteEntity(pkgId: string, entityId: string): boolean {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return false;
    if (pkg.isCore && entityId === 'core:player') {
      return false; // Player entity is immutable
    }
    pkg.content.entities = (pkg.content.entities || []).filter((e: any) => e.id !== entityId);
    this.persist(pkg);
    this.reloadAll();
    return true;
  }

  saveBiome(pkgId: string, biome: any): void {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return;

    const biomes = pkg.content.biomes || [];
    const index = biomes.findIndex((b: any) => b.id === biome.id);
    if (index >= 0) {
      biomes[index] = biome;
    } else {
      biomes.push(biome);
    }
    pkg.content.biomes = biomes;
    this.persist(pkg);
    this.reloadAll();
  }

  deleteBiome(pkgId: string, biomeId: string): boolean {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return false;
    pkg.content.biomes = (pkg.content.biomes || []).filter((b: any) => b.id !== biomeId);
    this.persist(pkg);
    this.reloadAll();
    return true;
  }

  saveSurface(pkgId: string, surface: any): void {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return;

    const surfaces = pkg.content.surfaces || [];
    const index = surfaces.findIndex((s: any) => s.id === surface.id);
    if (index >= 0) {
      surfaces[index] = surface;
    } else {
      surfaces.push(surface);
    }
    pkg.content.surfaces = surfaces;
    this.persist(pkg);
    this.reloadAll();
  }

  savePatch(pkgId: string, patch: ModPatch): void {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return;

    const patches = pkg.content.patches || [];
    const index = patches.findIndex((p) => p.id === patch.id);
    if (index >= 0) {
      patches[index] = patch;
    } else {
      patches.push(patch);
    }
    pkg.content.patches = patches;
    this.persist(pkg);
    this.reloadAll();
  }

  deletePatch(pkgId: string, patchId: string): void {
    const pkg = this.getPackage(pkgId);
    if (!pkg) return;
    pkg.content.patches = (pkg.content.patches || []).filter((p) => p.id !== patchId);
    this.persist(pkg);
    this.reloadAll();
  }

  private persist(pkg: ModPackage): void {
    if (pkg.isCore) {
      this.saveCoreToStorage(this.corePackage);
    } else {
      this.savePackagesToStorage();
    }
  }

  // ==========================================
  // Validation
  // ==========================================

  validatePackage(pkgId: string): ModValidationReport {
    const pkg = this.getPackage(pkgId);
    if (!pkg) {
      return {
        valid: false,
        packageId: pkgId,
        packageName: 'Unknown',
        timestamp: Date.now(),
        checks: [],
        issues: [{ severity: 'error', category: 'general', message: 'Package not found' }],
      };
    }
    return ModValidator.validate(pkg, this.getAllPackages());
  }
}

export const globalModManager = new ModManager();
