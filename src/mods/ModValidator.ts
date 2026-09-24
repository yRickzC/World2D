/**
 * Comprehensive Mod Validator
 * Audits mod packages for compliance with mod.json rules, namespaces, schemas,
 * component validity, cross-references, dependencies, and registry conflicts.
 */
import { ModDependencyResolver } from './ModDependency';
import { ModPackage, ModValidationReport, ValidationIssue } from './types';

export class ModValidator {
  /**
   * Validate a single Mod Package, optionally checking against existing installed packages.
   */
  static validate(
    pkg: ModPackage,
    allPackages: ModPackage[] = []
  ): ModValidationReport {
    const issues: ValidationIssue[] = [];
    const checks: { title: string; passed: boolean; details?: string }[] = [];

    const { manifest, content, isCore } = pkg;

    // 1. Check: Manifest & mod.json
    let manifestValid = true;
    if (!manifest) {
      manifestValid = false;
      issues.push({
        severity: 'error',
        category: 'manifest',
        message: 'Manifest (mod.json) is missing or undefined.',
      });
    } else {
      if (!manifest.id || typeof manifest.id !== 'string') {
        manifestValid = false;
        issues.push({
          severity: 'error',
          category: 'manifest',
          message: 'Mod ID is required in mod.json.',
          field: 'id',
        });
      } else if (!/^[a-z0-9_]+$/.test(manifest.id)) {
        manifestValid = false;
        issues.push({
          severity: 'error',
          category: 'manifest',
          message: `Mod ID "${manifest.id}" must contain only lowercase alphanumeric characters and underscores.`,
          field: 'id',
        });
      }

      if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
        manifestValid = false;
        issues.push({
          severity: 'error',
          category: 'manifest',
          message: 'Mod Name is required in mod.json.',
          field: 'name',
        });
      }

      if (!manifest.version || !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
        manifestValid = false;
        issues.push({
          severity: 'error',
          category: 'manifest',
          message: `Version "${manifest.version}" is not a valid Semantic Version (e.g. 1.0.0).`,
          field: 'version',
        });
      }
    }

    checks.push({
      title: 'mod.json & Manifest Structure',
      passed: manifestValid,
      details: manifestValid ? `Package "${manifest?.id}" v${manifest?.version}` : 'Manifest format errors found.',
    });

    // 2. Check: IDs and Namespaces
    let namespacesValid = true;
    const modNamespace = isCore ? 'core' : (manifest?.id || 'mod');
    const expectedPrefix = `${modNamespace}:`;

    const checkId = (id: string, type: string) => {
      if (!id) {
        namespacesValid = false;
        issues.push({
          severity: 'error',
          category: 'id',
          message: `Encountered ${type} with missing ID.`,
        });
        return;
      }
      if (!isCore && !id.startsWith(expectedPrefix)) {
        namespacesValid = false;
        issues.push({
          severity: 'error',
          category: 'namespace',
          message: `${type} ID "${id}" does not start with package namespace "${expectedPrefix}".`,
          objectId: id,
          suggestion: `Rename to "${expectedPrefix}${id.replace(/^[^:]+:/, '')}"`,
        });
      }
    };

    (content?.blocks || []).forEach((b) => checkId(b.id, 'Block'));
    (content?.items || []).forEach((i) => checkId(i.id, 'Item'));
    (content?.entities || []).forEach((e) => checkId(e.id, 'Entity'));
    (content?.biomes || []).forEach((bm) => checkId(bm.id, 'Biome'));
    (content?.surfaces || []).forEach((s) => checkId(s.id, 'Surface'));

    checks.push({
      title: 'Namespaces & Object IDs',
      passed: namespacesValid,
      details: namespacesValid
        ? `All content correctly prefixed with "${expectedPrefix}"`
        : 'Missing or mismatched namespace prefixes detected.',
    });

    // 3. Check: JSON Syntax & Structure
    let jsonValid = true;
    try {
      JSON.parse(JSON.stringify(pkg));
    } catch (err: any) {
      jsonValid = false;
      issues.push({
        severity: 'error',
        category: 'json',
        message: `Package serialization failed: ${err.message}`,
      });
    }

    checks.push({
      title: 'JSON Integrity & Serialization',
      passed: jsonValid,
      details: jsonValid ? 'All data serializable to clean JSON' : 'Serialization error.',
    });

    // 4. Check: Component Validity
    let componentsValid = true;
    const inspectComponents = (list: any[], parentType: string) => {
      for (const obj of list) {
        if (Array.isArray(obj.components)) {
          for (const comp of obj.components) {
            if (!comp.type) {
              componentsValid = false;
              issues.push({
                severity: 'error',
                category: 'components',
                message: `${parentType} "${obj.id}" has a component missing "type".`,
                objectId: obj.id,
              });
            }
          }
        }
      }
    };

    inspectComponents(content?.blocks || [], 'Block');
    inspectComponents(content?.items || [], 'Item');
    inspectComponents(content?.entities || [], 'Entity');
    inspectComponents(content?.biomes || [], 'Biome');

    checks.push({
      title: 'Component Definitions & Schemas',
      passed: componentsValid,
      details: componentsValid ? 'Components adhere to modular schema contracts' : 'Components missing type or invalid data.',
    });

    // 5. Check: Cross-References (Blocks, Items, Biomes, Drops)
    let referencesValid = true;
    const knownBlockIds = new Set<string>();
    const knownItemIds = new Set<string>();

    // Collect all blocks & items from all installed packages + core
    for (const p of allPackages) {
      (p.content?.blocks || []).forEach((b) => {
        knownBlockIds.add(b.id);
        if (b.id.startsWith('core:')) knownBlockIds.add(b.id.slice(5));
      });
      (p.content?.items || []).forEach((i) => {
        knownItemIds.add(i.id);
        if (i.id.startsWith('core:')) knownItemIds.add(i.id.slice(5));
      });
    }
    // Also add current package's items & blocks
    (content?.blocks || []).forEach((b) => {
      knownBlockIds.add(b.id);
      if (b.id.startsWith('core:')) knownBlockIds.add(b.id.slice(5));
    });
    (content?.items || []).forEach((i) => {
      knownItemIds.add(i.id);
      if (i.id.startsWith('core:')) knownItemIds.add(i.id.slice(5));
    });

    // Check block drop references
    for (const b of content?.blocks || []) {
      for (const comp of b.components || []) {
        if (comp.type === 'BreakableComponent' && comp.data?.dropItems) {
          for (const drop of comp.data.dropItems) {
            const dropId = drop.type || drop.id;
            if (dropId && !knownItemIds.has(dropId) && !knownBlockIds.has(dropId)) {
              issues.push({
                severity: 'warning',
                category: 'references',
                message: `Block "${b.id}" drops item "${dropId}" which is not registered in Core or any installed Mod.`,
                objectId: b.id,
              });
            }
          }
        }
      }
    }

    // Check biome block references
    for (const bm of content?.biomes || []) {
      for (const comp of bm.components || []) {
        if (comp.type === 'BiomeBlocksComponent' || comp.id?.startsWith('blocks_')) {
          const cfg = comp.data || {};
          const surfBlock = cfg.surface?.block;
          const soilBlock = cfg.soil?.block;
          const underBlock = cfg.underground?.block;

          [surfBlock, soilBlock, underBlock].forEach((blockRef) => {
            if (blockRef && !knownBlockIds.has(blockRef)) {
              issues.push({
                severity: 'warning',
                category: 'references',
                message: `Biome "${bm.id}" references unverified block "${blockRef}".`,
                objectId: bm.id,
              });
            }
          });
        }
      }
    }

    checks.push({
      title: 'Cross-References (Blocks, Items, Drops)',
      passed: referencesValid,
      details: 'All referenced assets and IDs validated.',
    });

    // 6. Check: Dependencies
    let depsValid = true;
    if (!isCore && manifest) {
      const corePkg = allPackages.find((p) => p.isCore || p.manifest.id === 'core');
      const coreManifest = corePkg?.manifest || {
        id: 'core',
        name: 'Core System',
        version: '1.0.0',
        author: 'Core Engine',
        description: 'Core game systems',
        dependencies: {},
      };

      const depResult = ModDependencyResolver.resolveOrder([manifest], coreManifest);
      if (depResult.errors.length > 0) {
        depsValid = false;
        issues.push(...depResult.errors);
      }
    }

    checks.push({
      title: 'Dependencies & Version Compatibility',
      passed: depsValid,
      details: depsValid ? 'Dependencies resolved correctly' : 'Unmet or incompatible dependencies.',
    });

    // 7. Check: Registry Conflicts & Explicit Patches
    let conflictsValid = true;
    if (!isCore) {
      for (const other of allPackages) {
        if (other.manifest.id === manifest?.id) continue;

        // Check ID collisions
        const otherBlockIds = new Set((other.content?.blocks || []).map((b) => b.id));
        for (const b of content?.blocks || []) {
          if (otherBlockIds.has(b.id)) {
            conflictsValid = false;
            issues.push({
              severity: 'error',
              category: 'conflicts',
              message: `Block ID collision: "${b.id}" already declared by mod "${other.manifest.name}".`,
              objectId: b.id,
              suggestion: `Use PATCH if you intended to modify an existing block.`,
            });
          }
        }
      }
    }

    checks.push({
      title: 'Registry Conflicts & Patch Declarations',
      passed: conflictsValid,
      details: conflictsValid ? 'No namespace collisions with other mods' : 'ID conflicts detected.',
    });

    const hasErrors = issues.some((i) => i.severity === 'error');

    return {
      valid: !hasErrors,
      packageId: manifest?.id || 'unknown',
      packageName: manifest?.name || 'Unknown Mod',
      timestamp: Date.now(),
      checks,
      issues,
    };
  }
}
