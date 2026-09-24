import React from 'react';
import { Box, Code2, Edit3, Layers, ShieldAlert, Sparkles, Wrench } from 'lucide-react';
import { BlockDefinition } from '../../gameplay/BlockSystem/BlockDefinition';
import { Button } from './Button';

export interface BlockCardProps {
  block: BlockDefinition;
  onEdit: (block: BlockDefinition) => void;
  onInspect?: (block: BlockDefinition) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({ block, onEdit, onInspect }) => {
  const json = block.toJSON();
  const components = block.getAllComponents();

  // Extract visual representations
  const emoji = block.emojiIcon || '🧱';
  const colorComp = block.colorTexture;
  const topComp = block.topTexture;
  const sideComp = block.sideTexture;
  const bgColor = topComp?.primaryColor || colorComp?.primaryColor || '#27272a';
  const sideColor = sideComp?.primaryColor || colorComp?.secondaryColor || '#18181b';

  // Extract physics & breaking
  const isSolid = block.isSolid;
  const isFluid = block.isFluid;
  const breakComp = components.find((c) => c.type === 'BreakableComponent');
  const hardness = breakComp?.data?.hardness ?? 1;
  const requiredTool = breakComp?.data?.requiredToolTag;

  // Category styling
  const categoryColorClass: Record<string, string> = {
    natural: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    building: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
    liquid: 'text-sky-400 bg-sky-950/60 border-sky-800/60',
    utility: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
    decoration: 'text-pink-400 bg-pink-950/60 border-pink-800/60',
    ore: 'text-yellow-400 bg-yellow-950/60 border-yellow-800/60',
  };

  const badgeClass =
    categoryColorClass[block.category] || 'text-zinc-300 bg-zinc-800 border-zinc-700';

  return (
    <div
      id={`block-card-${block.id}`}
      className="group relative bg-zinc-900/90 hover:bg-zinc-850/90 border border-zinc-800 hover:border-zinc-700/90 rounded-2xl p-4 shadow-md transition-all duration-150 flex flex-col justify-between gap-3 select-none"
    >
      <div className="flex items-start gap-3.5">
        {/* Visual Box simulating block ground & top */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-inner transition-transform group-hover:scale-105 relative overflow-hidden"
          style={{
            backgroundColor: bgColor,
            borderColor: `${bgColor}80`,
          }}
        >
          {/* Subtle side bevel */}
          <div
            className="absolute bottom-0 left-0 right-0 h-3 opacity-60 pointer-events-none"
            style={{ backgroundColor: sideColor }}
          />
          <span className="relative z-10 filter drop-shadow">{emoji}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-bold text-white tracking-wide truncate group-hover:text-amber-400 transition-colors">
              {block.name}
            </h4>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badgeClass}`}>
              {block.category}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-[11px] text-zinc-400 truncate">id: {block.id}</span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px]">
            {isSolid && (
              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700/60">
                Sólido
              </span>
            )}
            {isFluid && (
              <span className="px-1.5 py-0.2 rounded bg-sky-950/60 text-sky-400 border border-sky-800/60 font-semibold">
                Fluido
              </span>
            )}
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
              Dureza: {hardness}
            </span>
            {requiredTool && (
              <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 font-semibold flex items-center gap-0.5">
                <Wrench className="w-2.5 h-2.5" />
                <span>{requiredTool}</span>
              </span>
            )}
            <span className="text-zinc-500 flex items-center gap-1">
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
            onClick={() => onInspect(block)}
            icon={<Code2 className="w-3.5 h-3.5 text-zinc-400" />}
            title="Inspecionar JSON do Bloco"
          >
            JSON
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(block)}
          icon={<Edit3 className="w-3.5 h-3.5 text-amber-400" />}
        >
          Editar Bloco
        </Button>
      </div>
    </div>
  );
};
