import React from 'react';
import { ItemStack } from '../../core/configuracao/types';
import {
  BreakComponent,
  ConsumableComponent,
  ToolComponent,
} from '../../gameplay/itens/componentes';
import { getItemDef } from '../../gameplay/inventario/items/ItemDefinitions';
import { ItemDescriptionRenderer } from '../itens/ItemDescriptionRenderer';
import { ItemVisualRenderer } from '../itens/ItemVisualRenderer';

interface ItemTooltipProps {
  item: ItemStack;
  showShortcuts?: boolean;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, showShortcuts = true }) => {
  const def = getItemDef(item.type);

  const breakComp = def.getComponent(BreakComponent);
  const toolComp = def.getComponent(ToolComponent);
  const consumableComp = def.getComponent(ConsumableComponent);

  return (
    <div className="flex flex-col gap-1.5 p-2.5 max-w-[250px] text-left">
      {/* Header: Name & Category Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
        <span className="font-bold text-sm text-white flex items-center gap-1.5 drop-shadow-sm">
          <ItemVisualRenderer itemDef={def} size="sm" />
          <span>{def.nome || def.name}</span>
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${def.accentColor}33`, color: '#fff' }}
        >
          {def.categoryName}
        </span>
      </div>

      {/* Component-based Description */}
      <ItemDescriptionRenderer itemDef={def} />

      {/* Tool Component Stats */}
      {breakComp && (
        <div className="flex flex-col gap-1 bg-white/5 p-1.5 rounded border border-white/10 text-[10px]">
          <div className="flex justify-between text-amber-300 font-semibold">
            <span>Ferramenta: {breakComp.toolTag}</span>
            <span>Força: {breakComp.strength}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Dano: +{breakComp.damage}</span>
            <span>Velocidade: {breakComp.speed}x</span>
          </div>
          {toolComp && (
            <div className="flex justify-between text-zinc-400 pt-0.5 border-t border-white/10">
              <span>Durabilidade:</span>
              <span className="font-mono text-zinc-200">{toolComp.durability}/{toolComp.maxDurability}</span>
            </div>
          )}
        </div>
      )}

      {/* Consumable Component */}
      {consumableComp && (
        <div className="flex items-center justify-between text-[10px] bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-1 rounded text-emerald-400 font-semibold">
          <span>{consumableComp.prompt}</span>
          <span>+{consumableComp.energyRestored} ⚡</span>
        </div>
      )}

      {/* Stack & Usage Info */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5 border-t border-white/10">
        <span>Stack Máx:</span>
        <span className="font-mono text-zinc-200 font-semibold">
          {item.count} / {def.maxStack}
        </span>
      </div>

      {/* Minecraft-like Shortcut hints */}
      {showShortcuts && (
        <div className="text-[9px] text-zinc-400/90 pt-1 border-t border-white/10 flex flex-col gap-0.5">
          <div>
            <span className="text-zinc-200 font-mono font-bold">Esq:</span> Mover tudo
          </div>
          <div>
            <span className="text-zinc-200 font-mono font-bold">Dir:</span> Metade / 1 item
          </div>
          <div>
            <span className="text-zinc-200 font-mono font-bold">Shift+Esq:</span> Mover rápido
          </div>
        </div>
      )}
    </div>
  );
};
