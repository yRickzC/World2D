import { Box, Check, Layers, ShieldAlert, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import {
  ComponentSchemaDefinition,
  globalSchemaRegistry,
} from '../../../gameplay/ItemSystem/schemas/SchemaRegistry';

export const ComponentBrowser: React.FC = () => {
  const schemas = globalSchemaRegistry.getAllSchemas();
  const [selectedType, setSelectedType] = useState<string>(schemas[0]?.type || 'render');

  const selectedSchema: ComponentSchemaDefinition | undefined =
    globalSchemaRegistry.getSchema(selectedType);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
      {/* Component List */}
      <div className="md:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2 overflow-y-auto">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider px-1">
          Componentes do Core ({schemas.length})
        </h3>
        {schemas.map((s) => (
          <button
            key={s.type}
            type="button"
            onClick={() => setSelectedType(s.type)}
            className={`flex items-start justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedType === s.type
                ? 'bg-amber-500/15 border-amber-500/50 text-white'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
            }`}
          >
            <div>
              <div className="text-xs font-bold">{s.name}</div>
              <div className="text-[10px] font-mono text-zinc-500">{s.type}</div>
            </div>
            {s.requires && s.requires.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40">
                Requer {s.requires.join(', ')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Component Details */}
      <div className="md:col-span-8 bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 overflow-y-auto">
        {selectedSchema ? (
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedSchema.name}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span>type: &ldquo;{selectedSchema.type}&rdquo;</span>
                    <span>•</span>
                    <span>v{selectedSchema.version}</span>
                    <span>•</span>
                    <span className={selectedSchema.isDynamic ? 'text-cyan-400' : 'text-zinc-400'}>
                      {selectedSchema.isDynamic ? 'Dynamic State' : 'Static Definition'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                {selectedSchema.description}
              </p>
            </div>

            {/* Required Dependencies */}
            {selectedSchema.requires && selectedSchema.requires.length > 0 && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-center gap-2 text-xs text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Dependência Obrigatória:</strong> Todo item que utilizar{' '}
                  {selectedSchema.name} DEVE obrigatoriamente possuir componente do tipo:{' '}
                  <code className="px-1.5 py-0.5 bg-black/40 rounded text-amber-200">
                    {selectedSchema.requires.join(', ')}
                  </code>
                  .
                </span>
              </div>
            )}

            {/* Properties List */}
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Propriedades Declaradas no Schema
              </h3>
              <div className="space-y-2">
                {Object.entries(selectedSchema.properties).map(([propName, propDef]) => (
                  <div
                    key={propName}
                    className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300 font-mono">
                          {propName}
                        </span>
                        {propDef.required && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
                            required
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{propDef.type}</span>
                    </div>

                    {propDef.description && (
                      <p className="text-[11px] text-zinc-400">{propDef.description}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500 pt-1">
                      {propDef.default !== undefined && (
                        <span>Default: {JSON.stringify(propDef.default)}</span>
                      )}
                      {propDef.min !== undefined && <span>Min: {propDef.min}</span>}
                      {propDef.max !== undefined && <span>Max: {propDef.max}</span>}
                      {propDef.allowedValues && (
                        <span>Valores: [{propDef.allowedValues.join(', ')}]</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500">Selecione um componente para ver detalhes.</div>
        )}
      </div>
    </div>
  );
};
