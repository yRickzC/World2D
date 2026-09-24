import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Box,
  Clock,
  Copy,
  Layers,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { GenericComponentSchema } from './ComponentSelector';

export interface ComponentSerializedItem {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface ComponentEditorProps {
  component: ComponentSerializedItem;
  schema?: GenericComponentSchema;
  index: number;
  total: number;
  allComponents: ComponentSerializedItem[];
  onUpdate: (updated: ComponentSerializedItem) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const ComponentEditor: React.FC<ComponentEditorProps> = ({
  component,
  schema,
  index,
  total,
  allComponents,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const isDuplicateId =
    allComponents.filter((c) => c.id === component.id).length > 1;

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

  const renderField = (propName: string, propDef: any) => {
    const rawVal = component.data ? component.data[propName] : undefined;
    const val = rawVal !== undefined ? rawVal : propDef.default ?? '';
    const fieldLabel = propDef.label || propName;
    const isColor =
      propName.toLowerCase().includes('color') ||
      (typeof val === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val));
    const isEmoji = propName.toLowerCase().includes('emoji');

    // 1. Dropdown (allowedValues)
    if (propDef.allowedValues && Array.isArray(propDef.allowedValues)) {
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
            className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
          >
            {propDef.allowedValues.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {propDef.description && (
            <span className="text-[10px] text-zinc-400 leading-tight">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // 2. Boolean Field (Toggle)
    if (propDef.type === 'boolean') {
      const boolVal = Boolean(val);
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange(propName, !boolVal)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                boolVal ? 'bg-amber-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  boolVal ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs text-zinc-300 font-medium">
              {boolVal ? 'Verdadeiro (Ativo)' : 'Falso (Inativo)'}
            </span>
          </div>
          {propDef.description && (
            <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // 3. Color Picker Field
    if (isColor) {
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={typeof val === 'string' && val.startsWith('#') ? val : '#4ade80'}
              onChange={(e) => handleFieldChange(propName, e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
            />
            <input
              type="text"
              value={val}
              onChange={(e) => handleFieldChange(propName, e.target.value)}
              placeholder="#4ade80"
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>
          {propDef.description && (
            <span className="text-[10px] text-zinc-400 leading-tight">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // 4. Emoji Field
    if (isEmoji) {
      const popularEmojis = ['🌱', '🌿', '🟫', '🪨', '🪵', '💧', '🌊', '🧱', '🔥', '🌾', '🌸', '✨'];
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-700 flex items-center justify-center text-xl">
              {val || '❓'}
            </span>
            <input
              type="text"
              value={val}
              onChange={(e) => handleFieldChange(propName, e.target.value)}
              placeholder="ex: 🌱"
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {popularEmojis.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => handleFieldChange(propName, em)}
                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-xs flex items-center justify-center cursor-pointer transition-colors"
                title={`Usar emoji ${em}`}
              >
                {em}
              </button>
            ))}
          </div>
          {propDef.description && (
            <span className="text-[10px] text-zinc-400 leading-tight">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // 5. Number Field
    if (propDef.type === 'number') {
      return (
        <div key={propName} className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>
              {fieldLabel}
              {propDef.required && <span className="text-red-400 ml-1">*</span>}
            </span>
            {(propDef.min !== undefined || propDef.max !== undefined) && (
              <span className="text-[10px] font-mono text-zinc-500">
                [{propDef.min ?? '-∞'} .. {propDef.max ?? '+∞'}]
              </span>
            )}
          </label>
          <input
            type="number"
            value={val}
            min={propDef.min}
            max={propDef.max}
            step={propDef.step ?? 1}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              handleFieldChange(propName, isNaN(parsed) ? 0 : parsed);
            }}
            className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400 shadow-inner"
          />
          {propDef.description && (
            <span className="text-[10px] text-zinc-400 leading-tight">
              {propDef.description}
            </span>
          )}
        </div>
      );
    }

    // 6. Array of strings field (e.g. allowedBiomes, allowedBlocks, tags)
    if (propDef.type === 'array') {
      const arrVal: string[] = Array.isArray(val) ? val : [];
      let suggestions: string[] = [];
      const lowerProp = propName.toLowerCase();
      if (lowerProp.includes('biome')) {
        suggestions = ['plains', 'forest', 'dense_forest', 'desert', 'swamp', 'ocean', 'caves', 'beach'];
      } else if (lowerProp.includes('block')) {
        suggestions = ['grass', 'dense_grass', 'sand', 'water', 'stone', 'wood_plank', 'dug_dirt'];
      } else if (lowerProp.includes('tag')) {
        suggestions = ['solid', 'natural_ground', 'liquid', 'vegetation', 'hazard'];
      }

      return (
        <ArrayFieldEditor
          key={propName}
          fieldLabel={fieldLabel}
          required={propDef.required}
          description={propDef.description}
          items={arrVal}
          suggestions={suggestions}
          onChange={(newArr) => handleFieldChange(propName, newArr)}
        />
      );
    }

    // 7. Time object field (for EntitySpawnComponent)
    if (propDef.type === 'object' && propName === 'time') {
      const timeVal = typeof val === 'object' && val !== null ? val : { mode: 'any', startTime: '00:00', endTime: '24:00' };
      return (
        <TimeFieldEditor
          key={propName}
          fieldLabel={fieldLabel}
          required={propDef.required}
          description={propDef.description}
          value={timeVal}
          onChange={(newTime) => handleFieldChange(propName, newTime)}
        />
      );
    }

    // 8. Generic Text Field (Default)
    return (
      <div key={propName} className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
          <span>
            {fieldLabel}
            {propDef.required && <span className="text-red-400 ml-1">*</span>}
          </span>
        </label>
        <input
          type="text"
          value={typeof val === 'object' ? JSON.stringify(val) : val}
          onChange={(e) => handleFieldChange(propName, e.target.value)}
          placeholder={propDef.default !== undefined ? String(propDef.default) : ''}
          className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 shadow-inner"
        />
        {propDef.description && (
          <span className="text-[10px] text-zinc-400 leading-tight">
            {propDef.description}
          </span>
        )}
      </div>
    );
  };

  const properties = schema?.properties || {};
  const propertyEntries = Object.entries(properties);

  return (
    <div
      id={`comp-editor-${component.id}`}
      className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md transition-all duration-150 flex flex-col gap-3"
    >
      {/* Component Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">{component.type}</span>
              {schema?.isSingleton && (
                <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  1x
                </span>
              )}
            </div>
            {schema?.description && (
              <p className="text-[10px] text-zinc-400 truncate max-w-[280px]">
                {schema.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              className={`p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-800'
              }`}
              title="Mover para cima"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              className={`p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer ${
                index === total - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-zinc-800'
              }`}
              title="Mover para baixo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Duplicar componente"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete / Remove Component */}
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer ml-1"
            title="Remover componente"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Internal Component ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
            <span>
              ID da Instância <span className="text-red-400">*</span>
            </span>
            {isDuplicateId && (
              <span className="text-red-400 text-[10px] font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> ID duplicado
              </span>
            )}
          </label>
          <input
            type="text"
            value={component.id}
            onChange={(e) => handleIdChange(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            className={`bg-zinc-900 border rounded-md px-2.5 py-1 text-xs font-mono text-amber-300 focus:outline-none ${
              isDuplicateId ? 'border-red-500' : 'border-zinc-700/80 focus:border-amber-400'
            }`}
          />
        </div>

        <div className="flex flex-col justify-center text-[10px] text-zinc-500">
          <span>Identificador interno único desta instância do componente no bloco.</span>
        </div>
      </div>

      {/* Configurable Properties */}
      {propertyEntries.length === 0 ? (
        <div className="text-xs text-zinc-500 italic py-1">
          Este componente não requer configurações adicionais.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {propertyEntries.map(([propName, propDef]) => renderField(propName, propDef))}
        </div>
      )}
    </div>
  );
};

interface ArrayFieldEditorProps {
  fieldLabel: string;
  required?: boolean;
  description?: string;
  items: string[];
  suggestions: string[];
  onChange: (items: string[]) => void;
}

const ArrayFieldEditor: React.FC<ArrayFieldEditorProps> = ({
  fieldLabel,
  required,
  description,
  items,
  suggestions,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;
    if (!items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setInputValue('');
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(items.filter((i) => i !== itemToRemove));
  };

  return (
    <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-200">
          {fieldLabel}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <span className="text-[10px] text-zinc-400 font-mono">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Item Badges */}
      <div className="flex flex-wrap gap-1.5 min-h-6">
        {items.length === 0 ? (
          <span className="text-[11px] text-zinc-500 italic py-0.5">
            (Nenhum filtro especificado - padrão livre)
          </span>
        ) : (
          items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-[11px] font-mono text-zinc-200 shadow-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="text-zinc-400 hover:text-red-400 p-0.5 cursor-pointer"
                title={`Remover ${item}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-1.5 mt-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd(inputValue);
            }
          }}
          placeholder="Adicionar novo valor e teclar Enter..."
          className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
        />
        <button
          type="button"
          onClick={() => handleAdd(inputValue)}
          disabled={!inputValue.trim()}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium text-zinc-200 rounded border border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {/* Suggestions Pills */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <span className="text-[10px] text-zinc-500 mr-1">Sugestões:</span>
          {suggestions.map((sug) => {
            const isSelected = items.includes(sug);
            return (
              <button
                key={sug}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    handleRemove(sug);
                  } else {
                    handleAdd(sug);
                  }
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-medium'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {sug}
              </button>
            );
          })}
        </div>
      )}

      {description && (
        <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
          {description}
        </span>
      )}
    </div>
  );
};

interface TimeFieldEditorProps {
  fieldLabel: string;
  required?: boolean;
  description?: string;
  value: { mode?: string; startTime?: string | number; endTime?: string | number };
  onChange: (val: any) => void;
}

const TimeFieldEditor: React.FC<TimeFieldEditorProps> = ({
  fieldLabel,
  required,
  description,
  value,
  onChange,
}) => {
  const mode = value?.mode || 'any';
  const startTime = value?.startTime ?? '00:00';
  const endTime = value?.endTime ?? '24:00';

  const setMode = (newMode: string) => {
    let newStart = startTime;
    let newEnd = endTime;
    if (newMode === 'day') {
      newStart = '06:00';
      newEnd = '18:00';
    } else if (newMode === 'night') {
      newStart = '18:00';
      newEnd = '06:00';
    } else if (newMode === 'any') {
      newStart = '00:00';
      newEnd = '24:00';
    }
    onChange({
      ...value,
      mode: newMode,
      startTime: newStart,
      endTime: newEnd,
    });
  };

  return (
    <div className="flex flex-col gap-2 col-span-1 sm:col-span-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          {fieldLabel}
          {required && <span className="text-red-400">*</span>}
        </label>
        <span className="text-[10px] text-zinc-400 uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          Modo: {mode}
        </span>
      </div>

      {/* Preset Mode Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { id: 'any', label: 'Qualquer Hora (24h)', icon: '☀️🌙' },
          { id: 'day', label: 'Diurno (06-18h)', icon: '☀️' },
          { id: 'night', label: 'Noturno (18-06h)', icon: '🌙' },
          { id: 'custom', label: 'Personalizado', icon: '⚙️' },
        ].map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setMode(btn.id)}
            className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer text-left flex flex-col gap-0.5 ${
              mode === btn.id
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <span className="text-xs">{btn.icon}</span>
            <span className="text-[11px] leading-tight truncate">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Custom times (always visible or editable) */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-zinc-400">Hora Inicial (ex: 18:00)</label>
          <input
            type="text"
            value={String(startTime)}
            onChange={(e) =>
              onChange({
                ...value,
                mode: 'custom',
                startTime: e.target.value,
              })
            }
            className="bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-zinc-400">Hora Final (ex: 06:00)</label>
          <input
            type="text"
            value={String(endTime)}
            onChange={(e) =>
              onChange({
                ...value,
                mode: 'custom',
                endTime: e.target.value,
              })
            }
            className="bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {description && (
        <span className="text-[10px] text-zinc-400 leading-tight">
          {description}
        </span>
      )}
    </div>
  );
};
