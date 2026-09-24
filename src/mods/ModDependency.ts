/**
 * Mod Dependency Management & Resolver
 * Validates semver strings, checks required dependencies, and orders mods for loading.
 */
import { ModManifest, ValidationIssue } from './types';

export class ModDependencyResolver {
  /**
   * Simple semver comparator to check if version meets a spec like ">=1.0.0", "1.0.0", "^1.0.0".
   */
  static satisfiesVersion(version: string, requirement: string): boolean {
    if (!requirement || requirement === '*' || requirement === 'any') return true;
    const reqClean = requirement.trim();
    const verClean = version.trim();

    // Direct match
    if (verClean === reqClean) return true;

    // Parse major, minor, patch
    const parseVer = (v: string): [number, number, number] => {
      const parts = v.replace(/[^0-9.]/g, '').split('.').map(Number);
      return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    };

    const [vMajor, vMinor, vPatch] = parseVer(verClean);

    if (reqClean.startsWith('>=')) {
      const [rMajor, rMinor, rPatch] = parseVer(reqClean.slice(2));
      if (vMajor > rMajor) return true;
      if (vMajor === rMajor && vMinor > rMinor) return true;
      return vMajor === rMajor && vMinor === rMinor && vPatch >= rPatch;
    }

    if (reqClean.startsWith('>')) {
      const [rMajor, rMinor, rPatch] = parseVer(reqClean.slice(1));
      if (vMajor > rMajor) return true;
      if (vMajor === rMajor && vMinor > rMinor) return true;
      return vMajor === rMajor && vMinor === rMinor && vPatch > rPatch;
    }

    if (reqClean.startsWith('^')) {
      const [rMajor, rMinor, rPatch] = parseVer(reqClean.slice(1));
      return vMajor === rMajor && (vMinor > rMinor || (vMinor === rMinor && vPatch >= rPatch));
    }

    return verClean === reqClean;
  }

  /**
   * Resolves dependencies of a list of mods and determines topological load order.
   */
  static resolveOrder(
    manifests: ModManifest[],
    coreManifest: ModManifest
  ): {
    loadOrder: string[];
    errors: ValidationIssue[];
  } {
    const errors: ValidationIssue[] = [];
    const available = new Map<string, ModManifest>();
    available.set('core', coreManifest);
    for (const m of manifests) {
      available.set(m.id, m);
    }

    // Check each mod's dependencies
    for (const m of manifests) {
      const deps = m.dependencies || {};
      for (const [depId, depVersion] of Object.entries(deps)) {
        const depMod = available.get(depId);
        if (!depMod) {
          errors.push({
            severity: 'error',
            category: 'dependencies',
            message: `Unknown dependency: ${depId} ${depVersion}`,
            objectId: m.id,
            field: `dependencies.${depId}`,
            suggestion: `Install or create mod "${depId}" with version ${depVersion}.`,
          });
        } else if (!this.satisfiesVersion(depMod.version, depVersion)) {
          errors.push({
            severity: 'error',
            category: 'dependencies',
            message: `Incompatible dependency: "${depId}" requires ${depVersion}, but installed is ${depMod.version}.`,
            objectId: m.id,
            field: `dependencies.${depId}`,
          });
        }
      }
    }

    // Topological Sort with cycle detection
    const visited = new Set<string>();
    const tempVisited = new Set<string>();
    const order: string[] = ['core'];

    const visit = (id: string, path: string[] = []) => {
      if (id === 'core') return;
      if (tempVisited.has(id)) {
        errors.push({
          severity: 'error',
          category: 'dependencies',
          message: `Circular dependency detected: ${path.join(' -> ')} -> ${id}`,
          objectId: id,
        });
        return;
      }
      if (visited.has(id)) return;

      tempVisited.add(id);
      path.push(id);

      const m = available.get(id);
      if (m?.dependencies) {
        for (const depId of Object.keys(m.dependencies)) {
          if (available.has(depId)) {
            visit(depId, [...path]);
          }
        }
      }

      tempVisited.delete(id);
      visited.add(id);
      order.push(id);
    };

    for (const m of manifests) {
      visit(m.id);
    }

    return {
      loadOrder: order,
      errors,
    };
  }

  /**
   * Returns all manifests that declare a dependency on targetModId.
   */
  static getDependents(targetModId: string, manifests: ModManifest[]): ModManifest[] {
    return manifests.filter((m) => {
      if (!m.dependencies) return false;
      return Object.prototype.hasOwnProperty.call(m.dependencies, targetModId);
    });
  }
}
