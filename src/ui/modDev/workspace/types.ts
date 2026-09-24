/**
 * Mod Workspace Types
 * Defines data structures for the Virtual File System, Content Types, and Editor Providers.
 */

export type FileNodeType = 'file' | 'directory';

export interface VirtualFileNode {
  id: string; // Relative path, e.g. "blocks/stone.json" or "blocks"
  name: string; // e.g. "stone.json" or "blocks"
  type: FileNodeType;
  contentType?: string; // 'block' | 'item' | 'entity' | 'biome' | 'surface' | 'recipe' | 'tag' | 'manifest' | 'unknown'
  data?: any; // The underlying JSON payload for files
  parentId?: string; // e.g. "blocks" or null for root
  children?: string[]; // IDs of child nodes for directories
  isReadOnly?: boolean;
}

export interface ContentTypeDefinition<T = any> {
  type: string; // unique key, e.g. "block"
  label: string; // "Block"
  description: string;
  defaultFolder: string; // "blocks"
  icon: string; // emoji or icon identifier
  extension: string; // ".json"
  createDefaultData: (modId: string, name: string, shortId: string) => T;
  validateData?: (data: T) => { valid: boolean; error?: string };
}

export interface ClipboardState {
  operation: 'copy' | 'cut';
  nodeId: string;
  sourceModId: string;
}
