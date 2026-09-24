import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileCode,
  FilePlus,
  FolderOpen,
  Plus,
  Save,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ItemDatabase } from '../../../gameplay/itens/ItemDatabase';
import {
  ItemSystem_db,
  ItemSystem_manager,
} from '../../../gameplay/ItemSystem/ItemManager';
import {
  ComponentSchemaDefinition,
  globalSchemaRegistry,
  ItemValidationReport,
  OFFICIAL_COMPONENT_SCHEMAS,
  VALID_ITEM_CATEGORIES_LIST,
} from '../../../gameplay/ItemSystem/schemas/SchemaRegistry';
import {
  ComponentSerializedData,
  ItemCategory,
  ItemDefinitionJSON,
} from '../../../gameplay/ItemSystem/types';
import { ItemDescriptionRenderer } from '../../itens/ItemDescriptionRenderer';
import { ItemVisualRenderer } from '../../itens/ItemVisualRenderer';
import { ComponentBlock } from './ComponentBlock';
import { createPreviewItemDef } from './previewHelper';
import { EditorLayout } from './shared/EditorLayout';
import { EditorTab } from './shared/TabNav';
import { ExportActions } from './shared/ExportActions';
import { JsonPreview } from './shared/JsonPreview';

export interface ItemEditorProps {
  initialItem?: ItemDefinitionJSON | null;
  onBackToList?: () => void;
  onSaved?: (item: ItemDefinitionJSON) => void;
}

export const ItemEditor: React.FC<ItemEditorProps> = ({
  initialItem,
  onBackToList,
  onSaved,
}) => {
  // Official schemas loaded from single source of truth
  const officialSchemas = useMemo(() => globalSchemaRegistry.getUserCreatableSchemas(), []);

  // Item Identity State (Root fields with explicit labels and descriptions)
  const [itemId, setItemId] = useState<string>(initialItem?.id || 'custom_sword');
  const [nome, setNome] = useState<string>(initialItem?.nome || 'Espada Celestial');
  const [categoria, setCategoria] = useState<ItemCategory>(
    (initialItem?.categoria as ItemCategory) || 'weapons'
  );
  const [activeTab, setActiveTab] = useState<EditorTab>('split');

  // Modular Components State
  // Starts with default identity, rarity, visual, and render components for pristine onboarding
  const [components, setComponents] = useState<ComponentSerializedData[]>(
    initialItem?.components || [
      {
        id: 'identity_01',
        type: 'IdentityComponent',
        data: {
          displayName: 'Espada Celestial',
          description: 'Lâmina forjada em metal estelar capaz de cortar o próprio tecido do espaço.',
          icon: 'sword_celestial',
        },
      },
      {
        id: 'rarity_01',
        type: 'RarityComponent',
        data: {
          rarity: 'Épico',
        },
      },
      {
        id: 'visual_01',
        type: 'VisualComponent',
        data: {
          visualType: 'Emoji',
          source: '⚔️',
          accentColor: '#38bdf8',
        },
      },
      {
        id: 'render_01',
        type: 'RenderComponent',
        data: {
          renderer: 'label_emoji',
          showLabel: true,
          scale: 1.0,
        },
      },
    ]
  );

  // Sync if initialItem changes
  useEffect(() => {
    if (initialItem) {
      setItemId(initialItem.id || '');
      setNome(initialItem.nome || '');
      setCategoria((initialItem.categoria as ItemCategory) || 'weapons');
      setComponents(initialItem.components || []);
    }
  }, [initialItem]);

  // Dropdown open/close state
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Copy feedback state
  const [copied, setCopied] = useState<boolean>(false);

  // Selected item from database to load
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');

  // Assemble runtime JSON object
  const currentItemJSON: ItemDefinitionJSON = useMemo(() => {
    return {
      id: itemId.trim(),
      nome: nome.trim(),
      categoria,
      components,
    };
  }, [itemId, nome, categoria, components]);

  // Real-time live validation via ItemSystem_manager (Single Source of Truth)
  const validationReport: ItemValidationReport = useMemo(() => {
    return ItemSystem_manager.validateItem(currentItemJSON);
  }, [currentItemJSON]);

  // Real-time preview definition
  const previewItemDef = useMemo(() => {
    return createPreviewItemDef(currentItemJSON);
  }, [currentItemJSON]);

  // Helper to generate next unique component ID
  const generateUniqueComponentId = (type: string): string => {
    let count = 1;
    let candidate = `${type.toLowerCase()}_0${count}`;
    const existingIds = new Set(components.map((c) => c.id));
    while (existingIds.has(candidate)) {
      count++;
      candidate = `${type.toLowerCase()}_${count < 10 ? '0' : ''}${count}`;
    }
    return candidate;
  };

  // Add component handler
  const handleAddComponent = (schemaDef: ComponentSchemaDefinition) => {
    const newId = generateUniqueComponentId(schemaDef.type);
    const defaultData = globalSchemaRegistry.generateDefaultData(schemaDef.type);

    setComponents((prev) => [
      ...prev,
      {
        id: newId,
        type: schemaDef.type,
        data: defaultData,
      },
    ]);
    setIsDropdownOpen(false);
  };

  // Duplicate component handler
  const handleDuplicateComponent = (index: number) => {
    const target = components[index];
    if (!target) return;

    const newId = generateUniqueComponentId(target.type);
    const duplicate: ComponentSerializedData = {
      id: newId,
      type: target.type,
      data: JSON.parse(JSON.stringify(target.data || {})),
    };

    setComponents((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicate);
      return copy;
    });
  };

  // Remove component handler
  const handleRemoveComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  // Update component handler
  const handleUpdateComponent = (index: number, updated: ComponentSerializedData) => {
    setComponents((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  // Reorder components (Up)
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setComponents((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Reorder components (Down)
  const handleMoveDown = (index: number) => {
    if (index >= components.length - 1) return;
    setComponents((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Clear / Create New Item
  const handleNewItem = () => {
    setItemId('novo_item');
    setNome('Novo Item');
    setCategoria('weapons');
    setComponents([
      {
        id: 'identity_01',
        type: 'IdentityComponent',
        data: {
          displayName: 'Novo Item',
          description: 'Descrição do item.',
          icon: 'item_icon',
        },
      },
      {
        id: 'rarity_01',
        type: 'RarityComponent',
        data: {
          rarity: 'Comum',
        },
      },
      {
        id: 'visual_01',
        type: 'VisualComponent',
        data: {
          visualType: 'Emoji',
          source: '⚔️',
          accentColor: '#38bdf8',
        },
      },
      {
        id: 'render_01',
        type: 'RenderComponent',
        data: {
          renderer: 'label_emoji',
          showLabel: true,
          scale: 1.0,
        },
      },
    ]);
  };

  // Load existing item from ItemSystem_db
  const handleLoadItem = (defId: string) => {
    if (!defId) return;
    const def = ItemSystem_db.get(defId);
    if (!def) return;

    const json = def.toJSON();
    setItemId(json.id);
    setNome(json.nome);
    setCategoria((json.categoria as ItemCategory) || 'weapons');
    setComponents(json.components || []);
  };

  // Copy JSON to clipboard
  const handleCopyJSON = () => {
    const formatted = JSON.stringify(currentItemJSON, null, 2);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download JSON file
  const handleDownloadJSON = () => {
    if (!validationReport.valid) {
      return;
    }

    const formatted = JSON.stringify(currentItemJSON, null, 2);
    const blob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentItemJSON.id || 'item'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pre-calculate which components can or cannot be added to respect single-instance and exclusivity rules
  const componentAvailability = useMemo(() => {
    const presentTypes = new Set(
      components.map((c) => {
        const schema = globalSchemaRegistry.getSchema(c.type);
        return schema ? schema.type : c.type;
      })
    );

    const hasLevel = presentTypes.has('LevelComponent');
    const hasStack = presentTypes.has('StackComponent');

    const result = new Map<string, { available: boolean; reason?: string }>();

    for (const schema of officialSchemas) {
      const alreadyPresent = presentTypes.has(schema.type);

      if (schema.isSingleton && alreadyPresent) {
        result.set(schema.type, {
          available: false,
          reason: 'Já adicionado (Instância única permitida)',
        });
      } else if (schema.type === 'StackComponent' && hasLevel) {
        result.set(schema.type, {
          available: true,
          reason: '⚠️ Incompatível com LevelComponent',
        });
      } else if (schema.type === 'LevelComponent' && hasStack) {
        result.set(schema.type, {
          available: true,
          reason: '⚠️ Incompatível com StackComponent',
        });
      } else {
        result.set(schema.type, {
          available: true,
        });
      }
    }

    return result;
  }, [components, officialSchemas]);

  // Save directly to ItemSystem_db
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSaveToSystem = () => {
    if (!validationReport.valid) {
      setSaveMessage({ type: 'error', text: 'Corrija os erros de validação antes de salvar.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    try {
      const def = ItemSystem_manager.buildDefinitionFromJSON(currentItemJSON, false);
      ItemSystem_db.register(def);
      try {
        ItemDatabase.register(createPreviewItemDef(currentItemJSON));
      } catch (_) {}
      setSaveMessage({ type: 'success', text: `Item "${currentItemJSON.nome}" salvo no sistema!` });
      setTimeout(() => setSaveMessage(null), 3500);
      onSaved?.(currentItemJSON);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: `Falha ao salvar: ${err.message}` });
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const loadSelector = (
    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg px-2 py-1">
      <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
      <select
        value={selectedLoadId}
        onChange={(e) => {
          setSelectedLoadId(e.target.value);
          handleLoadItem(e.target.value);
        }}
        className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer max-w-[160px] truncate"
      >
        <option value="" disabled>
          Carregar Item...
        </option>
        {ItemSystem_db.getAll().map((def) => (
          <option key={def.id} value={def.id}>
            {def.nome} ({def.id})
          </option>
        ))}
      </select>
    </div>
  );

  const exportActions = (
    <ExportActions
      onSaveToSystem={handleSaveToSystem}
      onDownloadJSON={handleDownloadJSON}
      onCopyJSON={handleCopyJSON}
      isValid={validationReport.valid}
      validationErrorCount={validationReport.errors.length}
      copied={copied}
      saveButtonLabel="Salvar no Sistema"
    />
  );

  const dataPanel = (
    <>
      {/* Root Identity Card with Explicit Field Labels & Descriptions */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Identidade Fundamental do Item (Raiz)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* ID do Item */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>
                ID do Item <span className="text-red-400">*</span>
              </span>
            </label>
            <input
              type="text"
              value={itemId}
              onChange={(e) => setItemId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="ex: celestial_sword"
              className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Identificador único interno em formato snake_case utilizado pelo sistema para registro e salvamento.
            </span>
          </div>

          {/* Nome Exibido */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>
                Nome Exibido <span className="text-red-400">*</span>
              </span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: Espada Celestial"
              className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Nome legível do item que será apresentado ao jogador na interface, inventário e notificações.
            </span>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>
                Categoria <span className="text-red-400">*</span>
              </span>
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ItemCategory)}
              className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
            >
              {VALID_ITEM_CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Define o grupo funcional do item dentro do inventário e mecânicas do jogo.
            </span>
          </div>
        </div>
      </div>

      {/* Component Selection Dropdown Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Adicionar Novo Componente
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Selecione um dos 16 componentes modulares oficiais do ItemSystem para anexar a este item.
            </p>
          </div>

          {/* Dropdown Control */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Component ▼</span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-2 z-50 max-h-96 overflow-y-auto divide-y divide-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Componentes Disponíveis ({officialSchemas.length})
                </div>

                <div className="py-1">
                  {officialSchemas.map((schema) => {
                    const status = componentAvailability.get(schema.type) || { available: true };
                    const isAvailable = status.available;

                    return (
                      <button
                        key={schema.type}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleAddComponent(schema)}
                        className={`w-full text-left px-3.5 py-2 text-xs flex flex-col gap-0.5 transition-colors ${
                          isAvailable
                            ? 'hover:bg-zinc-800/90 text-zinc-100 cursor-pointer'
                            : 'opacity-40 text-zinc-500 cursor-not-allowed bg-zinc-950/30'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{schema.name}</span>
                          {schema.isSingleton && (
                            <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                              1x
                            </span>
                          )}
                        </div>
                        {status.reason ? (
                          <span className={`text-[10px] ${isAvailable ? 'text-amber-400 font-medium' : 'text-zinc-500'}`}>
                            {status.reason}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 truncate">
                            {schema.description}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Report Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
          validationReport.valid
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/40 border-red-500/60 text-red-200'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          {validationReport.valid ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Configuração Válida: O item atende a todas as regras de integridade do ItemSystem.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Atenção: Existem {validationReport.errors.length} erro(s) de validação impeditivos:</span>
            </>
          )}
        </div>

        {validationReport.errors.map((err, i) => (
          <div key={i} className="pl-6 text-[11px] text-red-300 font-medium leading-tight">
            • {err}
          </div>
        ))}

        {validationReport.warnings.map((warn, i) => (
          <div key={i} className="pl-6 text-[11px] text-amber-300 flex items-center gap-1.5 leading-tight">
            <AlertTriangle className="w-3 h-3 inline text-amber-400 shrink-0" />
            <span>{warn}</span>
          </div>
        ))}
      </div>

      {/* Components Added List (Blocks) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300 px-1">
          <span>Components ({components.length}):</span>
          <span className="text-[10px] text-zinc-500 font-normal">
            Cada bloco é configurado e validado individualmente pelo ItemSystem
          </span>
        </div>

        {components.length === 0 ? (
          <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-xs">
            Nenhum componente adicionado. Utilize o menu &ldquo;Adicionar Component ▼&rdquo; acima para anexar comportamentos ao item.
          </div>
        ) : (
          components.map((comp, idx) => (
            <ComponentBlock
              key={comp.id || idx}
              component={comp}
              index={idx}
              total={components.length}
              allComponents={components}
              onUpdate={(updated) => handleUpdateComponent(idx, updated)}
              onRemove={() => handleRemoveComponent(idx)}
              onDuplicate={() => handleDuplicateComponent(idx)}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
            />
          ))
        )}
      </div>
    </>
  );

  const previewPanel = (
    <>
      {/* Runtime Live Visual Preview Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            <span>Preview em Tempo Real (Runtime)</span>
          </h3>
          <span className="text-[10px] text-zinc-400 font-mono">ItemVisualRenderer</span>
        </div>

        {/* Inventory Slot Simulation */}
        <div className="flex items-start gap-4 p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
          {/* Simulated Slot */}
          <div className="w-16 h-16 rounded-xl bg-zinc-900 border-2 border-amber-500/40 shadow-inner flex items-center justify-center shrink-0 relative overflow-hidden group">
            <ItemVisualRenderer itemDef={previewItemDef} size="xl" />
            {previewItemDef.maxStack > 1 && (
              <span className="absolute bottom-1 right-1.5 text-[10px] font-mono font-bold text-zinc-300 bg-zinc-950/80 px-1 rounded">
                x{previewItemDef.maxStack}
              </span>
            )}
          </div>

          {/* Tooltip Description Preview using exact runtime renderer */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate">{currentItemJSON.nome || 'Item'}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-semibold uppercase tracking-wider">
                {previewItemDef.categoryName}
              </span>
            </div>

            <div className="mt-1.5">
              <ItemDescriptionRenderer itemDef={previewItemDef} />
            </div>
          </div>
        </div>

        {/* Active Component Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {components.map((c) => (
            <span
              key={c.id}
              className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50"
            >
              {c.type}
            </span>
          ))}
        </div>
      </div>

      {/* JSON Preview Box */}
      <JsonPreview
        data={currentItemJSON}
        title={`JSON do Runtime (data/items/${currentItemJSON.id || 'item'}.json)`}
        filePath={`data/items/${currentItemJSON.id || 'item'}.json`}
        onDownload={handleDownloadJSON}
        canDownload={validationReport.valid}
      />
    </>
  );

  return (
    <EditorLayout
      title="Editor de Items"
      onBackToList={onBackToList}
      backButtonLabel="Lista de Items"
      onNew={handleNewItem}
      newButtonLabel="Novo Item"
      loadSelector={loadSelector}
      exportActions={exportActions}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      componentCount={components.length}
      hasErrors={!validationReport.valid}
      saveMessage={saveMessage}
      onDismissSaveMessage={() => setSaveMessage(null)}
      dataPanel={dataPanel}
      previewPanel={previewPanel}
    />
  );
};
