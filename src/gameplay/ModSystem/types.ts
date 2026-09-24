import { BlockDefinitionJSON } from '../BlockSystem/types';
import { ItemDefinitionJSON } from '../ItemSystem/types';

export interface ModDependency {
  mod_id: string;
  version: string;
}

export interface ModManifest {
  mod_id: string;
  mod_version: string;
  core_version: string;
  dependencias: (string | ModDependency)[];
  name?: string;
  description?: string;
  author?: string;
  icon?: string;
}

export interface ModDefinitions {
  blocks?: BlockDefinitionJSON[];
  items?: ItemDefinitionJSON[];
  recipes?: any[];
}

export interface ModPackage {
  manifest: ModManifest;
  definitions: ModDefinitions;
  assets?: Record<string, string>; // assetPath -> content or dataUrl
}

export interface ModError {
  mod_id: string;
  object_id: string;
  component?: string;
  reason: string;
}

export interface ModValidationReport {
  valid: boolean;
  errors: ModError[];
  warnings: string[];
}

export interface LoadedMod {
  manifest: ModManifest;
  definitions: ModDefinitions;
  assets: Record<string, string>;
  loadedAt: number;
  blockIds: string[];
  itemIds: string[];
}
