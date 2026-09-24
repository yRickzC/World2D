/**
 * Mod Package and Mod System Types
 * Defines the contract for Mod Packages, Manifests, Registries and Validation.
 */

export interface ModDependency {
  id: string; // e.g. "core" or "nature_mod"
  version: string; // semver comparator like ">=1.0.0"
}

export interface ModManifest {
  id: string; // unique lowercase identifier: /^[a-z0-9_]+$/
  name: string;
  version: string; // semver: x.y.z
  author: string;
  description: string;
  dependencies: Record<string, string>; // { "core": ">=1.0.0" }
  createdAt?: number;
  updatedAt?: number;
  icon?: string;
}

export type PatchOperation = 'ADD' | 'EXTEND' | 'PATCH' | 'OVERRIDE';

export interface ModPatch {
  id: string;
  targetId: string; // e.g. "core:stone"
  operation: PatchOperation;
  targetType: 'block' | 'item' | 'entity' | 'biome' | 'surface';
  properties: Record<string, any>;
  description?: string;
}

export interface ModContent {
  blocks: any[];
  items: any[];
  entities: any[];
  biomes: any[];
  surfaces: any[];
  components: any[];
  recipes: any[];
  tags: string[];
  patches: ModPatch[];
  assets: Record<string, string>;
}

export interface ModPackage {
  manifest: ModManifest;
  content: ModContent;
  isCore?: boolean;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  category:
    | 'manifest'
    | 'id'
    | 'namespace'
    | 'json'
    | 'components'
    | 'references'
    | 'dependencies'
    | 'conflicts'
    | 'general';
  message: string;
  objectId?: string;
  field?: string;
  suggestion?: string;
}

export interface ModValidationReport {
  valid: boolean;
  packageId: string;
  packageName: string;
  timestamp: number;
  checks: {
    title: string;
    passed: boolean;
    details?: string;
  }[];
  issues: ValidationIssue[];
}

export interface RegisteredEntry<T = any> {
  id: string;
  name: string;
  namespace: string;
  packageId: string;
  isCore: boolean;
  data: T;
  sourceModVersion?: string;
  patchedBy?: string[];
}
