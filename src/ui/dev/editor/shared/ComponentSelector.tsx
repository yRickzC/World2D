import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, Plus, Search, Sparkles, X } from 'lucide-react';

export interface GenericComponentSchema {
  type: string;
  name: string;
  description?: string;
  isSingleton?: boolean;
  properties?: Record<string, any>;
}

export interface ComponentSelectorProps {
  schemas: GenericComponentSchema[];
  onSelectComponent: (schema: GenericComponentSchema) => void;
  presentTypes: Set<string>;
  buttonLabel?: string;
  title?: string;
  description?: string;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  schemas,
  onSelectComponent,
  presentTypes,
  buttonLabel = '+ Adicionar Componente',
  title = 'Adicionar Novo Componente',
  description = 'Selecione um componente para anexar à entidade.',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter schemas
  const filteredSchemas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return schemas;
    return schemas.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.type.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
    );
  }, [schemas, searchQuery]);

  const handleSelect = (schema: GenericComponentSchema) => {
    onSelectComponent(schema);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md" ref={containerRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{title}</span>
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>
        </div>

        {/* Trigger Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-102 active:scale-98 w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{buttonLabel}</span>
          </button>

          {/* Searchable & Scrollable Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-2 z-50 divide-y divide-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header & Search */}
              <div className="p-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <span>Componentes Disponíveis ({schemas.length})</span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar componente..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="max-h-72 overflow-y-auto py-1 divide-y divide-zinc-800/40">
                {filteredSchemas.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-zinc-500">
                    Nenhum componente encontrado para &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredSchemas.map((schema) => {
                    const alreadyPresent = presentTypes.has(schema.type);
                    const isBlocked = schema.isSingleton && alreadyPresent;

                    return (
                      <button
                        key={schema.type}
                        type="button"
                        disabled={isBlocked}
                        onClick={() => handleSelect(schema)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex flex-col gap-0.5 transition-colors ${
                          !isBlocked
                            ? 'hover:bg-zinc-800/90 text-zinc-100 cursor-pointer'
                            : 'opacity-40 text-zinc-500 cursor-not-allowed bg-zinc-950/40'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-white group-hover:text-amber-300">
                            {schema.name}
                          </span>
                          {schema.isSingleton && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                              1x (único)
                            </span>
                          )}
                        </div>

                        {isBlocked ? (
                          <span className="text-[10px] text-amber-500/90 font-medium">
                            Já adicionado (Instância única permitida)
                          </span>
                        ) : schema.description ? (
                          <span className="text-[10px] text-zinc-400 line-clamp-2">
                            {schema.description}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
