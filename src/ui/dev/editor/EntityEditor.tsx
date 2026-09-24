import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderOpen,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import { EntityDefinition } from '../../../gameplay/EntitySystem/EntityDefinition';
import { EntitySystem_db } from '../../../gameplay/EntitySystem/EntityDB';
import {
  EntityComponentSerializedData,
  EntityDefinitionJSON,
  EntityValidationReport,
} from '../../../gameplay/EntitySystem/types';
import {
  EntitySchemaRegistry,
} from '../../../gameplay/EntitySystem/schemas/EntitySchemaRegistry';
import {
  ComponentList,
  ComponentSelector,
  DataPanel,
  EditorLayout,
  EditorTab,
  ExportActions,
  GenericComponentSchema,
  JsonPreview,
  PreviewPanel,
} from './shared';
import { EntityVisualPreview } from './EntityVisualPreview';

export interface EntityEditorProps {
  initialEntity?: EntityDefinition | EntityDefinitionJSON | null;
  onBackToList?: () => void;
  onSaved?: (entityJSON: EntityDefinitionJSON) => void;
}

const COMMON_ENTITY_TAGS = [
  'living',
  'enemy',
  'hostile',
  'passive',
  'neutral',
  'animal',
  'monster',
  'undead',
  'npc',
  'trader',
  'player',
  'boss',
  'small',
  'flying',
  'aquatic',
];

export const EntityEditor: React.FC<EntityEditorProps> = ({
  initialEntity,
  onBackToList,
  onSaved,
}) => {
  // Navigation tab state: 'data' | 'preview' | 'split'
  const [activeTab, setActiveTab] = useState<EditorTab>('split');

  // Root static identity state
  const [entityId, setEntityId] = useState<string>('zombie');
  const [name, setName] = useState<string>('Zombie');
  const [tags, setTags] = useState<string[]>(['enemy', 'living']);
  const [newTagInput, setNewTagInput] = useState<string>('');

  // Attached components state
  const [components, setComponents] = useState<EntityComponentSerializedData[]>([]);

  // Selected load id in dropdown
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Available official entity component schemas
  const officialSchemas: GenericComponentSchema[] = useMemo(() => {
    return EntitySchemaRegistry.getAllSchemas().map((s) => ({
      type: s.type,
      name: s.name,
      description: s.description,
      isSingleton: s.isSingleton,
      properties: s.properties,
    }));
  }, []);

  // Initialize or load definition
  const loadFromDefinitionJSON = (json: EntityDefinitionJSON) => {
    setEntityId(json.id || '');
    setName(json.name || '');
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

  // Handle New Entity template
  const handleNewEntity = () => {
    setEntityId('custom_entity');
    setName('Nova Entidade');
    setTags(['living', 'neutral']);
    setComponents([
      {
        id: 'name_1',
        type: 'NameComponent',
        data: { name: 'Nova Entidade' },
      },
      {
        id: 'health_1',
        type: 'HealthComponent',
        data: { maxHealth: 100, currentHealth: 100, invulnerable: false },
      },
      {
        id: 'movement_1',
        type: 'MovementComponent',
        data: { speed: 2.5, canFly: false, canSwim: true },
      },
      {
        id: 'style_1',
        type: 'StyleComponent',
        data: { mode: 'emoji', value: '👾', size: 40, scale: 1.0 },
      },
    ]);
    setSelectedLoadId('');
  };

  // Initial load
  useEffect(() => {
    if (initialEntity) {
      if (initialEntity instanceof EntityDefinition) {
        loadFromDefinitionJSON(initialEntity.toJSON());
      } else {
        loadFromDefinitionJSON(initialEntity);
      }
    } else {
      // Default to Zombie as showcased in prompt
      const existingZombie = EntitySystem_db.get('zombie');
      if (existingZombie) {
        loadFromDefinitionJSON(existingZombie.toJSON());
      } else {
        handleNewEntity();
      }
    }
  }, [initialEntity]);

  // Handle Loading an entity from EntitySystem_db
  const handleLoadEntity = (id: string) => {
    const existing = EntitySystem_db.get(id);
    if (existing) {
      loadFromDefinitionJSON(existing.toJSON());
    }
  };

  // Construct current JSON object
  const currentEntityJSON: EntityDefinitionJSON = useMemo(() => {
    return {
      id: entityId.trim(),
      name: name.trim(),
      tags,
      components,
    };
  }, [entityId, name, tags, components]);

  // Real-time validation
  const validationReport: EntityValidationReport = useMemo(() => {
    return EntitySchemaRegistry.validateDefinition(currentEntityJSON);
  }, [currentEntityJSON]);

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
    const baseId = schema.type.toLowerCase().replace('component', '');
    let counter = 1;
    while (components.some((c) => c.id === `${baseId}_${counter}`)) {
      counter++;
    }
    const newId = `${baseId}_${counter}`;

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

    // Synchronize NameComponent with current name if applicable
    if (schema.type === 'NameComponent' && name) {
      defaultData.name = name;
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
    updated: EntityComponentSerializedData
  ) => {
    const copy = [...components];
    copy[index] = updated;
    setComponents(copy);

    // If NameComponent updated, sync entity name
    if (updated.type === 'NameComponent' && updated.data?.name) {
      setName(updated.data.name);
    }
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

  // Export actions
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentEntityJSON, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!validationReport.isValid) return;
    const blob = new Blob([JSON.stringify(currentEntityJSON, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEntityJSON.id || 'entity'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToSystem = () => {
    if (!validationReport.isValid) {
      setSaveMessage({
        type: 'error',
        text: 'Corrija os erros de validação antes de salvar.',
      });
      setTimeout(() => setSaveMessage(null), 3500);
      return;
    }

    try {
      const def = EntityDefinition.fromJSON(currentEntityJSON);
      EntitySystem_db.register(def);

      setSaveMessage({
        type: 'success',
        text: `Entidade "${def.name}" (${def.id}) salva com sucesso no EntityDatabase!`,
      });
      setTimeout(() => setSaveMessage(null), 3500);

      if (onSaved) {
        onSaved(currentEntityJSON);
      }
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: `Falha ao salvar entidade: ${err?.message || String(err)}`,
      });
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  // Available registered entities for the quick-load select
  const availableEntities = useMemo(() => {
    return EntitySystem_db.getAll();
  }, [saveMessage]);

  // Static identity fields node for @Data
  const staticFieldsNode = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ID Field */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            ID da Entidade <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={entityId}
            onChange={(e) =>
              setEntityId(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, '_')
              )
            }
            placeholder="ex: zombie"
            className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Identificador único no sistema (letras minúsculas e sublinhados).
          </p>
        </div>

        {/* Nome Field */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Nome da Entidade <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              // Also sync NameComponent if present
              const nameIdx = components.findIndex((c) => c.type === 'NameComponent');
              if (nameIdx !== -1) {
                const copy = [...components];
                copy[nameIdx] = {
                  ...copy[nameIdx],
                  data: { ...copy[nameIdx].data, name: newName },
                };
                setComponents(copy);
              }
            }}
            placeholder="ex: Zombie"
            className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg text-xs font-medium text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Nome público de exibição exibido nos cartões e nametags.
          </p>
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
          Tags da Entidade
        </label>
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-950/80 border border-zinc-700/80 rounded-lg min-h-[42px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 shadow-sm"
            >
              <Tag className="w-3 h-3 text-emerald-400" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-zinc-400 hover:text-rose-400 cursor-pointer ml-0.5"
                title={`Remover tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="flex items-center gap-1 flex-1 min-w-[140px]">
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
              placeholder="Adicionar tag (Enter)..."
              className="bg-transparent border-none text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none w-full px-1"
            />
            {newTagInput.trim() && (
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white shrink-0 cursor-pointer"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* Quick Tag suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <span className="text-[10px] text-zinc-500 font-medium">Sugestões:</span>
          {COMMON_ENTITY_TAGS.filter((t) => !tags.includes(t))
            .slice(0, 8)
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddTag(suggestion)}
                className="px-1.5 py-0.5 rounded bg-zinc-800/60 hover:bg-zinc-700/80 text-[10px] text-zinc-400 hover:text-zinc-200 border border-zinc-800 cursor-pointer transition-colors"
              >
                +{suggestion}
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  // Components node for @Data
  const componentsNode = (
    <ComponentList
      components={components}
      schemas={officialSchemas}
      onUpdateComponent={handleUpdateComponent}
      onRemoveComponent={handleRemoveComponent}
      onAddComponent={handleAddComponent}
      onDuplicateComponent={handleDuplicateComponent}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      buttonLabel="+ Adicionar Componente"
      selectorTitle="Selecione um Componente de Entidade"
      emptyMessage="Nenhum componente anexado a esta entidade. Clique em '+ Adicionar Componente' para configurar vida, movimento, estilo ou IA."
    />
  );

  // Load Selector dropdown node for top toolbar
  const loadSelectorNode = (
    <div className="flex items-center gap-1.5 bg-zinc-950/70 border border-zinc-700/70 rounded-lg px-2.5 py-1">
      <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-[11px] text-zinc-400 font-medium">Carregar:</span>
      <select
        value={selectedLoadId}
        onChange={(e) => handleLoadEntity(e.target.value)}
        className="bg-transparent text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
      >
        <option value="" disabled className="bg-zinc-900 text-zinc-400">
          Selecione uma entidade...
        </option>
        {availableEntities.map((ent) => (
          <option
            key={ent.id}
            value={ent.id}
            className="bg-zinc-900 text-zinc-200"
          >
            {ent.name} ({ent.id})
          </option>
        ))}
      </select>
    </div>
  );

  // Export actions component
  const exportActionsNode = (
    <ExportActions
      onSaveToSystem={handleSaveToSystem}
      onDownloadJSON={handleDownloadJSON}
      onCopyJSON={handleCopyJSON}
      copied={copied}
      canSave={validationReport.isValid}
      saveLabel="Salvar no Sistema"
      downloadLabel="Salvar .JSON"
      copyLabel="Copiar JSON"
    />
  );

  return (
    <EditorLayout
      title="Editor de Entidades"
      onBackToList={onBackToList}
      backButtonLabel="Voltar para Lista"
      onNew={handleNewEntity}
      newButtonLabel="Nova Entidade"
      loadSelector={loadSelectorNode}
      exportActions={exportActionsNode}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      componentCount={components.length}
      hasErrors={!validationReport.isValid}
      saveMessage={saveMessage}
      onDismissSaveMessage={() => setSaveMessage(null)}
      dataPanel={
        <DataPanel
          staticFieldsTitle="Dados da Entidade"
          staticFields={staticFieldsNode}
          componentsTitle="Componentes"
          componentsCount={components.length}
          componentsContent={componentsNode}
          validationReport={validationReport}
        />
      }
      previewPanel={
        <PreviewPanel
          visualTitle="Preview Visual da Entidade"
          visualPreview={
            <EntityVisualPreview
              id={entityId}
              name={name}
              tags={tags}
              components={components}
            />
          }
          jsonTitle="Preview do JSON (Oficial)"
          jsonPreview={
            <JsonPreview
              value={currentEntityJSON}
              fileName={`${entityId || 'entity'}.json`}
              onCopy={handleCopyJSON}
              copied={copied}
            />
          }
        />
      }
    />
  );
};
