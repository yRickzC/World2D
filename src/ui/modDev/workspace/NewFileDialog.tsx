import React, { useState } from 'react';
import { AlertCircle, Check, FilePlus, Sparkles, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { ModPackage } from '../../../mods';
import { globalContentTypeRegistry } from './ContentTypeRegistry';
import { ContentTypeDefinition } from './types';
import { ModFileSystem } from './ModFileSystem';

export interface NewFileDialogProps {
  pkg: ModPackage;
  targetFolder?: string;
  onClose: () => void;
  onFileCreated: (fileId: string) => void;
}

export const NewFileDialog: React.FC<NewFileDialogProps> = ({
  pkg,
  targetFolder,
  onClose,
  onFileCreated,
}) => {
  const contentTypes = globalContentTypeRegistry.getAll();

  // Find pre-selected type if targetFolder matches a defaultFolder
  const initialType =
    contentTypes.find((t) => t.defaultFolder === targetFolder)?.type || contentTypes[0]?.type || 'block';

  const [selectedTypeKey, setSelectedTypeKey] = useState<string>(initialType);
  const [name, setName] = useState<string>('');
  const [shortId, setShortId] = useState<string>('');
  const [autoSyncId, setAutoSyncId] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedType = globalContentTypeRegistry.get(selectedTypeKey) || contentTypes[0];

  const handleNameChange = (val: string) => {
    setName(val);
    if (autoSyncId) {
      const slug = val
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      setShortId(slug);
    }
  };

  const handleCreate = () => {
    setError(null);
    if (!name.trim()) {
      setError('Por favor, informe um nome para o arquivo.');
      return;
    }
    if (!shortId.trim()) {
      setError('Por favor, informe o identificador (ID).');
      return;
    }

    const folderToUse = targetFolder || selectedType.defaultFolder;
    const result = ModFileSystem.createFile(pkg, folderToUse, selectedType.type, name, shortId);

    if (!result.success) {
      setError(result.error || 'Falha ao criar arquivo.');
      return;
    }

    if (result.fileId) {
      onFileCreated(result.fileId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Header */}
        <div className="h-12 bg-zinc-850 border-b border-zinc-750 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilePlus className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold tracking-wide text-white uppercase">Novo Arquivo</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-750 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Step 1: Choose Content Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Selecione o Tipo de Conteúdo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map((t) => {
                const isSelected = t.type === selectedTypeKey;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => {
                      setSelectedTypeKey(t.type);
                      setError(null);
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                        : 'bg-zinc-850/60 border-zinc-750 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 select-none">{t.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{t.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Name & ID Form */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome de Exibição</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="ex: Bloco de Basalto"
                className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">ID / Namespace</label>
                <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncId}
                    onChange={(e) => setAutoSyncId(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Sincronizar com nome</span>
                </label>
              </div>

              <div className="flex items-center rounded-xl bg-zinc-850 border border-zinc-700 overflow-hidden px-3 py-1.5 focus-within:border-amber-400">
                <span className="text-xs font-mono text-zinc-500">{pkg.manifest.id}:</span>
                <input
                  type="text"
                  value={shortId}
                  onChange={(e) => {
                    setAutoSyncId(false);
                    setShortId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                  }}
                  placeholder="basalto"
                  className="flex-1 bg-transparent px-1 py-0.5 text-xs font-mono text-amber-400 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                Pasta de destino: <span className="text-zinc-400">{selectedType.defaultFolder}/</span>
                {shortId ? `${shortId}.json` : '<id>.json'}
              </p>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-zinc-850 border-t border-zinc-750 px-4 flex items-center justify-end gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            className="text-xs px-4"
          >
            Criar e Abrir
          </Button>
        </div>
      </div>
    </div>
  );
};
