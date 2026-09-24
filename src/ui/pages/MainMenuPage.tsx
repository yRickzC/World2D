import React from 'react';
import {
  Boxes,
  Code2,
  Compass,
  Layers,
  Package,
  Play,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { ItemSystem_db } from '../../gameplay/ItemSystem/ItemManager';
import { CORE_BLOCKS_DATA } from '../../gameplay/BlockSystem/data/blocks';
import { WorldStorage } from '../../gameplay/mundo/WorldStorage';
import { MenuLayout } from '../layouts/MenuLayout';

export interface MainMenuPageProps {
  onNavigateToWorlds: () => void;
  onNavigateToDev: () => void;
}

export const MainMenuPage: React.FC<MainMenuPageProps> = ({
  onNavigateToWorlds,
  onNavigateToDev,
}) => {
  const worldCount = React.useMemo(() => WorldStorage.getAll().length, []);
  const itemCount = React.useMemo(() => ItemSystem_db.getAll().length, []);
  const blockCount = CORE_BLOCKS_DATA.length;

  return (
    <MenuLayout maxWidth="2xl" showBrandingHeader={false}>
      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
        {/* Game Title & Brand */}
        <div className="mb-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-xl border border-amber-400/50 mb-5">
            <Compass className="w-9 h-9 stroke-[2.2]" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Mundo Aberto <span className="text-amber-400">2D</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-md">
            Sobrevivência, construção de blocos 2.5D e sistema de itens componentizado (ECS).
          </p>
        </div>

        {/* Primary Menu Options */}
        <div className="w-full max-w-md space-y-3.5 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Jogar / Mundos */}
          <button
            type="button"
            id="btn-menu-worlds"
            onClick={onNavigateToWorlds}
            className="w-full group p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-700/80 hover:border-amber-400/60 shadow-xl transition-all duration-150 flex items-center gap-4 text-left cursor-pointer active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Jogar / Mundos
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-amber-300">
                  {worldCount} {worldCount === 1 ? 'mundo' : 'mundos'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Crie novas seeds ou carregue mundos existentes
              </p>
            </div>
          </button>

          {/* MOD DEV */}
          <button
            type="button"
            id="btn-menu-dev"
            onClick={onNavigateToDev}
            className="w-full group p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-700/80 hover:border-amber-400/60 shadow-xl transition-all duration-150 flex items-center gap-4 text-left cursor-pointer active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 group-hover:text-amber-300 group-hover:border-amber-500/50 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  MOD DEV
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500/30">
                  Mod Packages & Core
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Criação, edição e gerenciamento de mods e conteúdo Core
              </p>
            </div>
          </button>
        </div>

        {/* Quick info bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>{itemCount} Items Registrados</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>{blockCount} Blocos Core</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Geração Procedural 2D</span>
          </div>
        </div>
      </div>
    </MenuLayout>
  );
};
