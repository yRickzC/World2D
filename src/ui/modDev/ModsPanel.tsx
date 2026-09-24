import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Code2,
  FolderArchive,
  Layers,
  Plus,
  Shield,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '../components/Button';
import { globalModManager, ModPackage } from '../../mods';
import { ModWorkspace } from './workspace/ModWorkspace';

export interface ModsPanelProps {
  onClose: () => void;
}

export const ModsPanel: React.FC<ModsPanelProps> = ({ onClose }) => {
  const [, setTick] = useState(0);
  const [currentView, setCurrentView] = useState<'list' | 'import' | 'workspace'>('list');
  const [selectedModId, setSelectedModId] = useState<string>('core');

  // Deletion modal / confirm state
  const [modToDelete, setModToDelete] = useState<ModPackage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Import drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe to ModManager updates
  useEffect(() => {
    const unsub = globalModManager.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Synchronize selection
  const allPackages = globalModManager.getAllPackages();
  const selectedPackage =
    allPackages.find((p) => p.manifest.id === selectedModId) ||
    allPackages[0] ||
    globalModManager.getCorePackage();

  const isProtected = globalModManager.isProtectedMod(selectedPackage);

  // ==========================================
  // Mod Deletion
  // ==========================================
  const handleInitiateDelete = (pkg: ModPackage) => {
    setDeleteError(null);
    const check = globalModManager.canDeleteMod(pkg.manifest.id);
    if (!check.allowed) {
      setDeleteError(check.reason || 'Este mod não pode ser excluído.');
      return;
    }
    setModToDelete(pkg);
  };

  const handleConfirmDelete = () => {
    if (!modToDelete) return;
    const result = globalModManager.deleteMod(modToDelete.manifest.id);
    if (!result.success) {
      setDeleteError(result.error || 'Falha ao excluir mod.');
    } else {
      setModToDelete(null);
      setDeleteError(null);
      setSelectedModId('core');
    }
  };

  // ==========================================
  // ZIP File Processing & Import
  // ==========================================
  const handleProcessZipFile = async (file: File) => {
    setImportError(null);

    // Validate file type
    const isZip =
      file.name.toLowerCase().endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed';

    if (!isZip) {
      setImportError('Formato inválido: apenas arquivos com extensão .zip são aceitos.');
      return;
    }

    setIsImporting(true);

    try {
      const result = await globalModManager.importModFromZip(file);

      if (!result.success) {
        setImportError(result.error || 'Falha desconhecida ao validar/importar o arquivo ZIP.');
        setIsImporting(false);
        return;
      }

      // Success: return to list, select the new mod
      setIsImporting(false);
      setImportError(null);
      if (result.pkg) {
        setSelectedModId(result.pkg.manifest.id);
      }
      setCurrentView('list');
    } catch (err: any) {
      setIsImporting(false);
      setImportError(`Erro interno ao processar o arquivo ZIP: ${err.message}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessZipFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleProcessZipFile(file);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      {/* Main Desktop Window Frame */}
      <div className={`w-full ${currentView === 'workspace' ? 'max-w-6xl h-[90vh] max-h-[820px]' : 'max-w-4xl h-[560px]'} bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-sans transition-all duration-200`}>
        {currentView === 'workspace' ? (
          <ModWorkspace
            modId={selectedPackage.manifest.id}
            onBackToModsList={() => setCurrentView('list')}
          />
        ) : (
          <>
            {/* Window Titlebar */}
            <div className="h-12 bg-zinc-850 border-b border-zinc-750 px-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold tracking-wide text-white uppercase">Mods</h2>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                  Mod Dev Manager
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-750 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View 1: Main Mods List & Details */}
            {currentView === 'list' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Mods List */}
            <div className="w-72 sm:w-80 border-r border-zinc-750 bg-zinc-900/60 flex flex-col flex-shrink-0">
              {/* List Actions Toolbar */}
              <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setImportError(null);
                    setCurrentView('import');
                  }}
                  icon={<Upload className="w-3.5 h-3.5" />}
                  className="flex-1 text-xs py-1.5"
                >
                  Importar Mod
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  title="Criação de novos mods em desenvolvimento"
                  icon={<Plus className="w-3.5 h-3.5 opacity-50" />}
                  className="text-xs py-1.5 opacity-60 cursor-not-allowed"
                >
                  Novo Mod
                </Button>
              </div>

              {/* Scrollable Mods List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {allPackages.map((pkg) => {
                  const isSelected = pkg.manifest.id === selectedPackage.manifest.id;
                  const isPkgCore = globalModManager.isProtectedMod(pkg);

                  return (
                    <button
                      key={pkg.manifest.id}
                      type="button"
                      onDoubleClick={() => setCurrentView('workspace')}
                      onClick={() => {
                        setSelectedModId(pkg.manifest.id);
                        setDeleteError(null);
                        setModToDelete(null);
                      }}
                      title="Clique duplo para abrir no Workspace"
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-800 text-white font-bold border-amber-400/80 shadow-sm'
                          : 'bg-zinc-900/40 text-zinc-300 border-transparent hover:bg-zinc-800/50 hover:text-white'
                      }`}
                    >
                      <span className="truncate text-sm tracking-tight">{pkg.manifest.name}</span>
                      {isPkgCore && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/90 border border-amber-500/30 flex-shrink-0">
                          Core
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Total Count Status Footer */}
              <div className="p-2.5 border-t border-zinc-800 bg-zinc-950/40 text-[11px] text-zinc-400 text-center font-mono">
                {allPackages.length} {allPackages.length === 1 ? 'Mod carregado' : 'Mods carregados'}
              </div>
            </div>

            {/* Right Column: Mod Details */}
            <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto bg-zinc-950/30">
              <div className="space-y-6">
                {/* Header: Name and ID | Version */}
                <div className="border-b border-zinc-800 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        {selectedPackage.manifest.name}
                      </h1>
                      <div className="mt-1 flex items-center gap-2 text-xs font-mono text-zinc-400">
                        <span className="text-amber-400 font-semibold">{selectedPackage.manifest.id}</span>
                        <span className="text-zinc-600">|</span>
                        <span>{selectedPackage.manifest.version}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setCurrentView('workspace')}
                        icon={<Code2 className="w-3.5 h-3.5" />}
                        className="text-xs px-3.5 py-1.5 shadow font-semibold"
                      >
                        Abrir Workspace
                      </Button>

                      {isProtected && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Core Protegido</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dependencies Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Dependencies:
                  </h3>
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs font-mono">
                    {selectedPackage.manifest.dependencies &&
                    Object.keys(selectedPackage.manifest.dependencies).length > 0 ? (
                      <ul className="space-y-1.5">
                        {Object.entries(selectedPackage.manifest.dependencies).map(([depId, depVer]) => (
                          <li key={depId} className="text-zinc-200 flex items-center gap-2">
                            <span className="text-amber-400 font-bold">-</span>
                            <span>{depId}</span>
                            <span className="text-zinc-400">{depVer}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-zinc-500 italic font-sans text-xs">
                        Nenhuma dependência declarada.
                      </div>
                    )}
                  </div>
                </div>

                {/* Description Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Descrição
                  </h3>
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed min-h-[90px]">
                    {selectedPackage.manifest.description ? (
                      <p className="whitespace-pre-line">{selectedPackage.manifest.description}</p>
                    ) : (
                      <p className="text-zinc-500 italic">Sem descrição fornecida no manifesto mod.json.</p>
                    )}
                  </div>
                </div>

                {/* Inline Error Notice if deletion check failed */}
                {deleteError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                    <div>{deleteError}</div>
                  </div>
                )}
              </div>

              {/* Bottom Right: Delete Action Toolbar */}
              <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  {isProtected && (
                    <span className="text-[11px] text-zinc-500 italic">
                      Mods pertencentes ao Core não podem ser excluídos.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentView('workspace')}
                    icon={<Code2 className="w-3.5 h-3.5" />}
                    className="text-xs px-3.5 py-2 shadow-sm font-semibold"
                  >
                    Editar no Workspace
                  </Button>

                  {!isProtected ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleInitiateDelete(selectedPackage)}
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      className="text-xs px-4 py-2 shadow-sm"
                    >
                      Excluir Mod
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      title="Mods do Core não podem ser excluídos."
                      icon={<Trash2 className="w-3.5 h-3.5 opacity-40" />}
                      className="text-xs px-4 py-2 opacity-40 cursor-not-allowed"
                    >
                      Excluir Mod
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Import ZIP Drop Area */}
        {currentView === 'import' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-zinc-950/40">
            {/* Import Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImportError(null);
                  setCurrentView('list');
                }}
                icon={<ArrowLeft className="w-4 h-4" />}
                className="text-xs"
              >
                Voltar aos Mods
              </Button>

              <span className="text-xs font-mono text-zinc-400">Importação de Pacote (.zip)</span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-150 ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[0.995] shadow-inner'
                  : 'border-zinc-700 hover:border-amber-400/80 bg-zinc-900/40 hover:bg-zinc-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
                <FolderArchive className="w-8 h-8 stroke-[1.8]" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">Arraste o .zip do Mod</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Solte o arquivo compactado aqui ou clique para selecionar do computador.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  Aceita somente .zip
                </span>
                <span>•</span>
                <span>Contendo mod.json</span>
              </div>
            </div>

            {/* Error Message Box */}
            {importError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-200 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Falha ao importar o Mod:</span>
                </div>
                <div className="font-mono text-rose-200 pl-6 whitespace-pre-wrap">{importError}</div>
              </div>
            )}

            {/* Loading Indicator during Zip Processing */}
            {isImporting && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2 animate-pulse font-mono">
                <span>Validando arquivo e registrando dependências...</span>
              </div>
            )}
          </div>
        )}
      </>
    )}
  </div>

      {/* Confirmation Modal for Mod Deletion */}
      {modToDelete && (
        <div className="fixed inset-0 z-60 bg-zinc-950/70 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-750 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Mod?</h3>
                <p className="text-xs text-zinc-400">Esta ação removerá o pacote de mod do projeto.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
              <div className="text-zinc-200 font-bold">{modToDelete.manifest.name}</div>
              <div className="text-zinc-500">{modToDelete.manifest.id} (v{modToDelete.manifest.version})</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModToDelete(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                className="text-xs px-4"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
