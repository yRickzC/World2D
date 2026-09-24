import { CoreSystem } from '../../core/CoreSystem';
import { BlockComponentRegistry } from '../BlockSystem/components';
import { BlockSchemaRegistry } from '../BlockSystem/schemas/BlockSchemaRegistry';
import { globalSchemaRegistry } from '../ItemSystem/schemas/SchemaRegistry';
import { ModDependencyResolver } from './ModDependencyResolver';
import { ModError, ModManifest, ModPackage, ModValidationReport } from './types';

export class ModValidator {
  /**
   * Performs full validation of a ModPackage before loading into the engine.
   *
   * Enforces:
   * 1. mod_id format
   * 2. mod_version & core_version compatibility (via CoreSystem)
   * 3. dependencies and circular dependency checks
   * 4. namespace consistency (@mod_id:object_id)
   * 5. definitions compliance with Core schemas (BlockSystem & ItemSystem)
   * 6. no unapproved / custom components (mods are data only)
   * 7. asset namespace enforcement (@mod_id/assets/...)
   * 8. references and cross-data integrity
   */
  static validate(
    pkg: ModPackage,
    alreadyLoadedMods: Map<string, ModManifest> = new Map()
  ): ModValidationReport {
    const errors: ModError[] = [];
    const warnings: string[] = [];

    const addError = (objectId: string, reason: string, component?: string) => {
      errors.push({
        mod_id: pkg.manifest?.mod_id || 'unknown_mod',
        object_id: objectId,
        component,
        reason,
      });
    };

    // 1. Validate Manifest presence
    if (!pkg || typeof pkg !== 'object' || !pkg.manifest) {
      return {
        valid: false,
        errors: [
          {
            mod_id: 'unknown_mod',
            object_id: 'manifest',
            reason: 'O pacote do Mod não contém um arquivo de manifesto ou objeto "manifest" válido.',
          },
        ],
        warnings: [],
      };
    }

    const { manifest, definitions, assets } = pkg;

    // 2. Validate mod_id
    if (!manifest.mod_id || typeof manifest.mod_id !== 'string') {
      addError('manifest.mod_id', 'O Mod deve definir um "mod_id" obrigatório.');
    } else {
      // Must be snake_case without @ prefix in manifest itself
      const rawModId = manifest.mod_id.startsWith('@')
        ? manifest.mod_id.substring(1)
        : manifest.mod_id;

      if (!/^[a-z0-9_]+$/.test(rawModId)) {
        addError(
          'manifest.mod_id',
          `"mod_id" inválido ("${manifest.mod_id}"). Deve conter apenas letras minúsculas, números e underline (snake_case).`
        );
      }
    }

    const normalizedModId = manifest.mod_id
      ? manifest.mod_id.startsWith('@')
        ? manifest.mod_id.substring(1)
        : manifest.mod_id
      : 'unknown_mod';

    // 3. Validate mod_version
    if (!manifest.mod_version || typeof manifest.mod_version !== 'string') {
      addError('manifest.mod_version', 'O Mod deve declarar uma versão válida ("mod_version").');
    } else if (!CoreSystem.parseVersion(manifest.mod_version)) {
      addError(
        'manifest.mod_version',
        `Versão de Mod inválida ("${manifest.mod_version}"). Deve seguir o padrão SemVer (ex: 0.0.1).`
      );
    }

    // 4. Validate core_version via CoreSystem
    if (!manifest.core_version || typeof manifest.core_version !== 'string') {
      addError('manifest.core_version', 'O Mod deve declarar a dependência da versão do Core ("core_version").');
    } else {
      const isCoreCompatible = CoreSystem.isVersionCompatible(manifest.core_version);
      if (!isCoreCompatible) {
        addError(
          'manifest.core_version',
          `Incompatibilidade com o Core: O Mod exige core_version "${manifest.core_version}", mas a versão do Core atual é "${CoreSystem.getVersion()}". O Mod não pode ser iniciado.`
        );
      }
    }

    // 5. Validate Dependencies
    if (manifest.dependencias && Array.isArray(manifest.dependencias)) {
      const depResult = ModDependencyResolver.resolve([manifest], alreadyLoadedMods);
      if (!depResult.valid) {
        errors.push(...depResult.errors);
      }
    }

    // Expected namespace prefixes
    const expectedIdPrefix = `@${normalizedModId}:`;
    const expectedAssetPrefix = `@${normalizedModId}/assets/`;

    // 6. Validate Assets
    if (assets && typeof assets === 'object') {
      for (const assetPath of Object.keys(assets)) {
        if (!assetPath.startsWith(expectedAssetPrefix)) {
          addError(
            assetPath,
            `Asset "${assetPath}" não respeita o namespace do Mod. Todos os assets do Mod devem obrigatoriamente iniciar com "${expectedAssetPrefix}". Assets não podem substituir assets pertencentes a outro namespace.`
          );
        }
      }
    }

    // 7. Validate Block Definitions
    const blocks = definitions?.blocks || [];
    const blockIds = new Set<string>();

    for (const block of blocks) {
      if (!block.id || typeof block.id !== 'string') {
        addError('unknown_block', 'Bloco sem "id" definido.');
        continue;
      }

      // Check namespace: @mod_id:object_id
      if (!block.id.startsWith(expectedIdPrefix)) {
        addError(
          block.id,
          `Namespace incorreto no bloco "${block.id}". IDs de Mods devem obrigatoriamente utilizar o padrão "${expectedIdPrefix}object_id". Não é permitido usar IDs do Core ou de outros Mods.`
        );
      }

      if (blockIds.has(block.id)) {
        addError(block.id, `ID de bloco duplicado "${block.id}" dentro do mesmo Mod.`);
      }
      blockIds.add(block.id);

      // Components checks: Mods CANNOT create or use unknown components
      const rawComponents = Array.isArray(block.components) ? block.components : [];
      for (const comp of rawComponents) {
        if (!comp.type || !BlockComponentRegistry.has(comp.type)) {
          addError(
            block.id,
            `Componente desconhecido ou não suportado no Core: "${comp.type}". Mods não podem criar componentes novos.`,
            comp.type
          );
        }

        // Check if component data references assets from another namespace
        if (comp.data && typeof comp.data === 'object') {
          for (const key of Object.keys(comp.data)) {
            const val = comp.data[key];
            if (typeof val === 'string' && (val.includes('/assets/') || /\.(svg|png|jpg|webp)$/i.test(val))) {
              if (!val.startsWith(expectedAssetPrefix)) {
                addError(
                  block.id,
                  `Referência a asset inválida "${val}" no campo "${key}". Deve utilizar o namespace do próprio mod ("${expectedAssetPrefix}").`,
                  comp.type
                );
              }
            }
          }
        }
      }

      // Full schema validation from BlockSchemaRegistry
      const blockReport = BlockSchemaRegistry.validateDefinition(block);
      if (!blockReport.valid) {
        for (const detail of blockReport.errorDetails) {
          addError(block.id, detail.reason, detail.component);
        }
      }
      warnings.push(...blockReport.warnings);
    }

    // 8. Validate Item Definitions
    const items = definitions?.items || [];
    const itemIds = new Set<string>();

    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        addError('unknown_item', 'Item sem "id" definido.');
        continue;
      }

      // Check namespace: @mod_id:object_id
      if (!item.id.startsWith(expectedIdPrefix)) {
        addError(
          item.id,
          `Namespace incorreto no item "${item.id}". IDs de Mods devem obrigatoriamente utilizar o padrão "${expectedIdPrefix}object_id". Não é permitido usar IDs do Core ou de outros Mods.`
        );
      }

      if (itemIds.has(item.id)) {
        addError(item.id, `ID de item duplicado "${item.id}" dentro do mesmo Mod.`);
      }
      itemIds.add(item.id);

      // Components checks: Mods CANNOT create or use unknown components
      const rawComponents = Array.isArray(item.components) ? item.components : [];
      for (const comp of rawComponents) {
        if (!comp.type || !globalSchemaRegistry.getSchema(comp.type)) {
          addError(
            item.id,
            `Componente de item desconhecido ou não suportado no Core: "${comp.type}". Mods não podem criar componentes novos.`,
            comp.type
          );
        }

        // Check if component data references assets from another namespace
        if (comp.data && typeof comp.data === 'object') {
          for (const key of Object.keys(comp.data)) {
            const val = comp.data[key];
            if (typeof val === 'string' && (val.includes('/assets/') || /\.(svg|png|jpg|webp)$/i.test(val))) {
              if (!val.startsWith(expectedAssetPrefix)) {
                addError(
                  item.id,
                  `Referência a asset inválida "${val}" no campo "${key}". Deve utilizar o namespace do próprio mod ("${expectedAssetPrefix}").`,
                  comp.type
                );
              }
            }
          }
        }
      }

      // Full schema validation from ItemSystem SchemaRegistry
      const itemReport = globalSchemaRegistry.validateItem(item);
      if (!itemReport.valid) {
        for (const errStr of itemReport.errors) {
          addError(item.id, errStr);
        }
      }
      warnings.push(...itemReport.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
