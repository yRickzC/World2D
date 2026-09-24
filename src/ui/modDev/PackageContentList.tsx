import React, { useState } from 'react';
import {
  Boxes,
  Copy,
  Edit,
  Layers,
  Plus,
  Search,
  Shield,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ModPackage } from '../../mods';

export type ContentType = 'block' | 'item' | 'entity' | 'biome' | 'surface';

export interface PackageContentListProps {
  pkg: ModPackage;
  type: ContentType;
  onEdit: (item: any) => void;
  onCreateNew: () => void;
  onDuplicate: (item: any) => void;
  onDelete: (itemId: string) => void;
}

export const PackageContentList: React.FC<PackageContentListProps> = ({
  pkg,
  type,
  onEdit,
  onCreateNew,
  onDuplicate,
  onDelete,
}) => {
  const [search, setSearch] = useState('');

  const isCore = pkg.isCore || pkg.manifest.id === 'core';

  const getItems = (): any[] => {
    switch (type) {
      case 'block':
        return pkg.content.blocks || [];
      case 'item':
        return pkg.content.items || [];
      case 'entity':
        return pkg.content.entities || [];
      case 'biome':
        return pkg.content.biomes || [];
      case 'surface':
        return pkg.content.surfaces || [];
      default:
        return [];
    }
  };

  const items = getItems();

  const filtered = items.filter((item) => {
    const id = (item.id || '').toLowerCase();
    const name = (item.name || item.nome || '').toLowerCase();
    const q = search.toLowerCase();
    return id.includes(q) || name.includes(q);
  });

  const typeLabels: Record<ContentType, { singular: string; plural: string; btn: string }> = {
    block: { singular: 'Bloco', plural: 'Blocos', btn: '+ NEW BLOCK' },
    item: { singular: 'Item', plural: 'Itens', btn: '+ NEW ITEM' },
    entity: { singular: 'Entidade', plural: 'Entidades', btn: '+ NEW ENTITY' },
    biome: { singular: 'Bioma', plural: 'Biomas', btn: '+ NEW BIOME' },
    surface: { singular: 'Superfície', plural: 'Superfícies', btn: '+ NEW SURFACE' },
  };

  const getVisualIcon = (item: any) => {
    if (type === 'block') {
      const emojiComp = (item.components || []).find((c: any) => c.type === 'EmojiIconComponent');
      if (emojiComp?.data?.emoji) return emojiComp.data.emoji;
      const colorComp = (item.components || []).find((c: any) => c.type === 'ColorTextureComponent');
      if (colorComp?.data?.primaryColor) {
        return (
          <span
            className="w-5 h-5 rounded border border-zinc-700 inline-block"
            style={{ backgroundColor: colorComp.data.primaryColor }}
          />
        );
      }
      return '🧱';
    }
    if (type === 'item') {
      const visComp = (item.componentes || []).find((c: any) => c.tipo === 'visual');
      if (visComp?.dados?.icone) return visComp.dados.icone;
      return item.icone || '📦';
    }
    if (type === 'entity') {
      const styleComp = (item.components || []).find((c: any) => c.type === 'StyleComponent');
      if (styleComp?.data?.value) return styleComp.data.value;
      return '👾';
    }
    if (type === 'biome') {
      return '🌲';
    }
    return '🗺️';
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              {typeLabels[type].plural} do Pacote
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {items.length} {typeLabels[type].plural}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Prefixo de namespace:{' '}
            <code className="text-amber-300 font-mono font-bold">
              {isCore ? 'core:' : `${pkg.manifest.id}:`}
            </code>
          </p>
        </div>

        <Button
          variant="primary"
          onClick={onCreateNew}
          icon={<Plus className="w-4 h-4" />}
        >
          {typeLabels[type].btn}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filtrar ${typeLabels[type].plural.toLowerCase()} por nome ou ID...`}
            className="w-full pl-9 text-xs"
          />
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          Exibindo {filtered.length} de {items.length}
        </span>
      </div>

      {/* Content Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <Layers className="w-8 h-8 mx-auto text-zinc-600" />
          <h3 className="text-sm font-bold text-zinc-300">
            Nenhum {typeLabels[type].singular.toLowerCase()} encontrado
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {search
              ? 'Nenhum resultado corresponde à busca.'
              : `Este mod ainda não possui ${typeLabels[type].plural.toLowerCase()} criados.`}
          </p>
          {!search && (
            <Button variant="primary" size="sm" onClick={onCreateNew}>
              {typeLabels[type].btn}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => {
            const displayName = item.name || item.nome || item.id;
            const fullId = item.id;
            const compCount =
              (item.components || item.componentes || []).length;
            const tags = item.tags || [];

            return (
              <div
                key={fullId}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 text-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
                        {getVisualIcon(item)}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-white text-sm truncate">
                          {displayName}
                        </h4>
                        <code className="text-[11px] font-mono text-amber-400 truncate block">
                          {fullId}
                        </code>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 flex-shrink-0">
                      {compCount} comp
                    </span>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {tags.slice(0, 4).map((t: string) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-850 text-[10px] font-mono text-zinc-400"
                        >
                          #{t}
                        </span>
                      ))}
                      {tags.length > 4 && (
                        <span className="text-[10px] text-zinc-500 font-mono self-center">
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-850">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDuplicate(item)}
                    icon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Duplicar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onEdit(item)}
                    icon={<Edit className="w-3.5 h-3.5" />}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(fullId)}
                    icon={<Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-rose-400" />}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
