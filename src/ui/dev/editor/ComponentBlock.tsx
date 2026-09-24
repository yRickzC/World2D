import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Box,
  Copy,
  Layers,
  Palette,
  Sparkles,
  Trash2,
} from 'lucide-react';
import React from 'react';
import {
  ComponentPropertySchema,
  ComponentSchemaDefinition,
  globalSchemaRegistry,
} from '../../../gameplay/ItemSystem/schemas/SchemaRegistry';
import { ComponentSerializedData } from '../../../gameplay/ItemSystem/types';

interface ComponentBlockProps {
  component: ComponentSerializedData;
  index: number;
  total: number;
  allComponents: ComponentSerializedData[];
  onUpdate: (updated: ComponentSerializedData) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const ComponentBlock: React.FC<ComponentBlockProps> = ({
  component,
  index,
  total,
  allComponents,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const schema: ComponentSchemaDefinition | undefined = globalSchemaRegistry.getSchema(
    component.type
  );

  const isDuplicateId =
    allComponents.filter((c) => c.id === component.id).length > 1;

  // Check incompatibilities
  const isLevel = component.type === 'LevelComponent' || component.type.toLowerCase() === 'level';
  const isStack = component.type === 'StackComponent' || component.type.toLowerCase() === 'stack';
  const hasLevelInEntity = allComponents.some(
    (c) => c.type === 'LevelComponent' || c.type.toLowerCase() === 'level'
  );
  const hasStackInEntity = allComponents.some(
    (c) => c.type === 'StackComponent' || c.type.toLowerCase() === 'stack'
  );
  const isLevelStackConflict = (isLevel && hasStackInEntity) || (isStack && hasLevelInEntity);

  const handleIdChange = (newId: string) => {
    onUpdate({
      ...component,
      id: newId,
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    onUpdate({
      ...component,
      data: {
        ...component.data,
        [field]: value,
      },
    });
  };

  const renderField = (propName: string, propDef: ComponentPropertySchema) => {
    // Check conditional visibility (dependsOn)
    if (propDef.dependsOn) {
      const parentVal = component.data?.[propDef.dependsOn.field];
      if (parentVal !== propDef.dependsOn.value) {
        return null;
      }
    }

    const rawVal = component.data ? component.data[propName] : undefined;
    const val = rawVal !== undefined ? rawVal : propDef.default ?? '';

    // Special label customization for user-friendly Portuguese UX
    const fieldLabel = propDef.label || propName;

    // Dropdown (allowedValues)
    if (propDef.type === 'string' && propDef.allowedValues) {
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>
          <select
            value={val}
            onChange={(e) => handleFieldChange(propName, e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
          >
            {propDef.allowedValues.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {propDef.description && (
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // Boolean toggle/select
    if (propDef.type === 'boolean') {
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>
          <select
            value={val ? 'true' : 'false'}
            onChange={(e) => handleFieldChange(propName, e.target.value === 'true')}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
          >
            <option value="true">Sim (Ativado)</option>
            <option value="false">Não (Desativado)</option>
          </select>
          {propDef.description && (
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // Number input
    if (propDef.type === 'number') {
      const step = propDef.step ?? (propName === 'weight' || propName.includes('speed') ? 0.1 : 1);
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
            {propName === 'weight' && (
              <span className="text-[10px] text-amber-400 font-mono">
                ~{Math.max(1, Math.floor(64 / Math.max(0.1, Number(val) || 1)))} un / mochila padrão
              </span>
            )}
          </label>
          <input
            type="number"
            min={propDef.min}
            max={propDef.max}
            step={step}
            value={val}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              handleFieldChange(propName, isNaN(parsed) ? 0 : parsed);
            }}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 shadow-inner"
          />
          {propDef.description && (
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // Array input (CSV)
    if (propDef.type === 'array') {
      const arrayString = Array.isArray(val) ? val.join(', ') : String(val);
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">separado por vírgula</span>
          </label>
          <input
            type="text"
            value={arrayString}
            placeholder="ex: crafting, minerio, raro"
            onChange={(e) => {
              const items = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              handleFieldChange(propName, items);
            }}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 shadow-inner"
          />
          {propDef.description && (
            <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // Default string input (with Color picker support if color field)
    const isColorField = propName.toLowerCase().includes('color');
    return (
      <div key={propName} className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
          <span>
            {fieldLabel}
            {propDef.required && <span className="text-red-400 ml-1">*</span>}
          </span>
        </label>
        <div className="flex items-center gap-2">
          {isColorField && (
            <input
              type="color"
              value={String(val).startsWith('#') ? String(val) : '#38bdf8'}
              onChange={(e) => handleFieldChange(propName, e.target.value)}
              className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-950 cursor-pointer p-0.5 shrink-0"
            />
          )}
          <input
            type="text"
            value={val}
            placeholder={propName === 'source' ? 'ex: ⚔️ ou assets/items/iron_sword.svg' : ''}
            onChange={(e) => handleFieldChange(propName, e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-sans shadow-inner"
          />
        </div>
        {propDef.description && (
          <span className="text-[11px] text-zinc-400 leading-tight mt-0.5">
            {propDef.description}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-zinc-900/95 border rounded-xl overflow-hidden shadow-lg transition-all ${
      isLevelStackConflict
        ? 'border-red-500/80 ring-1 ring-red-500/50'
        : 'border-zinc-700/80 hover:border-zinc-600'
    }`}>
      {/* Block Header */}
      <div className="flex items-center justify-between bg-zinc-800/90 px-4 py-3 border-b border-zinc-700/60">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs shadow">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                [ {schema?.name ?? component.type} ]
              </span>
              {schema?.isSingleton && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
                  Instância Única
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Mover componente para cima"
            className="p-1.5 rounded hover:bg-zinc-700/70 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Mover componente para baixo"
            className="p-1.5 rounded hover:bg-zinc-700/70 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          {!schema?.isSingleton && (
            <button
              type="button"
              onClick={onDuplicate}
              title="Duplicar componente"
              className="p-1.5 rounded hover:bg-zinc-700/70 text-zinc-400 hover:text-amber-300 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            title="Remover este componente"
            className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Component Description Banner */}
      {schema?.description && (
        <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800/60 flex items-start gap-2 text-xs text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-zinc-100">{schema.name}:</strong> {schema.description}
          </span>
        </div>
      )}

      {/* Distinction Badge for Visual vs Render */}
      {component.type === 'VisualComponent' && (
        <div className="px-4 py-1.5 bg-blue-950/40 border-b border-blue-800/40 text-[11px] text-blue-300 font-medium flex items-center gap-1.5">
          <span>🎨 <strong>VisualComponent:</strong> O que será exibido (fonte visual do item: Emoji ou SVG).</span>
        </div>
      )}

      {component.type === 'RenderComponent' && (
        <div className="px-4 py-1.5 bg-purple-950/40 border-b border-purple-800/40 text-[11px] text-purple-300 font-medium flex items-center gap-1.5">
          <span>🖥️ <strong>RenderComponent:</strong> Como será renderizado na interface (label, ícone, escala).</span>
        </div>
      )}

      {/* Conflict Warnings */}
      {isLevelStackConflict && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-950/60 border border-red-500/60 text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>Erro:</strong> Um Item não pode possuir LevelComponent e StackComponent ao mesmo tempo.
          </span>
        </div>
      )}

      {/* Block Body: Properties */}
      <div className="p-4 space-y-4">
        {/* Dynamic Schema-Driven Properties */}
        {schema ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(schema.properties).map(([propName, propDef]) =>
              renderField(propName, propDef)
            )}
          </div>
        ) : (
          <div className="text-xs text-amber-400">
            Nenhum schema registrado para o componente &ldquo;{component.type}&rdquo;.
          </div>
        )}

        {/* Component Internal ID */}
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-zinc-400">
              ID Interno do Componente:
            </label>
            {isDuplicateId && (
              <span className="text-[10px] text-red-400 font-bold">
                ⚠️ ID Duplicado na Entity!
              </span>
            )}
          </div>
          <input
            type="text"
            value={component.id}
            onChange={(e) => handleIdChange(e.target.value)}
            className={`w-full bg-zinc-950 border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none ${
              isDuplicateId
                ? 'border-red-500 text-red-300'
                : 'border-zinc-800 text-zinc-400 focus:border-zinc-600'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
