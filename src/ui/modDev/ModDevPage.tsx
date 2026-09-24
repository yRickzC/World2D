import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  Compass,
  Copy,
  Database,
  Download,
  FileCode,
  FolderOpen,
  GitFork,
  Hash,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Workflow,
  Wrench,
} from 'lucide-react';
import { Button } from '../components/Button';
import { CreateModModal } from './CreateModModal';
import { DuplicateModModal } from './DuplicateModModal';
import { DeleteModModal } from './DeleteModModal';
import { ImportModModal } from './ImportModModal';
import { ValidateModModal } from './ValidateModModal';
import { GeneralTab } from './GeneralTab';
import { ComponentsTab } from './ComponentsTab';
import { TagsTab } from './TagsTab';
import { RecipesTab } from './RecipesTab';
import { RegistriesTab } from './RegistriesTab';
import { ModPreviewTab } from './ModPreviewTab';
import { PackageContentList } from './PackageContentList';
import { BlockEditor } from '../dev/editor/BlockEditor';
import { ItemEditor } from '../dev/editor/ItemEditor';
import { EntityEditor } from '../dev/editor/EntityEditor';
import { WorldEditor } from '../dev/editor/WorldEditor';
import {
  globalModManager,
  ModPackage,
} from '../../mods';

export interface ModDevPageProps {
  onBackToMainMenu: () => void;
}

type ModDevTab =
  | 'general'
  | 'blocks'
  | 'items'
  | 'entities'
  | 'biomes'
  | 'surfaces'
  | 'components'
  | 'recipes'
  | 'tags'
  | 'registries'
  | 'preview';

export const ModDevPage: React.FC<ModDevPageProps> = ({ onBackToMainMenu }) => {
  const [, setTick] = useState(0);

  // Subscribe to ModManager changes
  useEffect(() => {
    const unsub = globalModManager.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const activePkgId = globalModManager.getActivePackageId();
  const activePkg = globalModManager.getActivePackage();
  const allMods = globalModManager.getModPackages();
  const corePkg = globalModManager.getCorePackage();

  const [activeTab, setActiveTab] = useState<ModDevTab>('general');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isValidateOpen, setIsValidateOpen] = useState(false);

  // Editors state
  const [editingBlock, setEditingBlock] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editingEntity, setEditingEntity] = useState<any | null>(null);
  const [editingSurface, setEditingSurface] = useState<any | null>(null);

  const isCore = activePkg.isCore || activePkg.manifest.id === 'core';

  // Export current mod package
  const handleExportMod = () => {
    const jsonStr = globalModManager.exportMod(activePkg.manifest.id);
    if (!jsonStr) return;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activePkg.manifest.id}_mod_package.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Content CRUD Handlers
  const handleNewBlock = () => {
    const prefix = isCore ? 'core:' : `${activePkg.manifest.id}:`;
    const defaultBlock = {
      id: `${prefix}new_block_${Date.now().toString().slice(-4)}`,
      name: 'Novo Bloco',
      category: 'natural',
      tags: ['building', 'solid'],
      components: [
        {
          id: 'emoji_icon',
          type: 'EmojiIconComponent',
          data: { emoji: '📦' },
        },
        {
          id: 'color_texture',
          type: 'ColorTextureComponent',
          data: {
            primaryColor: '#3b82f6',
            secondaryColor: '#1d4ed8',
            pattern: 'solid',
          },
        },
        {
          id: 'solid_comp',
          type: 'SolidComponent',
          data: { solid: true },
        },
      ],
    };
    setEditingBlock(defaultBlock);
  };

  const handleNewItem = () => {
    const prefix = isCore ? 'core:' : `${activePkg.manifest.id}:`;
    const defaultItem = {
      id: `${prefix}new_item_${Date.now().toString().slice(-4)}`,
      nome: 'Novo Item',
      categoria: 'material',
      descricao: 'Item criado através do Mod Dev Studio.',
      durabilidade: 100,
      durabilidadeMax: 100,
      raridade: 'comum',
      tags: ['material'],
      componentes: [
        {
          tipo: 'visual',
          dados: { icone: '📦', cor: '#3b82f6' },
        },
        {
          tipo: 'stack',
          dados: { maxStack: 64 },
        },
      ],
    };
    setEditingItem(defaultItem);
  };

  const handleNewEntity = () => {
    const prefix = isCore ? 'core:' : `${activePkg.manifest.id}:`;
    const defaultEntity = {
      id: `${prefix}new_entity_${Date.now().toString().slice(-4)}`,
      name: 'Nova Entidade',
      tags: ['living', 'passive'],
      components: [
        {
          id: 'name_comp',
          type: 'NameComponent',
          data: { name: 'Nova Entidade' },
        },
        {
          id: 'health_comp',
          type: 'HealthComponent',
          data: { maxHealth: 50, currentHealth: 50, invulnerable: false },
        },
        {
          id: 'style_comp',
          type: 'StyleComponent',
          data: { mode: 'emoji', value: '👾', size: 36, scale: 1.0 },
        },
        {
          id: 'movement_comp',
          type: 'MovementComponent',
          data: { speed: 3.0, canFly: false, canSwim: true },
        },
      ],
    };
    setEditingEntity(defaultEntity);
  };

  // If currently in a full sub-editor:
  if (editingBlock) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col">
        <BlockEditor
          initialBlock={editingBlock}
          onBackToList={() => setEditingBlock(null)}
          onSaved={(savedBlock) => {
            globalModManager.saveBlock(activePkg.manifest.id, savedBlock);
            setEditingBlock(null);
          }}
        />
      </div>
    );
  }

  if (editingItem) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col">
        <ItemEditor
          initialItem={editingItem}
          onBackToList={() => setEditingItem(null)}
          onSaved={(savedItem) => {
            globalModManager.saveItem(activePkg.manifest.id, savedItem);
            setEditingItem(null);
          }}
        />
      </div>
    );
  }

  if (editingEntity) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col">
        <EntityEditor
          initialEntity={editingEntity}
          onBackToList={() => setEditingEntity(null)}
          onSaved={(savedEntity) => {
            globalModManager.saveEntity(activePkg.manifest.id, savedEntity);
            setEditingEntity(null);
          }}
        />
      </div>
    );
  }

  if (editingSurface) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col">
        <WorldEditor
          initialWorld={editingSurface}
          onBackToList={() => setEditingSurface(null)}
          onSaved={(savedSurface) => {
            globalModManager.saveSurface(activePkg.manifest.id, savedSurface);
            setEditingSurface(null);
          }}
        />
      </div>
    );
  }

  const navTabs: { id: ModDevTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'general', label: 'General', icon: <FileCode className="w-4 h-4" /> },
    {
      id: 'blocks',
      label: 'Blocks',
      icon: <Layers className="w-4 h-4" />,
      count: activePkg.content.blocks?.length,
    },
    {
      id: 'items',
      label: 'Items',
      icon: <Package className="w-4 h-4" />,
      count: activePkg.content.items?.length,
    },
    {
      id: 'entities',
      label: 'Entities',
      icon: <Sparkles className="w-4 h-4" />,
      count: activePkg.content.entities?.length,
    },
    {
      id: 'biomes',
      label: 'Biomes',
      icon: <Workflow className="w-4 h-4" />,
      count: activePkg.content.biomes?.length,
    },
    {
      id: 'surfaces',
      label: 'Surfaces',
      icon: <Boxes className="w-4 h-4" />,
      count: activePkg.content.surfaces?.length,
    },
    { id: 'components', label: 'Components', icon: <Wrench className="w-4 h-4" /> },
    {
      id: 'recipes',
      label: 'Recipes',
      icon: <GitFork className="w-4 h-4" />,
      count: activePkg.content.recipes?.length,
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: <Hash className="w-4 h-4" />,
      count: activePkg.content.tags?.length,
    },
    { id: 'registries', label: 'Registries', icon: <Database className="w-4 h-4" /> },
    { id: 'preview', label: 'Preview', icon: <Compass className="w-4 h-4 text-amber-400" /> },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/90 backdrop-blur z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToMainMenu}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Menu Principal
          </Button>
          <div className="h-4 w-[1px] bg-zinc-700" />
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            <h1 className="text-sm font-bold text-white tracking-wide">MOD DEV STUDIO</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              v2.0 Mod Packages
            </span>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('preview')}
            icon={<Compass className="w-3.5 h-3.5 text-amber-400" />}
          >
            Preview World
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsValidateOpen(true)}
            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          >
            VALIDATE MOD
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportMod}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Mod
          </Button>
        </div>
      </header>

      {/* Main Studio Body: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Packages & Tabs */}
        <aside className="w-72 border-r border-zinc-800 bg-zinc-900/60 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
          <div className="p-3 space-y-5">
            {/* SECTION 1: PACKAGES SELECTOR */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Mod Packages
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {allMods.length + 1} pacotes
                </span>
              </div>

              {/* CORE PACKAGE ITEM */}
              <button
                type="button"
                onClick={() => {
                  globalModManager.setActivePackageId('core');
                  setActiveTab('general');
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all mb-2 cursor-pointer ${
                  activePkgId === 'core'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-xs text-white truncate">Core System</div>
                    <span className="text-[10px] font-mono text-amber-400/90 block">core:</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CORE
                </span>
              </button>

              {/* USER / SAMPLE MODS LIST */}
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {allMods.map((mod) => {
                  const isSelected = activePkgId === mod.manifest.id;
                  return (
                    <button
                      key={mod.manifest.id}
                      type="button"
                      onClick={() => {
                        globalModManager.setActivePackageId(mod.manifest.id);
                        setActiveTab('general');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Boxes className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-xs text-zinc-100 truncate block">
                            {mod.manifest.name}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500 truncate block">
                            {mod.manifest.id}:
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                        v{mod.manifest.version}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Package Actions Bar */}
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="w-full text-[11px]"
                >
                  Criar Mod
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsImportOpen(true)}
                  icon={<Upload className="w-3.5 h-3.5" />}
                  className="w-full text-[11px]"
                >
                  Importar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDuplicateOpen(true)}
                  icon={<Copy className="w-3.5 h-3.5" />}
                  className="w-full text-[11px]"
                >
                  Duplicar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isCore}
                  onClick={() => setIsDeleteOpen(true)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="w-full text-[11px]"
                >
                  Excluir
                </Button>
              </div>
            </div>

            {/* SECTION 2: SELECTED PACKAGE CONTENT NAVIGATION */}
            <div>
              <div className="px-2 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Conteúdo: {activePkg.manifest.name}
                </span>
                <span className="text-[9px] font-mono text-amber-400">{activePkg.manifest.id}:</span>
              </div>

              <div className="space-y-0.5">
                {navTabs.map((tab) => {
                  const isCurrent = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {tab.icon}
                        <span>{tab.label}</span>
                      </div>
                      {typeof tab.count === 'number' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Info Status */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 text-[11px] text-zinc-400 flex items-center justify-between">
            <span className="truncate">Namespace: <strong className="text-zinc-200 font-mono">{activePkg.manifest.id}:*</strong></span>
            <button
              type="button"
              onClick={() => setIsValidateOpen(true)}
              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Validar
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-950/80">
          {activeTab === 'general' && <GeneralTab pkg={activePkg} />}

          {activeTab === 'blocks' && (
            <PackageContentList
              pkg={activePkg}
              type="block"
              onEdit={(block) => setEditingBlock(block)}
              onCreateNew={handleNewBlock}
              onDuplicate={(block) => {
                const newId = `${block.id}_copy`;
                const clone = { ...block, id: newId, name: `${block.name} (Copy)` };
                globalModManager.saveBlock(activePkg.manifest.id, clone);
              }}
              onDelete={(blockId) => {
                globalModManager.deleteBlock(activePkg.manifest.id, blockId);
              }}
            />
          )}

          {activeTab === 'items' && (
            <PackageContentList
              pkg={activePkg}
              type="item"
              onEdit={(item) => setEditingItem(item)}
              onCreateNew={handleNewItem}
              onDuplicate={(item) => {
                const newId = `${item.id}_copy`;
                const clone = { ...item, id: newId, nome: `${item.nome || item.name} (Copy)` };
                globalModManager.saveItem(activePkg.manifest.id, clone);
              }}
              onDelete={(itemId) => {
                globalModManager.deleteItem(activePkg.manifest.id, itemId);
              }}
            />
          )}

          {activeTab === 'entities' && (
            <PackageContentList
              pkg={activePkg}
              type="entity"
              onEdit={(entity) => setEditingEntity(entity)}
              onCreateNew={handleNewEntity}
              onDuplicate={(entity) => {
                const newId = `${entity.id}_copy`;
                const clone = { ...entity, id: newId, name: `${entity.name} (Copy)` };
                globalModManager.saveEntity(activePkg.manifest.id, clone);
              }}
              onDelete={(entityId) => {
                globalModManager.deleteEntity(activePkg.manifest.id, entityId);
              }}
            />
          )}

          {activeTab === 'biomes' && (
            <PackageContentList
              pkg={activePkg}
              type="biome"
              onEdit={(biome) => {
                // Open surface/world editor or biome preview
                setActiveTab('preview');
              }}
              onCreateNew={() => {
                const prefix = isCore ? 'core:' : `${activePkg.manifest.id}:`;
                const newBiome = {
                  id: `${prefix}biome_${Date.now().toString().slice(-4)}`,
                  name: 'Novo Bioma',
                  category: 'temperate',
                  color: '#10b981',
                  tags: ['biome', 'nature'],
                  components: [
                    {
                      id: 'blocks',
                      type: 'BiomeBlocksComponent',
                      data: {
                        surface: { block: 'core:grass', depth: 1 },
                        soil: { block: 'core:dirt', depth: 3 },
                        underground: { block: 'core:stone' },
                      },
                    },
                  ],
                };
                globalModManager.saveBiome(activePkg.manifest.id, newBiome);
              }}
              onDuplicate={(biome) => {
                const newId = `${biome.id}_copy`;
                const clone = { ...biome, id: newId, name: `${biome.name} (Copy)` };
                globalModManager.saveBiome(activePkg.manifest.id, clone);
              }}
              onDelete={(biomeId) => {
                globalModManager.deleteBiome(activePkg.manifest.id, biomeId);
              }}
            />
          )}

          {activeTab === 'surfaces' && (
            <PackageContentList
              pkg={activePkg}
              type="surface"
              onEdit={(surface) => setEditingSurface(surface)}
              onCreateNew={() => {
                const prefix = isCore ? 'core:' : `${activePkg.manifest.id}:`;
                const newSurface = {
                  id: `${prefix}surface_${Date.now().toString().slice(-4)}`,
                  name: 'Nova Superfície',
                  seed: 12345,
                  surfaces: [],
                };
                setEditingSurface(newSurface);
              }}
              onDuplicate={(surface) => {
                const newId = `${surface.id}_copy`;
                const clone = { ...surface, id: newId, name: `${surface.name} (Copy)` };
                globalModManager.saveSurface(activePkg.manifest.id, clone);
              }}
              onDelete={(surfaceId) => {
                // Not deleted if default
              }}
            />
          )}

          {activeTab === 'components' && <ComponentsTab pkg={activePkg} />}

          {activeTab === 'recipes' && <RecipesTab pkg={activePkg} />}

          {activeTab === 'tags' && <TagsTab pkg={activePkg} />}

          {activeTab === 'registries' && <RegistriesTab />}

          {activeTab === 'preview' && <ModPreviewTab pkg={activePkg} />}
        </main>
      </div>

      {/* Modals */}
      <CreateModModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newModId) => {
          globalModManager.setActivePackageId(newModId);
          setActiveTab('general');
        }}
      />

      <DuplicateModModal
        isOpen={isDuplicateOpen}
        onClose={() => setIsDuplicateOpen(false)}
        sourcePackage={activePkg}
        onDuplicated={(newModId) => {
          globalModManager.setActivePackageId(newModId);
          setActiveTab('general');
        }}
      />

      <DeleteModModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        modPackage={activePkg}
        onDeleted={() => {
          globalModManager.setActivePackageId('core');
          setActiveTab('general');
        }}
      />

      <ImportModModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={(newModId) => {
          globalModManager.setActivePackageId(newModId);
          setActiveTab('general');
        }}
      />

      <ValidateModModal
        isOpen={isValidateOpen}
        onClose={() => setIsValidateOpen(false)}
        modPackage={activePkg}
      />
    </div>
  );
};
