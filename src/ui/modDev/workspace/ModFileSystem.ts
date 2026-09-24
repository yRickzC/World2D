/**
 * Mod File System (Virtual File System)
 * Translates between a real ModPackage structure and a file explorer hierarchy.
 * All file operations (create, delete, rename, duplicate, move, paste) pass through this layer
 * and maintain synchronization with ModManager and runtime registries.
 */
import { globalModManager, ModPackage } from '../../../mods';
import { globalContentTypeRegistry } from './ContentTypeRegistry';
import { ClipboardState, VirtualFileNode } from './types';

export class ModFileSystem {
  private static clipboard: ClipboardState | null = null;

  /**
   * Builds the complete virtual file tree for a given mod package.
   */
  static buildTree(pkg: ModPackage): Map<string, VirtualFileNode> {
    const nodes = new Map<string, VirtualFileNode>();
    const isCore = globalModManager.isProtectedMod(pkg);

    // Root directory representing mod
    const rootId = 'root';
    nodes.set(rootId, {
      id: rootId,
      name: pkg.manifest.name,
      type: 'directory',
      children: [],
      isReadOnly: false,
    });

    const rootChildren: string[] = [];

    // Helper to add a folder and its files
    const addCategory = (
      folderName: string,
      contentType: string,
      items: any[],
      getId: (item: any) => string,
      getName?: (item: any) => string
    ) => {
      const folderId = folderName;
      const childFileIds: string[] = [];

      items.forEach((item, idx) => {
        const rawId = getId(item) || `item_${idx}`;
        const fileName = rawId.includes(':') ? rawId.split(':')[1] : rawId;
        const fileId = `${folderName}/${fileName}.json`;

        nodes.set(fileId, {
          id: fileId,
          name: `${fileName}.json`,
          type: 'file',
          contentType,
          data: item,
          parentId: folderId,
          isReadOnly: isCore,
        });
        childFileIds.push(fileId);
      });

      nodes.set(folderId, {
        id: folderId,
        name: folderName,
        type: 'directory',
        parentId: rootId,
        children: childFileIds,
        isReadOnly: isCore,
      });

      rootChildren.push(folderId);
    };

    // 1. blocks/
    addCategory('blocks', 'block', pkg.content.blocks || [], (b) => b.id, (b) => b.name);

    // 2. items/
    addCategory('items', 'item', pkg.content.items || [], (i) => i.id, (i) => i.nome || i.name);

    // 3. entities/
    addCategory('entities', 'entity', pkg.content.entities || [], (e) => e.id, (e) => e.name);

    // 4. biomes/
    addCategory('biomes', 'biome', pkg.content.biomes || [], (bm) => bm.id, (bm) => bm.name);

    // 5. surfaces/
    addCategory('surfaces', 'surface', pkg.content.surfaces || [], (s) => s.id, (s) => s.name);

    // 6. components/
    addCategory('components', 'component', pkg.content.components || [], (c) => c.type || c.id);

    // 7. recipes/
    addCategory('recipes', 'recipe', pkg.content.recipes || [], (r) => r.id, (r) => r.name);

    // 8. tags/
    const tagsArray = Array.isArray(pkg.content.tags)
      ? pkg.content.tags.map((t) => (typeof t === 'string' ? { name: t } : t))
      : [];
    addCategory('tags', 'tag', tagsArray, (t) => t.name || t.id);

    // 9. mod.json at root level
    const modJsonId = 'mod.json';
    nodes.set(modJsonId, {
      id: modJsonId,
      name: 'mod.json',
      type: 'file',
      contentType: 'manifest',
      data: pkg.manifest,
      parentId: rootId,
      isReadOnly: isCore,
    });
    rootChildren.push(modJsonId);

    // Update root children
    const rootNode = nodes.get(rootId)!;
    rootNode.children = rootChildren;

    return nodes;
  }

  /**
   * Saves updated file data back to the ModPackage.
   */
  static saveFile(
    pkg: ModPackage,
    fileId: string,
    newData: any
  ): { success: boolean; error?: string } {
    const parts = fileId.split('/');

    if (fileId === 'mod.json') {
      pkg.manifest = { ...pkg.manifest, ...newData };
      globalModManager.updateModManifest(pkg.manifest.id, pkg.manifest);
      return { success: true };
    }

    if (parts.length >= 2) {
      const folder = parts[0];
      const fileName = parts[1].replace(/\.json$/, '');

      const syncCollection = (collection: any[], matchFn: (item: any) => boolean) => {
        const index = collection.findIndex(matchFn);
        if (index >= 0) {
          collection[index] = newData;
        } else {
          collection.push(newData);
        }
      };

      const matchById = (item: any) => {
        const itemId = item.id || item.type || item.name;
        if (!itemId) return false;
        const cleanId = itemId.includes(':') ? itemId.split(':')[1] : itemId;
        return cleanId === fileName || itemId === fileName || item.id === newData.id;
      };

      if (folder === 'blocks') syncCollection(pkg.content.blocks, matchById);
      else if (folder === 'items') syncCollection(pkg.content.items, matchById);
      else if (folder === 'entities') syncCollection(pkg.content.entities, matchById);
      else if (folder === 'biomes') syncCollection(pkg.content.biomes, matchById);
      else if (folder === 'surfaces') syncCollection(pkg.content.surfaces, matchById);
      else if (folder === 'components') syncCollection(pkg.content.components, matchById);
      else if (folder === 'recipes') syncCollection(pkg.content.recipes, matchById);
      else if (folder === 'tags') {
        const tagItem = typeof newData === 'string' ? newData : newData.name || fileName;
        if (!pkg.content.tags.includes(tagItem)) {
          pkg.content.tags.push(tagItem);
        }
      }

      globalModManager.saveMod(pkg);
      return { success: true };
    }

    return { success: false, error: 'Caminho de arquivo inválido.' };
  }

  /**
   * Creates a new file under a given folder with specific content type.
   */
  static createFile(
    pkg: ModPackage,
    targetFolder: string,
    contentType: string,
    name: string,
    shortId: string
  ): { success: boolean; fileId?: string; error?: string; data?: any } {
    const typeDef = globalContentTypeRegistry.get(contentType);
    if (!typeDef) {
      return { success: false, error: `Tipo de conteúdo desconhecido: "${contentType}"` };
    }

    const cleanFolder = targetFolder === 'root' ? typeDef.defaultFolder : targetFolder;
    const cleanShortId = shortId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const fullId = `${pkg.manifest.id}:${cleanShortId}`;

    // Check for ID collision within the mod
    const collectionMap: Record<string, any[]> = {
      blocks: pkg.content.blocks,
      items: pkg.content.items,
      entities: pkg.content.entities,
      biomes: pkg.content.biomes,
      surfaces: pkg.content.surfaces,
      recipes: pkg.content.recipes,
    };

    const targetList = collectionMap[cleanFolder];
    if (targetList && targetList.some((item) => item.id === fullId)) {
      return { success: false, error: `ID "${fullId}" já existe nesta categoria do mod.` };
    }

    // Generate initial data
    const data = typeDef.createDefaultData(pkg.manifest.id, name, cleanShortId);

    // Add to collection
    if (targetList) {
      targetList.push(data);
    } else if (cleanFolder === 'tags') {
      pkg.content.tags.push(cleanShortId);
    } else if (cleanFolder === 'components') {
      pkg.content.components.push(data);
    }

    const fileId = `${cleanFolder}/${cleanShortId}.json`;
    globalModManager.saveMod(pkg);

    return { success: true, fileId, data };
  }

  /**
   * Deletes a file or directory from the mod package.
   */
  static deleteNode(pkg: ModPackage, nodeId: string): { success: boolean; error?: string } {
    if (nodeId === 'mod.json') {
      return { success: false, error: 'O arquivo mod.json é obrigatório e não pode ser excluído.' };
    }

    const parts = nodeId.split('/');
    if (parts.length === 1) {
      return { success: false, error: 'Pastas raiz do mod são gerenciadas pelo sistema.' };
    }

    const [folder, fileName] = parts;
    const shortName = fileName.replace(/\.json$/, '');

    const removeMatch = (list: any[]) => {
      const idx = list.findIndex((item) => {
        const id = item.id || item.type || item.name;
        if (!id) return false;
        const clean = id.includes(':') ? id.split(':')[1] : id;
        return clean === shortName || id === shortName;
      });
      if (idx >= 0) list.splice(idx, 1);
    };

    if (folder === 'blocks') removeMatch(pkg.content.blocks);
    else if (folder === 'items') removeMatch(pkg.content.items);
    else if (folder === 'entities') removeMatch(pkg.content.entities);
    else if (folder === 'biomes') removeMatch(pkg.content.biomes);
    else if (folder === 'surfaces') removeMatch(pkg.content.surfaces);
    else if (folder === 'components') removeMatch(pkg.content.components);
    else if (folder === 'recipes') removeMatch(pkg.content.recipes);
    else if (folder === 'tags') {
      pkg.content.tags = pkg.content.tags.filter((t) => t !== shortName);
    }

    globalModManager.saveMod(pkg);
    return { success: true };
  }

  /**
   * Renames a file or its internal identifier.
   */
  static renameNode(
    pkg: ModPackage,
    nodeId: string,
    newFileName: string
  ): { success: boolean; newFileId?: string; error?: string } {
    if (nodeId === 'mod.json') {
      return { success: false, error: 'Não é permitido renomear mod.json.' };
    }

    const parts = nodeId.split('/');
    if (parts.length < 2) {
      return { success: false, error: 'Apenas arquivos podem ser renomeados diretamente.' };
    }

    const [folder] = parts;
    const cleanName = newFileName.trim().replace(/\.json$/, '');
    const cleanId = cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newFileId = `${folder}/${cleanId}.json`;
    const newFullId = `${pkg.manifest.id}:${cleanId}`;

    const oldShortName = parts[1].replace(/\.json$/, '');

    const renameItem = (list: any[]) => {
      const item = list.find((i) => {
        const id = i.id || i.type || i.name;
        const clean = id?.includes(':') ? id.split(':')[1] : id;
        return clean === oldShortName || id === oldShortName;
      });
      if (item) {
        if (item.id) item.id = newFullId;
        if (item.name && typeof item.name === 'string') item.name = cleanName;
        if (item.nome && typeof item.nome === 'string') item.nome = cleanName;
      }
    };

    if (folder === 'blocks') renameItem(pkg.content.blocks);
    else if (folder === 'items') renameItem(pkg.content.items);
    else if (folder === 'entities') renameItem(pkg.content.entities);
    else if (folder === 'biomes') renameItem(pkg.content.biomes);
    else if (folder === 'surfaces') renameItem(pkg.content.surfaces);
    else if (folder === 'recipes') renameItem(pkg.content.recipes);
    else if (folder === 'tags') {
      const idx = pkg.content.tags.indexOf(oldShortName);
      if (idx >= 0) pkg.content.tags[idx] = cleanId;
    }

    globalModManager.saveMod(pkg);
    return { success: true, newFileId };
  }

  /**
   * Duplicates an existing file with a unique new ID.
   */
  static duplicateNode(
    pkg: ModPackage,
    nodeId: string
  ): { success: boolean; newFileId?: string; error?: string } {
    if (nodeId === 'mod.json') {
      return { success: false, error: 'Não é possível duplicar mod.json.' };
    }

    const parts = nodeId.split('/');
    if (parts.length < 2) return { success: false, error: 'Apenas arquivos podem ser duplicados.' };

    const [folder, fileName] = parts;
    const oldShort = fileName.replace(/\.json$/, '');
    const newShort = `${oldShort}_copy`;
    const newFullId = `${pkg.manifest.id}:${newShort}`;

    const duplicateItem = (list: any[]) => {
      const item = list.find((i) => {
        const id = i.id || i.type || i.name;
        const clean = id?.includes(':') ? id.split(':')[1] : id;
        return clean === oldShort || id === oldShort;
      });
      if (item) {
        const clone = JSON.parse(JSON.stringify(item));
        if (clone.id) clone.id = newFullId;
        if (clone.name) clone.name = `${clone.name} (Cópia)`;
        if (clone.nome) clone.nome = `${clone.nome} (Cópia)`;
        list.push(clone);
      }
    };

    if (folder === 'blocks') duplicateItem(pkg.content.blocks);
    else if (folder === 'items') duplicateItem(pkg.content.items);
    else if (folder === 'entities') duplicateItem(pkg.content.entities);
    else if (folder === 'biomes') duplicateItem(pkg.content.biomes);
    else if (folder === 'surfaces') duplicateItem(pkg.content.surfaces);
    else if (folder === 'recipes') duplicateItem(pkg.content.recipes);
    else if (folder === 'tags') pkg.content.tags.push(newShort);

    globalModManager.saveMod(pkg);
    return { success: true, newFileId: `${folder}/${newShort}.json` };
  }

  /**
   * Clipboard operations: Copy
   */
  static setClipboardCopy(pkg: ModPackage, nodeId: string): void {
    this.clipboard = {
      operation: 'copy',
      nodeId,
      sourceModId: pkg.manifest.id,
    };
  }

  /**
   * Clipboard operations: Cut
   */
  static setClipboardCut(pkg: ModPackage, nodeId: string): void {
    this.clipboard = {
      operation: 'cut',
      nodeId,
      sourceModId: pkg.manifest.id,
    };
  }

  /**
   * Clipboard operations: Paste into target folder
   */
  static pasteClipboard(
    pkg: ModPackage,
    targetFolder: string
  ): { success: boolean; newFileId?: string; error?: string } {
    if (!this.clipboard) {
      return { success: false, error: 'A área de transferência está vazia.' };
    }

    const { operation, nodeId } = this.clipboard;
    const parts = nodeId.split('/');
    if (parts.length < 2) return { success: false, error: 'Item na área de transferência inválido.' };

    const [, fileName] = parts;
    const baseName = fileName.replace(/\.json$/, '');
    const cleanFolder = targetFolder === 'root' ? parts[0] : targetFolder;
    const newShort = `${baseName}_pasted`;
    const newFullId = `${pkg.manifest.id}:${newShort}`;

    // Read node data
    const tree = this.buildTree(pkg);
    const sourceNode = tree.get(nodeId);
    if (!sourceNode || !sourceNode.data) {
      return { success: false, error: 'Dados da fonte não encontrados para colagem.' };
    }

    const cloneData = JSON.parse(JSON.stringify(sourceNode.data));
    if (cloneData.id) cloneData.id = newFullId;
    if (cloneData.name) cloneData.name = `${cloneData.name} (Copiado)`;

    const collectionMap: Record<string, any[]> = {
      blocks: pkg.content.blocks,
      items: pkg.content.items,
      entities: pkg.content.entities,
      biomes: pkg.content.biomes,
      surfaces: pkg.content.surfaces,
      recipes: pkg.content.recipes,
    };

    const targetList = collectionMap[cleanFolder];
    if (targetList) {
      targetList.push(cloneData);
    } else if (cleanFolder === 'tags') {
      pkg.content.tags.push(newShort);
    }

    // If it was cut, delete source
    if (operation === 'cut') {
      this.deleteNode(pkg, nodeId);
      this.clipboard = null;
    }

    globalModManager.saveMod(pkg);
    return { success: true, newFileId: `${cleanFolder}/${newShort}.json` };
  }

  /**
   * Move node via drag-and-drop or menu
   */
  static moveNode(
    pkg: ModPackage,
    sourceId: string,
    targetFolder: string
  ): { success: boolean; error?: string } {
    const parts = sourceId.split('/');
    if (parts.length < 2) return { success: false, error: 'Não é possível mover este nó.' };

    const sourceFolder = parts[0];
    if (sourceFolder === targetFolder) return { success: true }; // already there

    return {
      success: false,
      error: `Não é permitido mover arquivos da pasta "${sourceFolder}" para "${targetFolder}" pois tipos de dados diferem.`,
    };
  }
}
