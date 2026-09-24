import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  Layers,
  Plus,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { BlockDefinition } from '../../../gameplay/BlockSystem/BlockDefinition';
import { BlockSystem_db } from '../../../gameplay/BlockSystem/BlockDB';
import { globalBlockManager } from '../../../gameplay/BlockSystem/BlockManager';
import { BlockDatabase } from '../../../gameplay/blocos/BlockDatabase';
import {
  BlockCategory,
  BlockComponentSerializedData,
  BlockDefinitionJSON,
  BlockValidationReport,
} from '../../../gameplay/BlockSystem/types';
import { BlockSchemaRegistry } from '../../../gameplay/BlockSystem/schemas/BlockSchemaRegistry';
import { EditorLayout } from './shared/EditorLayout';
import { EditorTab } from './shared/TabNav';
import { ComponentSelector, GenericComponentSchema } from './shared/ComponentSelector';
import { ComponentEditor } from './shared/ComponentEditor';
import { JsonPreview } from './shared/JsonPreview';
import { ExportActions } from './shared/ExportActions';
import { BlockVisualPreview } from './BlockVisualPreview';

export interface BlockEditorProps {
  initialBlock?: BlockDefinition | BlockDefinitionJSON | null;
  onBackToList?: () => void;
  onSaved?: (blockJSON: BlockDefinitionJSON) => void;
}

const VALID_BLOCK_CATEGORIES: BlockCategory[] = [
  'natural',
  'building',
  'liquid',
  'utility',
  'decoration',
  'ore',
];

const COMMON_BLOCK_TAGS = [
  'ground',
  'soil',
  'walkable',
  'solid',
  'plantable',
  'water',
  'building',
  'ore',
  'transparent',
  'light_source',
];

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialBlock,
  onBackToList,
  onSaved,
}) => {
  // Navigation tab state: 'data' | 'preview' | 'split'
  const [activeTab, setActiveTab] = useState<EditorTab>('split');

  // Root block static data
  const [blockId, setBlockId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<BlockCategory>('natural');
  const [tags, setTags] = useState<string[]>(['ground', 'walkable']);
  const [newTagInput, setNewTagInput] = useState<string>('');

  // Attached components
  const [components, setComponents] = useState<BlockComponentSerializedData[]>([]);

  // Selected load id in dropdown
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Available official block component schemas
  const officialSchemas = useMemo(() => {
    return BlockSchemaRegistry.getAllSchemas().map((s) => ({
      type: s.type,
      name: s.name,
      description: s.description,
      isSingleton: s.isSingleton,
      properties: s.properties,
    }));
  }, []);

  // Initialize or load definition
  const loadFromDefinitionJSON = (json: BlockDefinitionJSON) => {
    setBlockId(json.id || '');
    setName(json.name || '');
    setCategory((json.category as BlockCategory) || 'natural');
    setTags(Array.isArray(json.tags) ? [...json.tags] : []);
    setComponents(
      Array.isArray(json.components)
        ? json.components.map((c) => ({
            id: c.id || `${c.type.toLowerCase()}_1`,
            type: c.type,
            data: { ...(c.data || {}) },
          }))
        : []
    );
    setSelectedLoadId(json.id);
  };

  // Initial load
  useEffect(() => {
    if (initialBlock) {
      if (initialBlock instanceof BlockDefinition) {
        loadFromDefinitionJSON(initialBlock.toJSON());
      } else {
        loadFromDefinitionJSON(initialBlock);
      }
    } else {
      handleNewBlock();
    }
  }, [initialBlock]);

  // Handle New Block template
  const handleNewBlock = () => {
    setBlockId('custom_block');
    setName('Novo Bloco');
    setCategory('natural');
    setTags(['ground', 'walkable']);
    setComponents([
      {
        id: 'emoji_1',
        type: 'EmojiIconComponent',
        data: { emoji: '🧱' },
      },
      {
        id: 'top_texture_1',
        type: 'TopTextureComponent',
        data: { primaryColor: '#4ade80', pattern: 'solid' },
      },
      {
        id: 'side_texture_1',
        type: 'SideTextureComponent',
        data: {
          primaryColor: '#16a34a',
          borderColor: '#15803d',
          defaultWallHeight: 14,
        },
      },
      {
        id: 'solid_1',
        type: 'SolidComponent',
        data: { solid: true },
      },
    ]);
    setSelectedLoadId('');
  };

  // Handle Loading a block from BlockSystem_db
  const handleLoadBlock = (id: string) => {
    const existing = BlockSystem_db.get(id);
    if (existing) {
      loadFromDefinitionJSON(existing.toJSON());
    }
  };

  // Construct current JSON object
  const currentBlockJSON: BlockDefinitionJSON = useMemo(() => {
    return {
      id: blockId.trim(),
      name: name.trim(),
      category,
      tags,
      components,
    };
  }, [blockId, name, category, tags, components]);

  // Real-time validation
  const validationReport: BlockValidationReport = useMemo(() => {
    return BlockSchemaRegistry.validateDefinition(currentBlockJSON);
  }, [currentBlockJSON]);

  // Present component types set
  const presentTypes = useMemo(() => {
    return new Set(components.map((c) => c.type));
  }, [components]);

  // Tag helpers
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/\s+/g, '_');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Component handlers
  const handleAddComponent = (schema: GenericComponentSchema) => {
    // Generate unique ID
    const baseId = schema.type.toLowerCase().replace('component', '');
    let counter = 1;
    while (components.some((c) => c.id === `${baseId}_${counter}`)) {
      counter++;
    }
    const newId = `${baseId}_${counter}`;

    // Compute default property values
    const defaultData: Record<string, any> = {};
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
        if (prop.default !== undefined) {
          defaultData[key] = prop.default;
        } else if (prop.type === 'string') {
          defaultData[key] = prop.allowedValues ? prop.allowedValues[0] : '';
        } else if (prop.type === 'number') {
          defaultData[key] = prop.min ?? 0;
        } else if (prop.type === 'boolean') {
          defaultData[key] = false;
        }
      }
    }

    setComponents([
      ...components,
      {
        id: newId,
        type: schema.type,
        data: defaultData,
      },
    ]);
  };

  const handleUpdateComponent = (
    index: number,
    updated: BlockComponentSerializedData
  ) => {
    const copy = [...components];
    copy[index] = updated;
    setComponents(copy);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleDuplicateComponent = (index: number) => {
    const target = components[index];
    const newId = `${target.id}_copy_${Date.now().toString().slice(-4)}`;
    const copy = {
      ...target,
      id: newId,
      data: { ...target.data },
    };
    const nextList = [...components];
    nextList.splice(index + 1, 0, copy);
    setComponents(nextList);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const nextList = [...components];
    const item = nextList.splice(index, 1)[0];
    nextList.splice(index - 1, 0, item);
    setComponents(nextList);
  };

  const handleMoveDown = (index: number) => {
    if (index === components.length - 1) return;
    const nextList = [...components];
    const item = nextList.splice(index, 1)[0];
    nextList.splice(index + 1, 0, item);
    setComponents(nextList);
  };

  // Export handlers
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentBlockJSON, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!validationReport.valid) return;
    const blob = new Blob([JSON.stringify(currentBlockJSON, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBlockJSON.id || 'block'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save directly to BlockSystem_db and BlockDatabase
  const handleSaveToSystem = () => {
    if (!validationReport.valid) {
      setSaveMessage({
        type: 'error',
        text: 'Corrija os erros de validação antes de salvar.',
      });
      setTimeout(() => setSaveMessage(null), 3500);
      return;
    }

    try {
      // 1. Build Definition using globalBlockManager
      const def = globalBlockManager.buildDefinitionFromJSON(currentBlockJSON, false);

      // 2. Register in BlockSystem_db
      BlockSystem_db.register(def);

      // 3. Register in BlockDatabase for world chunk rendering
      try {
        BlockDatabase.register(def as any);
      } catch (_) {}

      setSaveMessage({
        type: 'success',
        text: `Bloco "${currentBlockJSON.name}" salvo e registrado no sistema com sucesso!`,
      });
      setTimeout(() => setSaveMessage(null), 4000);
      onSaved?.(currentBlockJSON);
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: `Falha ao salvar bloco: ${err.message}`,
      });
      setTimeout(() => setSaveMessage(null), 4500);
    }
  };

  // Load block dropdown control
  const loadSelector = (
    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg px-2 py-1">
      <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
      <select
        value={selectedLoadId}
        onChange={(e) => {
          setSelectedLoadId(e.target.value);
          handleLoadBlock(e.target.value);
        }}
        className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer max-w-[160px] truncate"
      >
        <option value="" disabled>
          Carregar Bloco...
        </option>
        {BlockSystem_db.getAll().map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.id})
          </option>
        ))}
      </select>
    </div>
  );

  // Export actions component
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

  // @Data Panel: Static identity + Component Selector + Added Components list
  const dataPanel = (
    <>
      {/* 1. Static Block Identity Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Identidade Fundamental do Bloco (Raiz)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* ID do Bloco */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>
                ID do Bloco <span className="text-red-400">*</span>
              </span>
            </label>
            <input
              type="text"
              value={blockId}
              onChange={(e) =>
                setBlockId(e.target.value.toLowerCase().replace(/\s+/g, '_'))
              }
              placeholder="ex: crystal_ore"
              className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Identificador único snake_case interno utilizado pelo sistema para registro.
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Minério de Cristal"
              className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Nome legível do bloco que será apresentado na interface e no jogo.
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
              value={category}
              onChange={(e) => setCategory(e.target.value as BlockCategory)}
              className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
            >
              {VALID_BLOCK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              Define o grupo funcional do bloco (natural, building, liquid, etc.).
            </span>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Tags do Bloco ({tags.length})</span>
          </label>

          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center gap-1"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-zinc-400 hover:text-red-400 cursor-pointer"
                  title={`Remover tag ${t}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Add tag form */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(newTagInput);
                  }
                }}
                placeholder="+ tag..."
                className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-0.5 text-xs text-zinc-300 w-24 focus:w-32 transition-all focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick tags suggestions */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-[10px] text-zinc-500">Sugestões:</span>
            {COMMON_BLOCK_TAGS.filter((ct) => !tags.includes(ct)).map((ct) => (
              <button
                key={ct}
                type="button"
                onClick={() => handleAddTag(ct)}
                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 cursor-pointer transition-colors"
              >
                +{ct}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Component Selector */}
      <ComponentSelector
        schemas={officialSchemas}
        onSelectComponent={handleAddComponent}
        presentTypes={presentTypes}
        buttonLabel="+ Adicionar Componente"
        title="Componentes do Bloco"
        description="Selecione componentes do BlockSystem para anexar comportamentos e texturas a este bloco."
      />

      {/* 3. Validation Report Banner */}
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
              <span>Configuração Válida: O bloco atende a todas as regras de integridade do BlockSystem.</span>
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

      {/* 4. Added Components List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300 px-1">
          <span>Componentes Ativos ({components.length}):</span>
          <span className="text-[10px] text-zinc-500 font-normal">
            Cada componente é configurado e validado individualmente pelo BlockSystem
          </span>
        </div>

        {components.length === 0 ? (
          <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-xs">
            Nenhum componente adicionado. Utilize o botão &ldquo;+ Adicionar Componente&rdquo; acima para anexar comportamentos e visuais ao bloco.
          </div>
        ) : (
          components.map((comp, idx) => {
            const schema = officialSchemas.find((s) => s.type === comp.type);
            return (
              <ComponentEditor
                key={comp.id || idx}
                component={comp}
                schema={schema}
                index={idx}
                total={components.length}
                allComponents={components}
                onUpdate={(updated) => handleUpdateComponent(idx, updated)}
                onRemove={() => handleRemoveComponent(idx)}
                onDuplicate={() => handleDuplicateComponent(idx)}
                onMoveUp={() => handleMoveUp(idx)}
                onMoveDown={() => handleMoveDown(idx)}
              />
            );
          })
        )}
      </div>
    </>
  );

  // @Preview Panel: BlockVisualPreview on ground + JsonPreview
  const previewPanel = (
    <>
      {/* Visual Preview on Ground */}
      <BlockVisualPreview blockJSON={currentBlockJSON} />

      {/* JSON Runtime Preview */}
      <JsonPreview
        data={currentBlockJSON}
        title={`JSON do Runtime (data/blocks/${currentBlockJSON.id || 'block'}.json)`}
        filePath={`data/blocks/${currentBlockJSON.id || 'block'}.json`}
        onDownload={handleDownloadJSON}
        canDownload={validationReport.valid}
      />
    </>
  );

  return (
    <EditorLayout
      title="Editor de Blocos"
      onBackToList={onBackToList}
      backButtonLabel="Lista de Blocos"
      onNew={handleNewBlock}
      newButtonLabel="Novo Bloco"
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
