import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Download,
  Upload,
  Play,
  Layers,
  FileJson,
  ShieldCheck,
  Cpu,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { CoreSystem } from '../../../core/CoreSystem';
import {
  ModGenerator,
  ModManager,
  globalModManager,
  ModPackage,
  ModValidationReport,
  LoadedMod,
} from '../../../gameplay/ModSystem';
import { BlockComponentRegistry } from '../../../gameplay/BlockSystem/components';

export const ModGeneratorView: React.FC = () => {
  // Current working Mod Package
  const [currentMod, setCurrentMod] = useState<ModPackage>(() =>
    ModGenerator.createCopperModExample()
  );

  const [activeSubTab, setActiveSubTab] = useState<'metadata' | 'definitions' | 'assets' | 'validation' | 'active_mods'>(
    'metadata'
  );

  const [validationReport, setValidationReport] = useState<ModValidationReport | null>(null);
  const [loadedMods, setLoadedMods] = useState<LoadedMod[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New definition inputs
  const [newBlockName, setNewBlockName] = useState('copper_block');
  const [newItemName, setNewItemName] = useState('copper_ingot');
  const [newAssetPath, setNewAssetPath] = useState('textures/copper_ingot.png');
  const [newAssetContent, setNewAssetContent] = useState('data:image/png;base64,placeholder');

  // Dependency inputs
  const [depModId, setDepModId] = useState('');
  const [depVersion, setDepVersion] = useState('0.0.1');

  // Refresh active loaded mods list
  const refreshLoadedMods = () => {
    setLoadedMods(globalModManager.getLoadedMods());
  };

  useEffect(() => {
    refreshLoadedMods();
    runValidation();
  }, []);

  const runValidation = (pkg: ModPackage = currentMod) => {
    const report = ModGenerator.validate(pkg);
    setValidationReport(report);
    return report;
  };

  const handleLoadExample = () => {
    const example = ModGenerator.createCopperModExample();
    setCurrentMod(example);
    runValidation(example);
    setActionFeedback({
      type: 'info',
      message: 'Exemplo oficial "@copper_mod" carregado com sucesso no gerador.',
    });
  };

  const handleUpdateManifest = (field: string, value: any) => {
    const updated: ModPackage = {
      ...currentMod,
      manifest: {
        ...currentMod.manifest,
        [field]: value,
      },
    };
    setCurrentMod(updated);
    runValidation(updated);
  };

  const handleAddDependency = () => {
    if (!depModId.trim()) return;
    const cleanId = depModId.replace(/^@/, '').trim();
    const updated: ModPackage = {
      ...currentMod,
      manifest: {
        ...currentMod.manifest,
        dependencias: [
          ...currentMod.manifest.dependencias,
          { mod_id: cleanId, version: depVersion || '>=0.0.1' },
        ],
      },
    };
    setCurrentMod(updated);
    setDepModId('');
    runValidation(updated);
  };

  const handleRemoveDependency = (index: number) => {
    const updatedDeps = [...currentMod.manifest.dependencias];
    updatedDeps.splice(index, 1);
    const updated: ModPackage = {
      ...currentMod,
      manifest: {
        ...currentMod.manifest,
        dependencias: updatedDeps,
      },
    };
    setCurrentMod(updated);
    runValidation(updated);
  };

  const handleAddBlock = () => {
    const cleanId = newBlockName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId) return;

    const blockJson = {
      id: `@${currentMod.manifest.mod_id}:${cleanId}`,
      name: cleanId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      category: 'building',
      tags: ['solid', 'mod_block'],
      components: [
        {
          id: 'solid',
          type: 'SolidComponent',
          data: { solid: true },
        },
        {
          id: 'emoji',
          type: 'EmojiIconComponent',
          data: { emoji: '🧱' },
        },
        {
          id: 'color',
          type: 'ColorTextureComponent',
          data: { primaryColor: '#d97745', secondaryColor: '#8c4120' },
        },
      ],
    };

    ModGenerator.addBlockDefinition(currentMod, blockJson);
    const updated = { ...currentMod };
    setCurrentMod(updated);
    setNewBlockName('');
    runValidation(updated);
  };

  const handleRemoveBlock = (blockId: string) => {
    const updated: ModPackage = {
      ...currentMod,
      definitions: {
        ...currentMod.definitions,
        blocks: (currentMod.definitions.blocks || []).filter((b) => b.id !== blockId),
      },
    };
    setCurrentMod(updated);
    runValidation(updated);
  };

  const handleAddItem = () => {
    const cleanId = newItemName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId) return;

    const itemJson = {
      id: `@${currentMod.manifest.mod_id}:${cleanId}`,
      nome: cleanId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      categoria: 'material',
      components: [
        {
          id: 'identity',
          type: 'IdentityComponent',
          data: {
            displayName: cleanId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            category: 'material',
            version: '1.0.0',
          },
        },
        {
          id: 'rarity',
          type: 'RarityComponent',
          data: { rarity: 'Comum' },
        },
        {
          id: 'stack',
          type: 'StackComponent',
          data: { maxStack: 64 },
        },
        {
          id: 'visual',
          type: 'VisualComponent',
          data: { icon: '🔶', color: '#d97745' },
        },
      ],
    };

    ModGenerator.addItemDefinition(currentMod, itemJson);
    const updated = { ...currentMod };
    setCurrentMod(updated);
    setNewItemName('');
    runValidation(updated);
  };

  const handleRemoveItem = (itemId: string) => {
    const updated: ModPackage = {
      ...currentMod,
      definitions: {
        ...currentMod.definitions,
        items: (currentMod.definitions.items || []).filter((i) => i.id !== itemId),
      },
    };
    setCurrentMod(updated);
    runValidation(updated);
  };

  const handleAddAsset = () => {
    if (!newAssetPath.trim()) return;
    const res = ModGenerator.addAsset(currentMod, newAssetPath.trim(), newAssetContent);
    if (res.success) {
      const updated = { ...currentMod };
      setCurrentMod(updated);
      setNewAssetPath('');
      runValidation(updated);
    }
  };

  const handleRemoveAsset = (assetPath: string) => {
    const newAssets = { ...currentMod.assets };
    delete newAssets[assetPath];
    const updated: ModPackage = {
      ...currentMod,
      assets: newAssets,
    };
    setCurrentMod(updated);
    runValidation(updated);
  };

  // Load into game atomically
  const handleLoadIntoGame = () => {
    const report = runValidation();
    if (!report.valid) {
      setActionFeedback({
        type: 'error',
        message: 'Mod não pode ser carregado: falhas na validação do Core detectadas.',
      });
      return;
    }

    const res = globalModManager.loadMod(currentMod);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: `Mod "@${currentMod.manifest.mod_id}" carregado com sucesso no jogo de forma atômica!`,
      });
      refreshLoadedMods();
    } else {
      setActionFeedback({
        type: 'error',
        message: `Erro ao carregar Mod: ${res.errors?.map((e) => e.reason).join('; ')}`,
      });
    }
  };

  // Uninstall mod and cleanup world blocks
  const handleUninstallMod = (modId: string) => {
    const res = globalModManager.uninstallMod(modId);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        message: `Mod "@${modId}" desinstalado. ${res.removedBlocksCount} blocos foram removidos do mundo sem substituição.`,
      });
      refreshLoadedMods();
    } else {
      setActionFeedback({
        type: 'error',
        message: `Erro ao desinstalar Mod: ${res.error}`,
      });
    }
  };

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportData = ModGenerator.export(currentMod);

  return (
    <div className="flex flex-col h-full gap-4 text-zinc-200">
      {/* Workflow Navigation / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Gerador de Mods — Base Components Arch
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Core v{CoreSystem.getVersion()}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Mods são 100% dados e assets. Sem código customizado. Componentes e UIs exclusivamente do Core.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadExample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Carregar Exemplo @copper_mod</span>
          </button>

          <button
            type="button"
            onClick={handleLoadIntoGame}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Carregar no Jogo</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : actionFeedback.type === 'error'
              ? 'bg-red-950/60 border-red-500/40 text-red-300'
              : 'bg-blue-950/60 border-blue-500/40 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {actionFeedback.type === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
            {actionFeedback.type === 'info' && <ShieldCheck className="w-4 h-4 text-blue-400" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-zinc-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Workflow Steps Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveSubTab('metadata')}
          className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
            activeSubTab === 'metadata'
              ? 'bg-zinc-800 border-amber-500 text-amber-300'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <span className="font-mono text-[9px] text-zinc-500">ETAPA 1-4</span>
          <span className="font-semibold text-zinc-200">Metadados & Dependências</span>
          <span className="text-[10px] text-zinc-400 truncate">@{currentMod.manifest.mod_id}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('definitions')}
          className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
            activeSubTab === 'definitions'
              ? 'bg-zinc-800 border-amber-500 text-amber-300'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <span className="font-mono text-[9px] text-zinc-500">ETAPA 5 & 7</span>
          <span className="font-semibold text-zinc-200">Definitions (Blocks & Items)</span>
          <span className="text-[10px] text-zinc-400">
            {currentMod.definitions.blocks?.length || 0} blocos, {currentMod.definitions.items?.length || 0} itens
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('assets')}
          className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
            activeSubTab === 'assets'
              ? 'bg-zinc-800 border-amber-500 text-amber-300'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <span className="font-mono text-[9px] text-zinc-500">ETAPA 6</span>
          <span className="font-semibold text-zinc-200">Assets (@mod_id/assets/)</span>
          <span className="text-[10px] text-zinc-400">{Object.keys(currentMod.assets || {}).length} assets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('validation')}
          className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
            activeSubTab === 'validation'
              ? 'bg-zinc-800 border-amber-500 text-amber-300'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <span className="font-mono text-[9px] text-zinc-500">ETAPA 8-10</span>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Validação & Exportação</span>
            {validationReport?.valid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            )}
          </div>
          <span className="text-[10px] text-zinc-400">
            {validationReport?.valid ? '100% Válido' : `${validationReport?.errors.length || 0} erros`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('active_mods')}
          className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
            activeSubTab === 'active_mods'
              ? 'bg-zinc-800 border-amber-500 text-amber-300'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <span className="font-mono text-[9px] text-zinc-500">GERENCIADOR</span>
          <span className="font-semibold text-zinc-200">Mods Ativos</span>
          <span className="text-[10px] text-zinc-400">{loadedMods.length} mods instalados</span>
        </button>
      </div>

      {/* Sub-Tab Content */}
      <div className="flex-1 overflow-y-auto bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
        {/* METADATA TAB */}
        {activeSubTab === 'metadata' && (
          <div className="space-y-5 max-w-3xl">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>1. Configuração do Mod</span>
                <span className="text-xs font-mono text-zinc-400 font-normal">
                  ({currentMod.manifest.mod_id}.json)
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Define os dados canônicos do mod. O mod_id ditará o namespace obrigatório de todo conteúdo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  mod_id (Namespace: @mod_id)
                </label>
                <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-700 overflow-hidden">
                  <span className="px-2.5 py-1.5 text-zinc-500 bg-zinc-800 font-mono">@</span>
                  <input
                    type="text"
                    value={currentMod.manifest.mod_id}
                    onChange={(e) => handleUpdateManifest('mod_id', e.target.value.toLowerCase())}
                    className="w-full px-3 py-1.5 bg-transparent text-white font-mono focus:outline-none"
                    placeholder="copper_mod"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Ex: copper_mod (Apenas letras minúsculas, números e underline)
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  value={currentMod.manifest.name || ''}
                  onChange={(e) => handleUpdateManifest('name', e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none"
                  placeholder="Copper Mod"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">mod_version</label>
                <input
                  type="text"
                  value={currentMod.manifest.mod_version}
                  onChange={(e) => handleUpdateManifest('mod_version', e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                  placeholder="0.0.1"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  core_version (Compatibilidade com o Core)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentMod.manifest.core_version}
                    onChange={(e) => handleUpdateManifest('core_version', e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                    placeholder="0.0.1"
                  />
                  <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400 whitespace-nowrap">
                    Core atual: {CoreSystem.getVersion()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1 text-xs">Descrição do Mod</label>
              <textarea
                rows={2}
                value={currentMod.manifest.description || ''}
                onChange={(e) => handleUpdateManifest('description', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none"
                placeholder="Descreva o propósito do Mod..."
              />
            </div>

            {/* Dependencies */}
            <div className="pt-2 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-white mb-1">Dependências de Mods</h4>
              <p className="text-[11px] text-zinc-400 mb-3">
                Declare outros mods necessários para este mod rodar. O Core valida ausência, versão e ciclos.
              </p>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="mod_id (ex: iron_mod)"
                  value={depModId}
                  onChange={(e) => setDepModId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="versão (ex: >=0.0.1)"
                  value={depVersion}
                  onChange={(e) => setDepVersion(e.target.value)}
                  className="w-32 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDependency}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {currentMod.manifest.dependencias.length === 0 ? (
                <div className="text-xs text-zinc-500 italic p-2 bg-zinc-900/40 rounded-lg border border-zinc-800/80">
                  Nenhuma dependência externa declarada (Mod autônomo).
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentMod.manifest.dependencias.map((dep, idx) => {
                    const norm =
                      typeof dep === 'string'
                        ? { mod_id: dep, version: '>=0.0.1' }
                        : dep;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400">@{norm.mod_id}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400">{norm.version}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDependency(idx)}
                          className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEFINITIONS TAB */}
        {activeSubTab === 'definitions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white">
                Definitions (Blocos e Itens com Componentes Core)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Todas as definições devem utilizar exclusivamente o namespace @{currentMod.manifest.mod_id}:object_id
                e os componentes registrados no Core.
              </p>
            </div>

            {/* Blocks Section */}
            <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Blocos do Mod ({currentMod.definitions.blocks?.length || 0})</span>
                </h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="object_id (ex: copper_pipe)"
                    className="px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Bloco</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(currentMod.definitions.blocks || []).map((block) => (
                  <div
                    key={block.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{block.id}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(block.id)}
                          className="text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-zinc-400 block">{block.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {block.components.map((comp) => (
                        <span
                          key={comp.id}
                          className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono border border-zinc-700"
                        >
                          {comp.type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Section */}
            <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>Itens do Mod ({currentMod.definitions.items?.length || 0})</span>
                </h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="object_id (ex: copper_wire)"
                    className="px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Item</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(currentMod.definitions.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{item.id}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-zinc-400 block">{item.nome}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.components.map((comp) => (
                        <span
                          key={comp.id}
                          className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono border border-zinc-700"
                        >
                          {comp.type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ASSETS TAB */}
        {activeSubTab === 'assets' && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <h3 className="text-sm font-bold text-white">Assets do Mod</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Todos os assets devem obrigatoriamente residir no namespace @{currentMod.manifest.mod_id}/assets/
                e não podem sobrescrever assets de outros mods ou do Core.
              </p>
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3 text-xs">
              <h4 className="font-semibold text-white">Adicionar Novo Asset</h4>
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-500 bg-zinc-800 px-2 py-1.5 rounded">
                  @{currentMod.manifest.mod_id}/assets/
                </span>
                <input
                  type="text"
                  value={newAssetPath}
                  onChange={(e) => setNewAssetPath(e.target.value)}
                  placeholder="blocks/copper_pipe.svg"
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAsset}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg cursor-pointer"
                >
                  Adicionar
                </button>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 text-[11px]">Conteúdo / SVG / Data URI:</label>
                <textarea
                  rows={3}
                  value={newAssetContent}
                  onChange={(e) => setNewAssetContent(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-[11px] text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-300">Assets Cadastrados</h4>
              {Object.keys(currentMod.assets || {}).length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Nenhum asset cadastrado no pacote.</p>
              ) : (
                Object.entries(currentMod.assets || {}).map(([path, content]) => (
                  <div
                    key={path}
                    className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="font-mono text-amber-400 truncate max-w-lg">{path}</div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(path)}
                      className="text-zinc-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VALIDATION & EXPORT TAB */}
        {activeSubTab === 'validation' && (
          <div className="space-y-5 max-w-4xl">
            {/* Live Validation Results */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Relatório de Validação do Core</h3>
                </div>
                <button
                  type="button"
                  onClick={() => runValidation()}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer"
                >
                  Revalidar
                </button>
              </div>

              {validationReport?.valid ? (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    O Mod está 100% em conformidade com as regras do Core! Todos os IDs, Schemas, Namespaces e
                    Assets foram validados com sucesso.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-semibold">
                      O Mod possui {validationReport?.errors.length} erro(s). Regra do Core: "Se qualquer
                      Block/Definition estiver inválido: Mod inteiro não carrega."
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {validationReport?.errors.map((err, i) => (
                      <div
                        key={i}
                        className="p-3 bg-zinc-950 border border-red-900/40 rounded-lg font-mono text-xs text-red-200 space-y-1"
                      >
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>Mod: <strong className="text-white">{err.mod_id}</strong></span>
                          <span>•</span>
                          <span>Object: <strong className="text-amber-400">{err.object_id}</strong></span>
                          {err.component && (
                            <>
                              <span>•</span>
                              <span>Component: <strong className="text-cyan-400">{err.component}</strong></span>
                            </>
                          )}
                        </div>
                        <p className="text-red-300 font-sans text-xs">{err.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manifest config */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white font-mono">{exportData.configFileName}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('config', exportData.configFileContent)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'config' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">Arquivo principal de configuração exigido na raiz do Mod.</p>
                <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-[10px] text-zinc-300 max-h-48 overflow-y-auto">
                  {exportData.configFileContent}
                </pre>
              </div>

              {/* Full Bundle */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white font-mono">{exportData.packageFileName}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('bundle', exportData.packageFileContent)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'bundle' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">Pacote completo com manifest, definitions e assets.</p>
                <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-[10px] text-zinc-300 max-h-48 overflow-y-auto">
                  {exportData.packageFileContent}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE MODS TAB */}
        {activeSubTab === 'active_mods' && (
          <div className="space-y-4 max-w-4xl">
            <div>
              <h3 className="text-sm font-bold text-white">Mods Instalados no Jogo</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Gerencie os mods atualmente ativos na memória do jogo. A desinstalação remove automaticamente todos
                os blocos do mundo pertencentes ao mod, sem substituição por blocos vazios ou placeholders.
              </p>
            </div>

            {loadedMods.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Nenhum mod carregado no momento. Use o botão "Carregar no Jogo" para testar o mod atual.
              </div>
            ) : (
              <div className="space-y-3">
                {loadedMods.map((mod) => (
                  <div
                    key={mod.manifest.mod_id}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">
                          @{mod.manifest.mod_id}
                        </span>
                        <span className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-mono text-zinc-400 border border-zinc-700">
                          v{mod.manifest.mod_version}
                        </span>
                        <span className="text-xs text-zinc-400">({mod.manifest.name || 'Sem nome'})</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{mod.manifest.description}</p>
                      <div className="flex items-center gap-4 text-[11px] text-zinc-500 mt-2 font-mono">
                        <span>Blocos: {mod.blockIds.length}</span>
                        <span>Itens: {mod.itemIds.length}</span>
                        <span>Assets: {Object.keys(mod.assets).length}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUninstallMod(mod.manifest.mod_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Desinstalar e Limpar Mundo</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
