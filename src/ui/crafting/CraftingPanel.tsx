import { Hammer, Search, Sparkles, Wrench } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ItemStack } from '../../core/configuracao/types';
import { CraftingDatabase } from '../../gameplay/crafting/CraftingDatabase';
import { CraftingSystem } from '../../gameplay/crafting/CraftingSystem';
import { CraftingRecipe, RecipeCategory } from '../../gameplay/crafting/Recipe';
import { ItemDatabase } from '../../gameplay/itens/ItemDatabase';
import { ItemVisualRenderer } from '../itens/ItemVisualRenderer';

interface IntegratedCraftingProps {
  slots: (ItemStack | null)[];
  onCraft: (recipe: CraftingRecipe, multiplier?: number) => void;
  className?: string;
  maxHeight?: string;
}

/**
 * IntegratedCraftingSection:
 * The crafting station UI designed to be mounted directly inside the Inventory window.
 * Displays available recipes, ingredients counters, and handles instant crafting.
 */
export const IntegratedCraftingSection: React.FC<IntegratedCraftingProps> = ({
  slots,
  onCraft,
  className = '',
  maxHeight = 'max-h-[520px]',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyCraftable, setOnlyCraftable] = useState<boolean>(false);

  const allRecipes = useMemo(() => CraftingDatabase.getAll(), []);

  // Filter recipes according to active category, search text, and craftability
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => {
      if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = recipe.name.toLowerCase().includes(q);
        const matchesDesc = recipe.description.toLowerCase().includes(q);
        const matchesResult = recipe.result.type.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesResult) return false;
      }

      if (onlyCraftable) {
        const canMake = CraftingSystem.canCraft(recipe, slots);
        if (!canMake) return false;
      }

      return true;
    });
  }, [allRecipes, selectedCategory, searchQuery, onlyCraftable, slots]);

  const categories: { id: RecipeCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: '✨' },
    { id: 'tools', label: 'Ferramentas', icon: '🪓' },
    { id: 'materials', label: 'Materiais', icon: '🪵' },
    { id: 'nature', label: 'Natureza', icon: '🌱' },
    { id: 'food', label: 'Alimentos', icon: '🍓' },
  ];

  return (
    <div
      id="crafting-integrated-container"
      className={`flex flex-col h-full bg-zinc-950/60 rounded-xl border border-amber-500/25 overflow-hidden shadow-inner ${className}`}
    >
      {/* Station Subheader */}
      <div className="p-3 border-b border-white/10 bg-gradient-to-r from-amber-950/30 via-zinc-900/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Hammer className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 leading-none">
              Bancada de Criação
              <span className="text-[10px] text-amber-400 font-mono px-1.5 py-0.2 bg-amber-500/15 rounded border border-amber-500/25">
                {filteredRecipes.length}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Combine recursos para produzir itens
            </p>
          </div>
        </div>

        {/* Quick craftable toggle checkbox */}
        <label className="flex items-center gap-1.5 text-[10px] text-zinc-300 hover:text-white cursor-pointer select-none bg-zinc-900/80 px-2 py-1 rounded-md border border-white/10">
          <input
            type="checkbox"
            checked={onlyCraftable}
            onChange={(e) => setOnlyCraftable(e.target.checked)}
            className="rounded accent-amber-500 cursor-pointer w-3 h-3"
          />
          <span className="font-medium">Criáveis</span>
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 space-y-2 border-b border-white/5 bg-zinc-900/40">
        {/* Search field */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar receitas..."
            className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-zinc-900/90 border border-zinc-700/80 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recipes List (Scrollable) */}
      <div className={`flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar ${maxHeight}`}>
        {filteredRecipes.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-zinc-500">
            <Wrench className="w-8 h-8 mb-2 opacity-30 text-amber-400" />
            <p className="text-xs text-zinc-400 font-medium">
              Nenhuma receita encontrada.
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              Colete madeira, gravetos ou flores para criar itens!
            </p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const resultDef = ItemDatabase.getItem(recipe.result.type);
            const canCraft = CraftingSystem.canCraft(recipe, slots);
            const maxCraftable = CraftingSystem.getMaxCraftable(recipe, slots);

            return (
              <div
                key={recipe.id}
                id={`recipe-card-${recipe.id}`}
                className={`p-2 rounded-xl border transition-all ${
                  canCraft
                    ? 'bg-zinc-900/90 border-emerald-500/40 hover:border-emerald-400/80 shadow-sm'
                    : 'bg-zinc-900/40 border-white/5 opacity-70'
                }`}
              >
                {/* Result header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-lg border flex items-center justify-center shadow-sm relative flex-shrink-0"
                      style={{
                        backgroundColor: `${resultDef.accentColor}20`,
                        borderColor: `${resultDef.accentColor}55`,
                      }}
                    >
                      <ItemVisualRenderer itemDef={resultDef} size="sm" />
                      {recipe.result.count > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-zinc-950 text-amber-300 border border-amber-500/40 text-[8px] font-mono font-bold px-1 rounded-full leading-tight">
                          x{recipe.result.count}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100">
                          {recipe.name}
                        </span>
                        <span className="text-[8px] px-1 py-0.2 rounded font-mono bg-zinc-800 text-zinc-400">
                          {recipe.categoryName}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-snug line-clamp-1 mt-0.5">
                        {recipe.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ingredients Chips */}
                <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 font-semibold mr-0.5">
                    Materiais:
                  </span>
                  {recipe.ingredients.map((ing) => {
                    const ingDef = ItemDatabase.getItem(ing.type);
                    const current = CraftingSystem.getItemCount(slots, ing.type);
                    const hasEnough = current >= ing.count;

                    return (
                      <span
                        key={ing.type}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                          hasEnough
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950/40 border-red-500/30 text-red-300'
                        }`}
                        title={`${ingDef.nome || ingDef.name}: Você tem ${current}, precisa de ${ing.count}`}
                      >
                        <ItemVisualRenderer itemDef={ingDef} size="xs" />
                        <span className="font-semibold">
                          {current}/{ing.count}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {/* Craft Buttons */}
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  {canCraft && maxCraftable > 1 && (
                    <button
                      onClick={() => onCraft(recipe, maxCraftable)}
                      title={`Criar ${maxCraftable * recipe.result.count}x itens usando todos os materiais disponíveis`}
                      className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 text-[9px] font-semibold rounded-lg border border-white/10 transition cursor-pointer"
                    >
                      Criar Máx (x{maxCraftable})
                    </button>
                  )}

                  <button
                    onClick={() => onCraft(recipe, 1)}
                    disabled={!canCraft}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                      canCraft
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                        : 'bg-zinc-800/80 text-zinc-500 border border-white/5 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{canCraft ? 'Criar' : 'Faltam Recursos'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
