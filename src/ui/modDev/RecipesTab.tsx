import React, { useState } from 'react';
import { Hammer, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { globalModManager, ModPackage } from '../../mods';

export interface RecipesTabProps {
  pkg: ModPackage;
}

export const RecipesTab: React.FC<RecipesTabProps> = ({ pkg }) => {
  const [recipeName, setRecipeName] = useState('');
  const [resultItem, setResultItem] = useState('');
  const [resultCount, setResultCount] = useState(1);
  const [ingredientItem, setIngredientItem] = useState('');
  const [ingredientCount, setIngredientCount] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  const isCore = pkg.isCore || pkg.manifest.id === 'core';
  const recipes = pkg.content.recipes || [];

  const handleAddRecipe = () => {
    if (!recipeName.trim() || !resultItem.trim() || !ingredientItem.trim()) return;

    const modPrefix = isCore ? 'core:' : `${pkg.manifest.id}:`;
    const cleanId = `${modPrefix}recipe_${Date.now()}`;
    const newRecipe = {
      id: cleanId,
      name: recipeName.trim(),
      description: `Fabrica ${resultCount}x ${resultItem}`,
      category: 'materials',
      categoryName: 'Materiais',
      result: {
        type: resultItem.trim(),
        count: resultCount,
      },
      ingredients: [
        {
          type: ingredientItem.trim(),
          count: ingredientCount,
        },
      ],
    };

    pkg.content.recipes = [...recipes, newRecipe];
    globalModManager.updateModManifest(pkg.manifest.id, {});
    setRecipeName('');
    setResultItem('');
    setIngredientItem('');
    setShowAddForm(false);
  };

  const handleDeleteRecipe = (id: string) => {
    pkg.content.recipes = recipes.filter((r: any) => r.id !== id);
    globalModManager.updateModManifest(pkg.manifest.id, {});
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Receitas de Crafting do Pacote</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {recipes.length} Receitas
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Receitas de fabricação registradas neste pacote. Podem combinar itens do Core e itens do Mod.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          {showAddForm ? 'Cancelar' : 'Nova Receita'}
        </Button>
      </div>

      {/* Add Recipe Form */}
      {showAddForm && (
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-amber-500/30 space-y-4 text-xs">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-400" /> Adicionar Receita
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Nome da Receita</label>
              <Input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Ex: Bloco de Cristal"
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Item Resultado (ID)</label>
              <Input
                value={resultItem}
                onChange={(e) => setResultItem(e.target.value)}
                placeholder="ex: nature_mod:crystal_block"
                className="w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Qtd Resultado</label>
              <Input
                type="number"
                value={resultCount}
                onChange={(e) => setResultCount(Number(e.target.value) || 1)}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Ingrediente Necessário (ID)</label>
              <Input
                value={ingredientItem}
                onChange={(e) => setIngredientItem(e.target.value)}
                placeholder="ex: nature_mod:crystal_shard"
                className="w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Qtd Ingrediente</label>
              <Input
                type="number"
                value={ingredientCount}
                onChange={(e) => setIngredientCount(Number(e.target.value) || 1)}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={handleAddRecipe}>
              Salvar Receita
            </Button>
          </div>
        </div>
      )}

      {/* Recipes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map((r: any) => (
          <div
            key={r.id}
            className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-3 text-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{r.name}</h4>
                <button
                  type="button"
                  onClick={() => handleDeleteRecipe(r.id)}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-zinc-400 text-[11px] mt-1">{r.description}</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between font-mono text-[11px]">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase">Ingredientes:</span>
                {(r.ingredients || []).map((ing: any, i: number) => (
                  <span key={i} className="text-zinc-300 block">
                    {ing.count}x {ing.type}
                  </span>
                ))}
              </div>
              <span className="text-zinc-500">➜</span>
              <div className="text-right">
                <span className="text-zinc-500 block text-[9px] uppercase">Resultado:</span>
                <span className="text-amber-400 font-bold block">
                  {r.result?.count}x {r.result?.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
