import React, { useMemo, useState } from 'react';
import {
  Cloud,
  Compass,
  Copy,
  Download,
  FolderOpen,
  Globe,
  Layers,
  MapPin,
  Mountain,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { World, WorldJSON } from '../../../gameplay/mundo/World';
import { Surface } from '../../../gameplay/mundo/superficie/Surface';
import { globalWorldRegistry } from '../../../gameplay/mundo/WorldRegistry';
import { GroundComponent } from '../../../gameplay/mundo/biomas/componentes/GroundComponent';
import {
  DataPanel,
  EditorLayout,
  EditorTab,
  ExportActions,
  JsonPreview,
  PreviewPanel,
} from './shared';
import { WorldVisualPreview } from './WorldVisualPreview';
import { SurfaceGeneralTab } from './surface/SurfaceGeneralTab';
import { SurfaceBiomesTab } from './surface/SurfaceBiomesTab';
import { SurfaceGroundTab } from './surface/SurfaceGroundTab';
import { SurfaceClimateTab } from './surface/SurfaceClimateTab';
import { SurfaceGenerationTab } from './surface/SurfaceGenerationTab';
import { SurfaceRegionsTab } from './surface/SurfaceRegionsTab';

export interface WorldEditorProps {
  initialWorld?: World | WorldJSON | null;
  onBackToList?: () => void;
  onSaved?: (worldJSON: WorldJSON) => void;
}

type SurfaceSubTab = 'general' | 'biomes' | 'ground' | 'climate' | 'generation' | 'regions';

export const WorldEditor: React.FC<WorldEditorProps> = ({
  initialWorld,
  onBackToList,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('split');
  const [surfaceTab, setSurfaceTab] = useState<SurfaceSubTab>('biomes');

  // Load existing worlds for switcher dropdown
  const existingWorlds = useMemo(() => globalWorldRegistry.getAll(), []);
  const [selectedLoadId, setSelectedLoadId] = useState<string>(
    initialWorld?.id || existingWorlds[0]?.id || 'world_default_01'
  );

  // Active World instance
  const [world, setWorld] = useState<World>(() => {
    if (initialWorld instanceof World) return initialWorld.clone();
    if (initialWorld && 'id' in initialWorld) return World.fromJSON(initialWorld);
    const existing = globalWorldRegistry.get(selectedLoadId);
    if (existing) return existing.clone();
    return new World('world_custom_01', 'Meu Mundo Customizado', 124816);
  });

  // Active Surface
  const surfaces = world.getSurfaces();
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<string>(
    world.defaultSurfaceId || surfaces[0]?.id || 'surface_main'
  );

  const activeSurface = world.getSurface(selectedSurfaceId) || world.getDefaultSurface();

  // Selected biome for Biome Editor
  const [selectedBiomeId, setSelectedBiomeId] = useState<string>(
    activeSurface.getAllBiomes()[0]?.id || 'plains'
  );

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Re-render trigger
  const [, setTick] = useState<number>(0);
  const forceUpdate = () => setTick((t) => t + 1);

  // Surface management
  const handleAddSurface = () => {
    const newId = `surface_${Date.now().toString(36).slice(-4)}`;
    const newSurface = new Surface(
      newId,
      'Nova Superfície',
      Math.floor(Math.random() * 999999),
      ['custom'],
      [],
      [],
      'Superfície secundária do mundo'
    );
    world.addSurface(newSurface);
    setSelectedSurfaceId(newId);
    forceUpdate();
  };

  const handleDuplicateSurface = (surf: Surface) => {
    const dup = surf.clone();
    dup.id = `${surf.id}_copy_${Date.now().toString(36).slice(-3)}`;
    dup.name = `${surf.name} (Cópia)`;
    world.addSurface(dup);
    setSelectedSurfaceId(dup.id);
    forceUpdate();
  };

  const handleRemoveSurface = (id: string) => {
    if (world.getSurfaces().length <= 1) return;
    world.removeSurface(id);
    setSelectedSurfaceId(world.getDefaultSurface().id);
    forceUpdate();
  };

  // Switch World
  const handleSwitchWorld = (id: string) => {
    setSelectedLoadId(id);
    const found = globalWorldRegistry.get(id);
    if (found) {
      const cloned = found.clone();
      setWorld(cloned);
      setSelectedSurfaceId(cloned.defaultSurfaceId || cloned.getSurfaces()[0]?.id || 'surface_main');
      setSelectedBiomeId(cloned.getDefaultSurface().getAllBiomes()[0]?.id || 'plains');
      forceUpdate();
    }
  };

  // Reset World
  const handleResetWorld = () => {
    const found = globalWorldRegistry.get(world.id);
    if (found) {
      const cloned = found.clone();
      setWorld(cloned);
      setSelectedSurfaceId(cloned.defaultSurfaceId || cloned.getSurfaces()[0]?.id || 'surface_main');
      setSelectedBiomeId(cloned.getDefaultSurface().getAllBiomes()[0]?.id || 'plains');
      forceUpdate();
      setSaveMessage({ type: 'success', text: 'Mundo redefinido para versão original.' });
    }
  };

  // Save World
  const handleSave = () => {
    try {
      const json = world.toJSON();
      globalWorldRegistry.register(world.clone());
      if (onSaved) onSaved(json);
      setSaveMessage({ type: 'success', text: `Mundo "${world.name}" salvo com sucesso!` });
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `Erro ao salvar mundo: ${err.message}` });
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(world.toJSON(), null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${world.id}.world.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy JSON
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(world.toJSON(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedWorld = World.fromJSON(parsed);
        setWorld(importedWorld);
        setSelectedSurfaceId(importedWorld.defaultSurfaceId || importedWorld.getSurfaces()[0]?.id || 'surface_main');
        setSelectedBiomeId(importedWorld.getDefaultSurface().getAllBiomes()[0]?.id || 'plains');
        forceUpdate();
        setSaveMessage({ type: 'success', text: 'Mundo importado com sucesso!' });
      } catch (err: any) {
        setSaveMessage({ type: 'error', text: `Arquivo JSON inválido: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  // Surface Ground Component
  let surfaceGroundComp = activeSurface.getComponent<GroundComponent>('Ground');
  if (!surfaceGroundComp) {
    surfaceGroundComp = new GroundComponent();
    activeSurface.addComponent(surfaceGroundComp);
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Header Bar */}
      <header className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{world.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {world.id}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Arquitetura por Superfícies (Factorio-style) • {surfaces.length} Superfície(s) •{' '}
              {activeSurface.getAllBiomes().length} Bioma(s)
            </div>
          </div>
        </div>

        {/* Actions & World Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch existing world */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={world.id}
              onChange={(e) => handleSwitchWorld(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              {existingWorlds.map((w) => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                  {w.name} ({w.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetWorld}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Mundo</span>
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveMessage && (
        <div
          className={`px-4 py-2 text-xs font-medium flex items-center justify-between ${
            saveMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-b border-emerald-800'
              : 'bg-red-950/90 text-red-300 border-b border-red-800'
          }`}
        >
          <span>{saveMessage.text}</span>
          <button onClick={() => setSaveMessage(null)} className="p-0.5 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Surface Selector Tabs Bar */}
      <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            Superfícies:
          </span>

          {surfaces.map((s) => {
            const isSelected = activeSurface.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedSurfaceId(s.id);
                  setSelectedBiomeId(s.getAllBiomes()[0]?.id || 'plains');
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500 text-indigo-100 font-semibold shadow-xs'
                    : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({s.id})</span>

                {surfaces.length > 1 && (
                  <button
                    type="button"
                    title="Remover Superfície"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSurface(s.id);
                    }}
                    className="p-1 hover:text-red-400 text-slate-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddSurface}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Nova Superfície</span>
          </button>
        </div>

        {/* Surface Sub-Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setSurfaceTab('biomes')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              surfaceTab === 'biomes'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Biomas & Componentes
          </button>
          <button
            type="button"
            onClick={() => setSurfaceTab('ground')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              surfaceTab === 'ground'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chão (Ground)
          </button>
          <button
            type="button"
            onClick={() => setSurfaceTab('climate')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              surfaceTab === 'climate'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clima
          </button>
          <button
            type="button"
            onClick={() => setSurfaceTab('generation')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              surfaceTab === 'generation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Geração
          </button>
          <button
            type="button"
            onClick={() => setSurfaceTab('regions')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              surfaceTab === 'regions'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Regiões
          </button>
          <button
            type="button"
            onClick={() => setSurfaceTab('general')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              surfaceTab === 'general'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Geral
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 overflow-hidden">
        <EditorLayout
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          exportActions={<ExportActions onExport={handleExportJSON} onCopy={handleCopyJSON} />}
          dataPanel={
            <DataPanel title={`Configuração da Superfície: ${activeSurface.name}`}>
              {surfaceTab === 'general' && (
                <SurfaceGeneralTab surface={activeSurface} onChange={forceUpdate} />
              )}
              {surfaceTab === 'biomes' && (
                <SurfaceBiomesTab
                  surface={activeSurface}
                  selectedBiomeId={selectedBiomeId}
                  onSelectBiome={setSelectedBiomeId}
                  onChange={forceUpdate}
                />
              )}
              {surfaceTab === 'ground' && (
                <SurfaceGroundTab
                  groundComponent={surfaceGroundComp}
                  onChange={forceUpdate}
                />
              )}
              {surfaceTab === 'climate' && (
                <SurfaceClimateTab surface={activeSurface} onChange={forceUpdate} />
              )}
              {surfaceTab === 'generation' && (
                <SurfaceGenerationTab surface={activeSurface} onChange={forceUpdate} />
              )}
              {surfaceTab === 'regions' && (
                <SurfaceRegionsTab surface={activeSurface} onChange={forceUpdate} />
              )}
            </DataPanel>
          }
          previewPanel={
            <PreviewPanel
              title="Preview Visual do Terreno & Clima"
              jsonTitle="Definição do Mundo (JSON)"
              jsonPreview={
                <JsonPreview
                  data={world.toJSON()}
                  title={`Definição do Mundo (JSON)`}
                  actions={<ExportActions onExport={handleExportJSON} onCopy={handleCopyJSON} />}
                />
              }
            >
              <WorldVisualPreview
                world={world}
                activeSurfaceId={activeSurface.id}
                activeBiomeId={selectedBiomeId}
                onSelectSurface={(id) => {
                  setSelectedSurfaceId(id);
                  forceUpdate();
                }}
                onSelectBiome={(id) => {
                  setSelectedBiomeId(id);
                  forceUpdate();
                }}
              />
            </PreviewPanel>
          }
        />
      </div>
    </div>
  );
};
