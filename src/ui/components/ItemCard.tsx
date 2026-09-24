import React from 'react';
import { Box, Code2, Edit3, Layers, Sparkles } from 'lucide-react';
import { ItemDefinition } from '../../gameplay/ItemSystem/ItemDefinition';
import { Button } from './Button';

export interface ItemCardProps {
  item: ItemDefinition;
  onEdit: (item: ItemDefinition) => void;
  onInspect?: (item: ItemDefinition) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onInspect }) => {
  const json = item.toJSON();
  const components = item.getAllComponents();

  // Extract visual representation
  const visualComp = components.find((c) => c.type === 'VisualComponent');
  const visualEmoji = visualComp?.data?.source || '📦';
  const accentColor = visualComp?.data?.accentColor || '#38bdf8';

  // Extract rarity if present
  const rarityComp = components.find((c) => c.type === 'RarityComponent');
  const rarityName = rarityComp?.data?.rarity || 'Comum';

  const rarityColorClass = {
    Comum: 'text-zinc-300 bg-zinc-800 border-zinc-700',
    Incomum: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60',
    Raro: 'text-sky-300 bg-sky-950/60 border-sky-700/60',
    Épico: 'text-purple-300 bg-purple-950/60 border-purple-700/60',
    Lendário: 'text-amber-300 bg-amber-950/60 border-amber-700/60',
  }[rarityName] || 'text-zinc-300 bg-zinc-800 border-zinc-700';

  return (
    <div
      id={`item-card-${item.id}`}
      className="group relative bg-zinc-900/90 hover:bg-zinc-850/90 border border-zinc-800 hover:border-zinc-700/90 rounded-2xl p-4 shadow-md transition-all duration-150 flex flex-col justify-between gap-3 select-none"
    >
      <div className="flex items-start gap-3.5">
        {/* Visual Box */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-inner transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${accentColor}18`,
            borderColor: `${accentColor}50`,
          }}
        >
          {visualEmoji}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-bold text-white tracking-wide truncate group-hover:text-amber-400 transition-colors">
              {item.nome}
            </h4>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${rarityColorClass}`}
            >
              {rarityName}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[11px] text-zinc-400 truncate">id: {item.id}</span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              {item.categoria}
            </span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-zinc-500" />
              <span>{components.length} comps</span>
            </span>
          </div>
        </div>
      </div>

      {/* Component tags preview */}
      <div className="flex items-center gap-1 flex-wrap overflow-hidden h-5">
        {components.slice(0, 3).map((comp) => (
          <span
            key={comp.id}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800 truncate max-w-[110px]"
            title={comp.type}
          >
            {comp.type.replace('Component', '')}
          </span>
        ))}
        {components.length > 3 && (
          <span className="text-[9px] text-zinc-500 font-mono">+{components.length - 3}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
        {onInspect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInspect(item)}
            icon={<Code2 className="w-3.5 h-3.5 text-zinc-400" />}
            title="Inspecionar JSON"
          >
            JSON
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(item)}
          icon={<Edit3 className="w-3.5 h-3.5 text-amber-400" />}
        >
          Editar Item
        </Button>
      </div>
    </div>
  );
};
