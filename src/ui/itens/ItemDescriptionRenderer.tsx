import React from 'react';
import { ItemDefinition } from '../../gameplay/itens/ItemDefinition';
import { DescriptionComponent } from '../../gameplay/itens/componentes/DescriptionComponent';

interface ItemDescriptionRendererProps {
  itemDef: ItemDefinition;
  className?: string;
}

/**
 * ItemDescriptionRenderer:
 * Dynamic component-based description renderer.
 * Allows items to have rich, custom component-based descriptions,
 * flavor lore, and specific attributes.
 */
export const ItemDescriptionRenderer: React.FC<ItemDescriptionRendererProps> = ({
  itemDef,
  className = '',
}) => {
  const descComp = itemDef.getComponent(DescriptionComponent);

  if (!descComp) {
    return (
      <p className={`text-[11px] text-zinc-300 leading-snug ${className}`}>
        {itemDef.description}
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Primary Description */}
      <p className="text-[11px] text-zinc-200 leading-snug font-normal">
        {descComp.text}
      </p>

      {/* Detailed lore text if available */}
      {descComp.lore && (
        <p className="text-[10px] text-amber-300/80 italic leading-tight border-l border-amber-500/30 pl-2">
          &ldquo;{descComp.lore}&rdquo;
        </p>
      )}

      {/* Extended details */}
      {descComp.detailedText && (
        <p className="text-[10px] text-zinc-400 leading-tight">
          {descComp.detailedText}
        </p>
      )}

      {/* Custom Key-Value Attributes */}
      {descComp.customAttributes && Object.keys(descComp.customAttributes).length > 0 && (
        <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5 text-[9px] text-zinc-400 font-mono">
          {Object.entries(descComp.customAttributes).map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key}:</span>
              <span className="text-zinc-200">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
