import { CoreSystem } from '../../core/CoreSystem';
import { ModDependency, ModError, ModManifest } from './types';

export interface DependencyResolutionResult {
  valid: boolean;
  loadOrder: string[]; // mod_id in topological order
  errors: ModError[];
}

export class ModDependencyResolver {
  /**
   * Normalizes dependency representations (strings like "iron_mod@1.0.0" or objects).
   */
  static normalizeDependency(dep: string | ModDependency): ModDependency {
    if (typeof dep === 'string') {
      const parts = dep.split('@');
      return {
        mod_id: parts[0].trim(),
        version: parts[1]?.trim() || '>=0.0.1',
      };
    }
    return {
      mod_id: dep.mod_id.trim(),
      version: dep.version?.trim() || '>=0.0.1',
    };
  }

  /**
   * Resolves dependencies, checks for cycles and version conflicts, and calculates safe load order.
   *
   * @param manifests Map or list of mod manifests to be resolved
   * @param alreadyLoadedMods Map of already active mods in the system
   */
  static resolve(
    manifests: ModManifest[],
    alreadyLoadedMods: Map<string, ModManifest> = new Map()
  ): DependencyResolutionResult {
    const errors: ModError[] = [];
    const allManifests = new Map<string, ModManifest>();

    // Index all available mods
    for (const [id, m] of alreadyLoadedMods.entries()) {
      allManifests.set(id, m);
    }
    for (const m of manifests) {
      allManifests.set(m.mod_id, m);
    }

    // 1. Check for missing dependencies and version mismatches
    for (const manifest of manifests) {
      const deps = (manifest.dependencias || []).map((d) => this.normalizeDependency(d));

      for (const dep of deps) {
        const target = allManifests.get(dep.mod_id);

        if (!target) {
          errors.push({
            mod_id: manifest.mod_id,
            object_id: manifest.mod_id,
            reason: `Dependência inexistente: Mod "${manifest.mod_id}" exige "${dep.mod_id}" (${dep.version}), que não foi encontrado.`,
          });
          continue;
        }

        // Validate version constraint
        const targetVer = target.mod_version;
        const isCompatible = CoreSystem.isVersionCompatible(dep.version, targetVer);
        if (!isCompatible) {
          errors.push({
            mod_id: manifest.mod_id,
            object_id: manifest.mod_id,
            reason: `Dependência com versão incompatível: Mod "${manifest.mod_id}" exige "${dep.mod_id}" com versão "${dep.version}", mas a versão encontrada é "${targetVer}".`,
          });
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, loadOrder: [], errors };
    }

    // 2. Build Dependency Graph for cycle detection and topological sorting
    // Graph: mod_id -> set of dependencies (must load dependencies first)
    const graph = new Map<string, string[]>();
    for (const m of manifests) {
      const deps = (m.dependencias || [])
        .map((d) => this.normalizeDependency(d).mod_id)
        .filter((dId) => manifests.some((x) => x.mod_id === dId)); // only include among new to be ordered
      graph.set(m.mod_id, deps);
    }

    // 3. Cycle Detection via DFS (Recursion stack)
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const cyclePath: string[] = [];
    let hasCycle = false;

    const dfsDetectCycle = (node: string, path: string[]): boolean => {
      visited.add(node);
      inStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          if (dfsDetectCycle(n, path)) return true;
        } else if (inStack.has(n)) {
          // Cycle found!
          const cycleStart = path.indexOf(n);
          cyclePath.push(...path.slice(cycleStart), n);
          return true;
        }
      }

      inStack.delete(node);
      path.pop();
      return false;
    };

    for (const m of manifests) {
      if (!visited.has(m.mod_id)) {
        if (dfsDetectCycle(m.mod_id, [])) {
          hasCycle = true;
          break;
        }
      }
    }

    if (hasCycle) {
      const cycleDescription = cyclePath.join(' → ');
      errors.push({
        mod_id: cyclePath[0] || 'unknown',
        object_id: cyclePath[0] || 'unknown',
        reason: `Dependência circular detectada: ${cycleDescription}. Dependências circulares são estritamente proibidas.`,
      });
      return { valid: false, loadOrder: [], errors };
    }

    // 4. Topological Sort (Kahn's or post-order DFS)
    const loadOrder: string[] = [];
    const tempMark = new Set<string>();
    const permMark = new Set<string>();

    const visitTopo = (node: string) => {
      if (permMark.has(node)) return;
      if (tempMark.has(node)) return; // Already checked no cycle
      tempMark.add(node);

      const deps = graph.get(node) || [];
      for (const d of deps) {
        visitTopo(d);
      }

      tempMark.delete(node);
      permMark.add(node);
      loadOrder.push(node);
    };

    for (const m of manifests) {
      if (!permMark.has(m.mod_id)) {
        visitTopo(m.mod_id);
      }
    }

    return {
      valid: true,
      loadOrder,
      errors: [],
    };
  }
}
