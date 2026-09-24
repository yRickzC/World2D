import { Hammer, Menu } from 'lucide-react';
import React from 'react';
import { ItemType } from '../../core/configuracao/types';

export interface NearbyInteractableInfo {
  prompt: string;
  action: 'chop' | 'harvest';
  itemType: ItemType;
  entityId: string;
}

interface GameHUDProps {
  onOpenMenu: () => void;
  onToggleCrafting?: () => void;
  isCraftingOpen?: boolean;
}

/**
 * 100% PC Focused Clean HUD
 * Minimalist top controls with quick access to Menu and Crafting.
 */
export const GameHUD: React.FC<GameHUDProps> = ({
  onOpenMenu,
  onToggleCrafting,
  isCraftingOpen = false,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-5 select-none">
      {/* Top Bar: Clean Menu & Crafting Buttons */}
      <div className="flex items-center justify-start gap-2.5 pointer-events-auto">
        <button
          id="btn-open-game-menu"
          onClick={onOpenMenu}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 backdrop-blur-md text-white border border-zinc-700/80 text-xs font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:scale-105 transition-all cursor-pointer group"
          title="Abrir Menu com Controles, Dados do Mundo e Administração [ESC]"
        >
          <Menu className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform duration-200" />
          <span className="tracking-wide">Menu</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 rounded text-zinc-300 border border-zinc-700">
            ESC
          </kbd>
        </button>

        {onToggleCrafting && (
          <button
            id="btn-open-crafting"
            onClick={onToggleCrafting}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md border text-xs font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:scale-105 transition-all cursor-pointer ${
              isCraftingOpen
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-zinc-900/80 hover:bg-zinc-900 text-white border-zinc-700/80'
            }`}
            title="Abrir Lista de Crafting [C]"
          >
            <Hammer className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide">Crafting</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 rounded text-zinc-300 border border-zinc-700">
              C
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
};
