import React, { useMemo, useState } from 'react';
import { Check, Filter, Layers, Search, X } from 'lucide-react';
import { BlockDefinition } from '../../../gameplay/BlockSystem/BlockDefinition';
import { globalBlockDB } from '../../../gameplay/BlockSystem/BlockDB';
import { globalBlockManager } from '../../../gameplay/BlockSystem/BlockManager';
import { ColorTextureComponent, EmojiIconComponent, SolidComponent } from '../../../gameplay/BlockSystem/components';

export interface BlockSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (blockId: string) => void;
  selectedBlockId?: string;
  title?: string;
}

export const BlockSelectModal: React.FC<BlockSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
  selectedBlockId,
  title = 'Selecionar Bloco',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [onlyGround, setOnlyGround] = useState<boolean>(false);

  // Ensure core blocks are registered
  const allBlocks = useMemo(() => {
    if (globalBlockDB.count() === 0) {
      try {
        globalBlockManager.initializeCore();
      } catch (err) {
        console.warn('Could not auto-initialize core blocks:', err);
      }
    }
    const blocks = globalBlockDB.getAll();
    if (blocks.length === 0) {
      // Fallback predefined block definitions for editor safety
      return [
        new BlockDefinition('grass', 'Grama', 'natural', ['ground', 'walkable'], [
          new EmojiIconComponent({ emoji: '🌱' }),
          new ColorTextureComponent({ primaryColor: '#22c55e' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('dirt', 'Terra', 'natural', ['ground', 'walkable'], [
          new EmojiIconComponent({ emoji: '🟫' }),
          new ColorTextureComponent({ primaryColor: '#854d0e' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('stone', 'Pedra', 'natural', ['solid'], [
          new EmojiIconComponent({ emoji: '🪨' }),
          new ColorTextureComponent({ primaryColor: '#64748b' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('sand', 'Areia', 'natural', ['ground', 'walkable'], [
          new EmojiIconComponent({ emoji: '🏖️' }),
          new ColorTextureComponent({ primaryColor: '#eab308' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('mud', 'Lama', 'natural', ['ground', 'walkable'], [
          new EmojiIconComponent({ emoji: '💩' }),
          new ColorTextureComponent({ primaryColor: '#713f12' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('snow', 'Neve', 'natural', ['ground', 'walkable'], [
          new EmojiIconComponent({ emoji: '❄️' }),
          new ColorTextureComponent({ primaryColor: '#f8fafc' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('gravel', 'Cascalho', 'natural', ['ground', 'walkable'], [
          new EmojiIconComponent({ emoji: '⚪' }),
          new ColorTextureComponent({ primaryColor: '#94a3b8' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('clay', 'Argila', 'natural', ['ground', 'walkable'], [
          new EmojiIconComponent({ emoji: '🧱' }),
          new ColorTextureComponent({ primaryColor: '#ca8a04' }),
          new SolidComponent({ solid: true }),
        ]),
        new BlockDefinition('water', 'Água', 'natural', ['liquid'], [
          new EmojiIconComponent({ emoji: '💧' }),
          new ColorTextureComponent({ primaryColor: '#38bdf8' }),
          new SolidComponent({ solid: false }),
        ]),
      ];
    }
    return blocks;
  }, []);

  // Filter blocks
  const filteredBlocks = useMemo(() => {
    return allBlocks.filter((b) => {
      if (onlyGround && !b.hasTag('ground') && !b.hasTag('walkable')) {
        return false;
      }
      if (activeCategory !== 'all' && b.category !== activeCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          b.id.toLowerCase().includes(query) ||
          b.name.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [allBlocks, activeCategory, onlyGround, searchTerm]);

  // Categories present
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allBlocks.forEach((b) => cats.add(b.category));
    return ['all', ...Array.from(cats)];
  }, [allBlocks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredBlocks.length} disponíveis
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por nome, id ou tag (ex: grass, terra, solid)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Categorias:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md transition-colors capitalize ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cat === 'all' ? 'Todas' : cat}
              </button>
            ))}

            <label className="ml-auto flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyGround}
                onChange={(e) => setOnlyGround(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
              />
              <span>Apenas Chão / Terreno</span>
            </label>
          </div>
        </div>

        {/* Grid of Blocks */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredBlocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const colorComp = block.colorTexture;
            const emojiComp = block.getComponent(EmojiIconComponent);
            const color = colorComp?.primaryColor || '#475569';
            const emoji = emojiComp?.emoji || '🧱';

            return (
              <button
                key={block.id}
                onClick={() => {
                  onSelectBlock(block.id);
                  onClose();
                }}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-md shrink-0 flex items-center justify-center border border-white/10 shadow-xs relative"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-xl select-none drop-shadow-sm">{emoji}</span>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-100 truncate">{block.name}</div>
                  <div className="text-xs font-mono text-slate-400 truncate">{block.id}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {block.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredBlocks.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm">
              Nenhum bloco encontrado para os filtros selecionados.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Clique em um bloco para selecioná-lo e aplicar na camada.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
