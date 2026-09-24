import React, { useState, useMemo } from 'react';
import { Check, Layers, Plus, Search, X } from 'lucide-react';
import {
  BlockComponentSchemaDefinition,
  OFFICIAL_BLOCK_COMPONENT_SCHEMAS,
} from '../../../gameplay/BlockSystem/schemas/BlockSchemaRegistry';

export interface ModuleSelectorDialogProps {
  currentComponents: { type: string; data?: any }[];
  onSelectModule: (schema: BlockComponentSchemaDefinition) => void;
  onClose: () => void;
}

export const ModuleSelectorDialog: React.FC<ModuleSelectorDialogProps> = ({
  currentComponents,
  onSelectModule,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const currentTypes = useMemo(
    () => currentComponents.map((c) => c.type),
    [currentComponents]
  );

  const filteredSchemas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return OFFICIAL_BLOCK_COMPONENT_SCHEMAS;
    return OFFICIAL_BLOCK_COMPONENT_SCHEMAS.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[550px]">
        {/* Header */}
        <div className="h-12 bg-zinc-850 border-b border-zinc-750 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold tracking-wide text-white uppercase">
              Adicionar Componente / Módulo
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-750 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/80">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar módulos (Breaking, Collision, Light, Drops...)"
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-850 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* List of Modules */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSchemas.map((schema) => {
            const isSingletonAlreadyAdded =
              schema.isSingleton && currentTypes.includes(schema.type);
            const incompatibleWithExisting = schema.incompatibleWith?.find((inc) =>
              currentTypes.includes(inc)
            );

            const isDisabled = Boolean(isSingletonAlreadyAdded || incompatibleWithExisting);

            return (
              <button
                key={schema.type}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onSelectModule(schema);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isDisabled
                    ? 'bg-zinc-850/30 border-zinc-800/60 opacity-50 cursor-not-allowed'
                    : 'bg-zinc-850/80 hover:bg-zinc-800 border-zinc-750 hover:border-amber-400/80 cursor-pointer shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">
                        {schema.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">v{schema.version}</span>
                      {schema.isSingleton && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Único
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {schema.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 mt-0.5">
                    {isSingletonAlreadyAdded ? (
                      <span className="text-[10px] text-amber-400 font-medium">Já adicionado</span>
                    ) : incompatibleWithExisting ? (
                      <span className="text-[10px] text-rose-400 font-medium">
                        Incompatível com {incompatibleWithExisting}
                      </span>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
