import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  FileCode,
  FolderTree,
  Plus,
  Save,
  Shield,
  X,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { globalModManager, ModPackage } from '../../../mods';
import { FileTree } from './FileTree';
import { EditorResolver } from './EditorResolver';
import { NewFileDialog } from './NewFileDialog';
import { ModFileSystem } from './ModFileSystem';
import { VirtualFileNode } from './types';

export interface ModWorkspaceProps {
  modId: string;
  onBackToModsList: () => void;
}

export const ModWorkspace: React.FC<ModWorkspaceProps> = ({ modId, onBackToModsList }) => {
  const [, setTick] = useState(0);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [newFileDialogTarget, setNewFileDialogTarget] = useState<string | null>(null);

  // Subscribe to ModManager changes
  useEffect(() => {
    const unsub = globalModManager.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const pkg = globalModManager.getPackage(modId) || globalModManager.getCorePackage();
  const isProtected = globalModManager.isProtectedMod(pkg);

  // Build tree
  const tree = useMemo(() => ModFileSystem.buildTree(pkg), [pkg]);

  // Initial selection: select first block or mod.json
  useEffect(() => {
    if (!selectedFileId || !tree.has(selectedFileId)) {
      const blocksFolder = tree.get('blocks');
      if (blocksFolder && blocksFolder.children && blocksFolder.children.length > 0) {
        setSelectedFileId(blocksFolder.children[0]);
      } else {
        setSelectedFileId('mod.json');
      }
    }
  }, [tree, selectedFileId]);

  const activeNode: VirtualFileNode | undefined = selectedFileId
    ? tree.get(selectedFileId)
    : undefined;

  const handleSaveFile = (fileId: string, updatedData: any) => {
    ModFileSystem.saveFile(pkg, fileId, updatedData);
    setTick((t) => t + 1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden">
      {/* Workspace Top Header */}
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToModsList}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="text-xs py-1.5 px-2.5 text-zinc-400 hover:text-white"
          >
            Mods
          </Button>

          <div className="h-4 w-px bg-zinc-750" />

          {/* Mod Info */}
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white tracking-tight">{pkg.manifest.name}</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <span className="text-zinc-600">/</span>
              <span className="text-amber-400">{pkg.manifest.id}</span>
              <span className="text-zinc-600">v{pkg.manifest.version}</span>
            </div>
            {isProtected && (
              <span className="ml-1 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                Core
              </span>
            )}
          </div>
        </div>

        {/* Action items on right */}
        <div className="flex items-center gap-2">
          {!isProtected && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setNewFileDialogTarget('blocks')}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs py-1"
            >
              Novo Arquivo
            </Button>
          )}

          <button
            type="button"
            onClick={onBackToModsList}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Fechar Workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: File & Folder Tree */}
        <div className="w-64 sm:w-72 border-r border-zinc-800 flex flex-col flex-shrink-0 bg-zinc-900/50">
          <FileTree
            pkg={pkg}
            selectedFileId={selectedFileId}
            onSelectFile={(id) => setSelectedFileId(id)}
            onOpenNewFileDialog={(folder) => setNewFileDialogTarget(folder || 'blocks')}
            onTreeUpdated={() => setTick((t) => t + 1)}
          />
        </div>

        {/* Right Side: Active File Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {activeNode && activeNode.type === 'file' ? (
            <EditorResolver node={activeNode} onSave={handleSaveFile} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs p-8 text-center space-y-2">
              <FolderTree className="w-10 h-10 stroke-[1.5] text-zinc-600 mb-2" />
              <p className="font-semibold text-zinc-400">Nenhum arquivo selecionado</p>
              <p className="max-w-xs text-zinc-500 text-[11px]">
                Selecione um arquivo de bloco, item ou manifesto na árvore à esquerda para abrir o editor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New File Creation Dialog */}
      {newFileDialogTarget !== null && (
        <NewFileDialog
          pkg={pkg}
          targetFolder={newFileDialogTarget}
          onClose={() => setNewFileDialogTarget(null)}
          onFileCreated={(newId) => {
            setSelectedFileId(newId);
            setTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
};
