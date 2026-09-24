import React, { useState } from 'react';
import { Hash, Plus, Search, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { globalModManager, ModPackage } from '../../mods';

export interface TagsTabProps {
  pkg: ModPackage;
}

export const TagsTab: React.FC<TagsTabProps> = ({ pkg }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const isCore = pkg.isCore || pkg.manifest.id === 'core';
  const tagsList = pkg.content.tags || [];

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const cleanTag = newTag.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (tagsList.includes(cleanTag)) return;

    const updated = [...tagsList, cleanTag];
    pkg.content.tags = updated;
    if (isCore) {
      globalModManager.updateModManifest('core', {});
    } else {
      globalModManager.updateModManifest(pkg.manifest.id, {});
    }
    setNewTag('');
    setSelectedTag(cleanTag);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isCore) return;
    pkg.content.tags = tagsList.filter((t) => t !== tagToRemove);
    globalModManager.updateModManifest(pkg.manifest.id, {});
    if (selectedTag === tagToRemove) setSelectedTag(null);
  };

  const filteredTags = tagsList.filter((t) =>
    t.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find objects in package using selectedTag
  const usageBlocks = (pkg.content.blocks || []).filter((b: any) =>
    (b.tags || []).includes(selectedTag)
  );
  const usageItems = (pkg.content.items || []).filter((i: any) =>
    (i.tags || []).includes(selectedTag)
  );
  const usageEntities = (pkg.content.entities || []).filter((e: any) =>
    (e.tags || []).includes(selectedTag)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Sistema de Tags e Classificações</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {tagsList.length} Tags Ativas
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tags permitem que blocos, itens e entidades sejam categorizados para lógica de quebra, crafting e biomas.
          </p>
        </div>

        {!isCore && (
          <div className="flex items-center gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="nova_tag..."
              className="font-mono text-xs w-36"
            />
            <Button variant="primary" size="sm" onClick={handleAddTag} icon={<Plus className="w-3.5 h-3.5" />}>
              Adicionar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tags List */}
        <div className="md:col-span-1 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar tags..."
              className="w-full pl-9 text-xs"
            />
          </div>

          <div className="p-2 rounded-2xl bg-zinc-900/60 border border-zinc-800 max-h-[500px] overflow-y-auto space-y-1">
            {filteredTags.map((tag) => (
              <div
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-mono transition-colors ${
                  selectedTag === tag
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-850'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Hash className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate">{tag}</span>
                </div>

                {!isCore && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-900"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Tag Usage */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          {selectedTag ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-mono">#{selectedTag}</h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {usageBlocks.length + usageItems.length + usageEntities.length} ocorrência(s) neste pacote
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Blocks using tag */}
                <div>
                  <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-2">
                    Blocos ({usageBlocks.length})
                  </h4>
                  {usageBlocks.length === 0 ? (
                    <p className="text-zinc-500 text-[11px]">Nenhum bloco possui esta tag.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {usageBlocks.map((b: any) => (
                        <div
                          key={b.id}
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200"
                        >
                          {b.name || b.id}
                          <span className="block text-[10px] text-zinc-500">{b.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items using tag */}
                <div>
                  <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-2">
                    Itens ({usageItems.length})
                  </h4>
                  {usageItems.length === 0 ? (
                    <p className="text-zinc-500 text-[11px]">Nenhum item possui esta tag.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {usageItems.map((i: any) => (
                        <div
                          key={i.id}
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200"
                        >
                          {i.nome || i.name || i.id}
                          <span className="block text-[10px] text-zinc-500">{i.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Entities using tag */}
                <div>
                  <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-2">
                    Entidades ({usageEntities.length})
                  </h4>
                  {usageEntities.length === 0 ? (
                    <p className="text-zinc-500 text-[11px]">Nenhuma entidade possui esta tag.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {usageEntities.map((e: any) => (
                        <div
                          key={e.id}
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200"
                        >
                          {e.name || e.id}
                          <span className="block text-[10px] text-zinc-500">{e.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-zinc-500 text-xs">
              <Hash className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-50" />
              Selecione uma tag ao lado para inspecionar seus vínculos e utilidades.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
