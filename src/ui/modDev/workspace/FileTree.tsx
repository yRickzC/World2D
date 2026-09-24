import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode,
  FilePlus,
  Folder,
  FolderOpen,
  FolderPlus,
  Scissors,
  Trash2,
  Edit2,
  Files,
  Clipboard,
} from 'lucide-react';
import { ModPackage } from '../../../mods';
import { VirtualFileNode } from './types';
import { ModFileSystem } from './ModFileSystem';

export interface FileTreeProps {
  pkg: ModPackage;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onOpenNewFileDialog: (targetFolder?: string) => void;
  onTreeUpdated: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: VirtualFileNode;
}

export const FileTree: React.FC<FileTreeProps> = ({
  pkg,
  selectedFileId,
  onSelectFile,
  onOpenNewFileDialog,
  onTreeUpdated,
}) => {
  const [tree, setTree] = useState<Map<string, VirtualFileNode>>(() => ModFileSystem.buildTree(pkg));
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(['blocks', 'items', 'entities', 'biomes', 'recipes', 'tags'])
  );

  // Rename state
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Drag and drop state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  useEffect(() => {
    setTree(ModFileSystem.buildTree(pkg));
  }, [pkg]);

  useEffect(() => {
    if (renamingNodeId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNodeId]);

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, node: VirtualFileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  // ==========================================
  // Context Menu Operations
  // ==========================================
  const handleStartRename = (node: VirtualFileNode) => {
    setContextMenu(null);
    setRenamingNodeId(node.id);
    setRenameInput(node.name);
  };

  const handleCommitRename = (nodeId: string) => {
    if (!renameInput.trim()) {
      setRenamingNodeId(null);
      return;
    }
    const result = ModFileSystem.renameNode(pkg, nodeId, renameInput);
    setRenamingNodeId(null);
    if (result.success) {
      onTreeUpdated();
      if (result.newFileId) onSelectFile(result.newFileId);
    }
  };

  const handleDelete = (node: VirtualFileNode) => {
    setContextMenu(null);
    if (window.confirm(`Deseja realmente excluir "${node.name}"?`)) {
      const result = ModFileSystem.deleteNode(pkg, node.id);
      if (result.success) {
        onTreeUpdated();
        if (selectedFileId === node.id) {
          onSelectFile('mod.json');
        }
      }
    }
  };

  const handleDuplicate = (node: VirtualFileNode) => {
    setContextMenu(null);
    const result = ModFileSystem.duplicateNode(pkg, node.id);
    if (result.success && result.newFileId) {
      onTreeUpdated();
      onSelectFile(result.newFileId);
    }
  };

  const handleCopy = (node: VirtualFileNode) => {
    setContextMenu(null);
    ModFileSystem.setClipboardCopy(pkg, node.id);
  };

  const handleCut = (node: VirtualFileNode) => {
    setContextMenu(null);
    ModFileSystem.setClipboardCut(pkg, node.id);
  };

  const handlePaste = (targetFolder: string) => {
    setContextMenu(null);
    const result = ModFileSystem.pasteClipboard(pkg, targetFolder);
    if (result.success && result.newFileId) {
      onTreeUpdated();
      onSelectFile(result.newFileId);
    }
  };

  // ==========================================
  // Drag and Drop
  // ==========================================
  const handleDragStart = (e: React.DragEvent, node: VirtualFileNode) => {
    e.dataTransfer.setData('text/plain', node.id);
    setDraggedNodeId(node.id);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (dropTargetFolderId !== folderId) setDropTargetFolderId(folderId);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDropTargetFolderId(null);
    if (draggedNodeId) {
      const result = ModFileSystem.moveNode(pkg, draggedNodeId, targetFolderId);
      if (result.success) {
        onTreeUpdated();
      }
      setDraggedNodeId(null);
    }
  };

  // Node Icons
  const getNodeIcon = (node: VirtualFileNode) => {
    if (node.type === 'directory') {
      const isExpanded = expandedFolders.has(node.id);
      return isExpanded ? (
        <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-amber-500/80 flex-shrink-0" />
      );
    }

    if (node.contentType === 'block') return <span className="text-sm">🧱</span>;
    if (node.contentType === 'item') return <span className="text-sm">🗡️</span>;
    if (node.contentType === 'entity') return <span className="text-sm">👾</span>;
    if (node.contentType === 'biome') return <span className="text-sm">🌲</span>;
    if (node.contentType === 'surface') return <span className="text-sm">🗺️</span>;
    if (node.contentType === 'recipe') return <span className="text-sm">🔨</span>;
    if (node.contentType === 'tag') return <span className="text-sm">🏷️</span>;
    return <FileCode className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />;
  };

  // Recursive directory renderer
  const renderNode = (nodeId: string, depth: number = 0) => {
    const node = tree.get(nodeId);
    if (!node) return null;

    const isSelected = selectedFileId === node.id;
    const isExpanded = expandedFolders.has(node.id);
    const isRenaming = renamingNodeId === node.id;
    const isDropTarget = dropTargetFolderId === node.id;

    if (node.type === 'directory') {
      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => toggleFolder(node.id)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            onDragOver={(e) => handleDragOver(e, node.id)}
            onDragLeave={() => setDropTargetFolderId(null)}
            onDrop={(e) => handleDrop(e, node.id)}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-colors group ${
              isDropTarget
                ? 'bg-amber-500/20 text-white font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <span className="text-zinc-500 group-hover:text-zinc-300">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
            {getNodeIcon(node)}
            <span className="font-semibold text-zinc-300 group-hover:text-white truncate">
              {node.name}
            </span>
          </div>

          {/* Directory Children */}
          {isExpanded && node.children && (
            <div>
              {node.children.map((childId) => renderNode(childId, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    return (
      <div
        key={node.id}
        draggable={!node.isReadOnly}
        onDragStart={(e) => handleDragStart(e, node)}
        onClick={() => onSelectFile(node.id)}
        onContextMenu={(e) => handleContextMenu(e, node)}
        style={{ paddingLeft: `${depth * 14 + 20}px` }}
        className={`flex items-center gap-2 py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition-all border ${
          isSelected
            ? 'bg-zinc-800 text-white font-semibold border-amber-400/80 shadow-sm'
            : 'border-transparent text-zinc-300 hover:bg-zinc-850 hover:text-white'
        }`}
      >
        {getNodeIcon(node)}

        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            onBlur={() => handleCommitRename(node.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitRename(node.id);
              if (e.key === 'Escape') setRenamingNodeId(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-zinc-950 px-1 py-0.5 text-xs text-white border border-amber-400 rounded focus:outline-none"
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </div>
    );
  };

  const rootNode = tree.get('root');

  return (
    <div
      onContextMenu={(e) => rootNode && handleContextMenu(e, rootNode)}
      className="flex-1 flex flex-col h-full bg-zinc-900/60 overflow-hidden"
    >
      {/* Top File Explorer Toolbar */}
      <div className="p-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <span className="font-bold uppercase tracking-wider text-[10px]">Arquivos</span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenNewFileDialog('blocks')}
            className="p-1 rounded hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors"
            title="Novo Arquivo"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const name = window.prompt('Nome da nova pasta:');
              if (name) {
                // Future folder creation hook
              }
            }}
            className="p-1 rounded hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors"
            title="Nova Pasta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Explorer Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {rootNode?.children?.map((childId) => renderNode(childId, 0))}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-60 w-44 bg-zinc-850 border border-zinc-700/80 rounded-xl shadow-2xl py-1 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* New File */}
          <button
            type="button"
            onClick={() => {
              const target = contextMenu.node.type === 'directory' ? contextMenu.node.id : contextMenu.node.parentId;
              setContextMenu(null);
              onOpenNewFileDialog(target);
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-750 hover:text-white cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo Arquivo</span>
          </button>

          {/* New Folder */}
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              window.prompt('Nome da nova pasta:');
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-750 hover:text-white cursor-pointer border-b border-zinc-750 pb-2 mb-1"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nova Pasta</span>
          </button>

          {/* Copy */}
          {contextMenu.node.type === 'file' && (
            <button
              type="button"
              onClick={() => handleCopy(contextMenu.node)}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-750 hover:text-white cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copiar</span>
            </button>
          )}

          {/* Cut */}
          {contextMenu.node.type === 'file' && !contextMenu.node.isReadOnly && (
            <button
              type="button"
              onClick={() => handleCut(contextMenu.node)}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-750 hover:text-white cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-zinc-400" />
              <span>Recortar</span>
            </button>
          )}

          {/* Paste */}
          <button
            type="button"
            onClick={() => {
              const target = contextMenu.node.type === 'directory' ? contextMenu.node.id : (contextMenu.node.parentId || 'root');
              handlePaste(target);
            }}
            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-750 hover:text-white cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5 text-zinc-400" />
            <span>Colar</span>
          </button>

          {/* Duplicate */}
          {contextMenu.node.type === 'file' && !contextMenu.node.isReadOnly && (
            <button
              type="button"
              onClick={() => handleDuplicate(contextMenu.node)}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-750 hover:text-white cursor-pointer"
            >
              <Files className="w-3.5 h-3.5 text-zinc-400" />
              <span>Duplicar</span>
            </button>
          )}

          {/* Rename */}
          {!contextMenu.node.isReadOnly && contextMenu.node.id !== 'mod.json' && (
            <button
              type="button"
              onClick={() => handleStartRename(contextMenu.node)}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-750 hover:text-white cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Renomear</span>
            </button>
          )}

          {/* Delete */}
          {!contextMenu.node.isReadOnly && contextMenu.node.id !== 'mod.json' && (
            <button
              type="button"
              onClick={() => handleDelete(contextMenu.node)}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer border-t border-zinc-750 pt-1.5 mt-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
