import React, { useState } from 'react';
import { AlertCircle, Check, Code, Layers, Save, Sliders, X } from 'lucide-react';
import { Button } from '../../components/Button';
import {
  BlockComponentSchemaDefinition,
  BlockPropertySchema,
  BlockSchemaRegistry,
} from '../../../gameplay/BlockSystem/schemas/BlockSchemaRegistry';

export interface ModuleEditorDialogProps {
  component: { id?: string; type: string; data?: any };
  onSave: (updatedData: any) => void;
  onClose: () => void;
}

export const ModuleEditorDialog: React.FC<ModuleEditorDialogProps> = ({
  component,
  onSave,
  onClose,
}) => {
  const schema: BlockComponentSchemaDefinition | undefined = BlockSchemaRegistry.getSchema(
    component.type
  );

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = { ...(component.data || {}) };
    if (schema?.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (initial[key] === undefined && prop.default !== undefined) {
          initial[key] = prop.default;
        }
      }
    }
    return initial;
  });

  const [rawJsonMode, setRawJsonMode] = useState<boolean>(!schema);
  const [rawJsonText, setRawJsonText] = useState<string>(() =>
    JSON.stringify(component.data || {}, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (rawJsonMode) {
      try {
        const parsed = JSON.parse(rawJsonText);
        onSave(parsed);
        onClose();
      } catch (err: any) {
        setJsonError(`JSON inválido: ${err.message}`);
      }
      return;
    }

    onSave(formData);
    onClose();
  };

  const renderField = (key: string, prop: BlockPropertySchema) => {
    const val = formData[key] !== undefined ? formData[key] : prop.default;

    if (prop.type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-zinc-850/60 border border-zinc-750">
          <div>
            <span className="text-xs font-bold text-white">{prop.label || key}</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">{prop.description}</p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(val)}
            onChange={(e) => handleFieldChange(key, e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      );
    }

    if (prop.allowedValues && prop.allowedValues.length > 0) {
      return (
        <div key={key} className="space-y-1">
          <label className="block text-xs font-semibold text-zinc-300">{prop.label || key}</label>
          <select
            value={val ?? ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {prop.allowedValues.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {prop.description && <p className="text-[10px] text-zinc-500 mt-0.5">{prop.description}</p>}
        </div>
      );
    }

    if (prop.type === 'number') {
      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">{prop.label || key}</label>
            <span className="text-[11px] font-mono text-amber-400">{val}</span>
          </div>
          <input
            type="number"
            min={prop.min}
            max={prop.max}
            step={prop.step ?? (prop.max && prop.max <= 1 ? 0.05 : 1)}
            value={val ?? 0}
            onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
          />
          {prop.description && <p className="text-[10px] text-zinc-500 mt-0.5">{prop.description}</p>}
        </div>
      );
    }

    // Color string field
    const isColorField = key.toLowerCase().includes('color') || prop.label?.toLowerCase().includes('cor');
    if (prop.type === 'string' && isColorField) {
      return (
        <div key={key} className="space-y-1">
          <label className="block text-xs font-semibold text-zinc-300">{prop.label || key}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={val || '#f59e0b'}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="w-10 h-10 rounded-xl bg-transparent border border-zinc-700 cursor-pointer"
            />
            <input
              type="text"
              value={val || '#f59e0b'}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          {prop.description && <p className="text-[10px] text-zinc-500 mt-0.5">{prop.description}</p>}
        </div>
      );
    }

    // Default string or object
    return (
      <div key={key} className="space-y-1">
        <label className="block text-xs font-semibold text-zinc-300">{prop.label || key}</label>
        <input
          type="text"
          value={typeof val === 'object' ? JSON.stringify(val) : (val ?? '')}
          onChange={(e) => {
            const v = e.target.value;
            if (prop.type === 'array' || prop.type === 'object') {
              try {
                handleFieldChange(key, JSON.parse(v));
              } catch {
                handleFieldChange(key, v);
              }
            } else {
              handleFieldChange(key, v);
            }
          }}
          className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
        />
        {prop.description && <p className="text-[10px] text-zinc-500 mt-0.5">{prop.description}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[600px]">
        {/* Header */}
        <div className="h-12 bg-zinc-850 border-b border-zinc-750 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold tracking-wide text-white uppercase">
              {schema?.name || component.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {schema && (
              <button
                type="button"
                onClick={() => {
                  if (!rawJsonMode) {
                    setRawJsonText(JSON.stringify(formData, null, 2));
                  }
                  setRawJsonMode(!rawJsonMode);
                }}
                className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750 transition-colors"
              >
                {rawJsonMode ? 'Formulário' : 'Ver JSON'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-750 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description Banner */}
        {schema && !rawJsonMode && (
          <div className="p-3 bg-zinc-950/40 border-b border-zinc-800 text-xs text-zinc-400 leading-relaxed">
            {schema.description}
          </div>
        )}

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {rawJsonMode ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Dados do Módulo em formato JSON
              </label>
              <textarea
                rows={10}
                value={rawJsonText}
                onChange={(e) => {
                  setRawJsonText(e.target.value);
                  setJsonError(null);
                }}
                className="w-full p-3 bg-zinc-950 font-mono text-xs text-amber-300 border border-zinc-750 rounded-xl focus:outline-none focus:border-amber-400 leading-normal"
              />
              {jsonError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>
          ) : schema ? (
            <div className="space-y-4">
              {Object.entries(schema.properties).map(([key, prop]) =>
                renderField(key, prop)
              )}
            </div>
          ) : (
            <div className="text-zinc-400 text-xs">
              Nenhum schema registrado para este módulo. Edite os dados diretamente no modo JSON.
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
            onClick={handleSave}
            icon={<Save className="w-3.5 h-3.5" />}
            className="text-xs px-4"
          >
            Salvar Módulo
          </Button>
        </div>
      </div>
    </div>
  );
};
