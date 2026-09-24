import React, { useState, useMemo } from 'react';
import { Check, Plus, Search, Tag, X } from 'lucide-react';
import { Button } from '../../components/Button';

export interface TagSelectorDialogProps {
  currentTags: string[];
  availableTags?: string[];
  onSelectTag: (tag: string) => void;
  onClose: () => void;
}

const DEFAULT_KNOWN_TAGS = [
  'solid',
  'transparent',
  'liquid',
  'ore',
  'stone',
  'wood',
  'dirt',
  'foliage',
  'light_source',
  'container',
  'flammable',
  'unbreakable',
  'natural',
  'crafted',
  'tool_pickaxe',
  'tool_axe',
  'tool_shovel',
];

export const TagSelectorDialog: React.FC<TagSelectorDialogProps> = ({
  currentTags,
  availableTags = [],
  onSelectTag,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Merge known tags with project tags
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>([...DEFAULT_KNOWN_TAGS, ...availableTags]);
    return Array.from(set).sort();
  }, [availableTags]);

  const filteredTags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allUniqueTags;
    return allUniqueTags.filter((t) => t.toLowerCase().includes(term));
  }, [allUniqueTags, searchTerm]);

  const handleCreateAndSelect = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (clean && !currentTags.includes(clean)) {
      onSelectTag(clean);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[500px]">
        {/* Header */}
        <div className="h-12 bg-zinc-850 border-b border-zinc-750 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold tracking-wide text-white uppercase">Selecionar Tag</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-750 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/80">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar tag registrada..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-850 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[160px]">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => {
              const isAlreadyAdded = currentTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => {
                    onSelectTag(tag);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all text-left ${
                    isAlreadyAdded
                      ? 'bg-zinc-800/40 text-zinc-500 cursor-not-allowed border border-transparent'
                      : 'bg-zinc-850/80 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-750 hover:border-amber-400/60 cursor-pointer'
                  }`}
                >
                  <span className="truncate">#{tag}</span>
                  {isAlreadyAdded ? (
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-sans">
                      <Check className="w-3 h-3 text-emerald-400" /> Adicionada
                    </span>
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-zinc-500 font-sans">
              Nenhuma tag encontrada com esse termo.
            </div>
          )}
        </div>

        {/* Create Custom Tag footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-850/60 flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateAndSelect()}
            placeholder="Criar nova tag personalizada..."
            className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!newTagInput.trim() || currentTags.includes(newTagInput.trim().toLowerCase())}
            onClick={handleCreateAndSelect}
            className="text-xs py-1.5"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};
