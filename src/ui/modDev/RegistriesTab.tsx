import React, { useState } from 'react';
import {
  Boxes,
  Database,
  Layers,
  Search,
  Shield,
  Tag as TagIcon,
  Workflow,
} from 'lucide-react';
import { Input } from '../components/Input';
import { globalModRegistries } from '../../mods';

export const RegistriesTab: React.FC = () => {
  const [activeSub, setActiveSub] = useState<'blocks' | 'items' | 'entities' | 'biomes' | 'surfaces' | 'recipes' | 'tags'>('blocks');
  const [search, setSearch] = useState('');

  const summary = globalModRegistries.getSummary();

  const getEntries = () => {
    switch (activeSub) {
      case 'blocks':
        return globalModRegistries.blocks.getAll();
      case 'items':
        return globalModRegistries.items.getAll();
      case 'entities':
        return globalModRegistries.entities.getAll();
      case 'biomes':
        return globalModRegistries.biomes.getAll();
      case 'surfaces':
        return globalModRegistries.surfaces.getAll();
      case 'recipes':
        return globalModRegistries.recipes.getAll();
      case 'tags':
        return globalModRegistries.tags.getAll();
      default:
        return [];
    }
  };

  const entries = getEntries();
  const filtered = entries.filter(
    (e) =>
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.namespace.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Registries Architecture Header */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Hub de Registries Unificados</h2>
              <p className="text-xs text-zinc-400">
                Gerenciador central de definições com suporte a namespaces, provenance de mods e patches.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Registries Ativos
          </span>
        </div>

        {/* Pipeline Visualizer */}
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
          <span className="text-amber-400 font-semibold">CORE</span>
          <span>➔</span>
          <span className="text-zinc-300">Init Registries</span>
          <span>➔</span>
          <span className="text-zinc-300">Register Core</span>
          <span>➔</span>
          <span className="text-sky-400 font-semibold">Load Mods</span>
          <span>➔</span>
          <span className="text-zinc-300">Register Mod Content</span>
          <span>➔</span>
          <span className="text-emerald-400 font-semibold">Validated DBs</span>
        </div>
      </div>

      {/* Sub-Registries Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { id: 'blocks', label: 'BlockRegistry', count: summary.blocks },
          { id: 'items', label: 'ItemRegistry', count: summary.items },
          { id: 'entities', label: 'EntityRegistry', count: summary.entities },
          { id: 'biomes', label: 'BiomeRegistry', count: summary.biomes },
          { id: 'surfaces', label: 'SurfaceRegistry', count: summary.surfaces },
          { id: 'recipes', label: 'RecipeRegistry', count: summary.recipes },
          { id: 'tags', label: 'TagRegistry', count: summary.tags },
        ].map((sub) => (
          <button
            key={sub.id}
            type="button"
            onClick={() => {
              setActiveSub(sub.id as any);
              setSearch('');
            }}
            className={`p-3 rounded-xl border text-left transition-colors ${
              activeSub === sub.id
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="text-[11px] font-semibold truncate">{sub.label}</div>
            <div className="text-lg font-bold font-mono mt-1 text-white">{sub.count}</div>
          </button>
        ))}
      </div>

      {/* Entries Table */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filtrar ${activeSub} por ID, nome ou namespace...`}
              className="w-full pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {filtered.length} entrada(s)
          </span>
        </div>

        <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Identificador Completo</th>
                <th className="py-2.5 px-3">Nome</th>
                <th className="py-2.5 px-3">Namespace</th>
                <th className="py-2.5 px-3">Origem</th>
                <th className="py-2.5 px-3 text-right">Patches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-amber-300">
                    {e.id}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-200">{e.name}</td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">
                      {e.namespace}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {e.isCore ? (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Core
                      </span>
                    ) : (
                      <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                        <Boxes className="w-3 h-3" /> {e.packageId}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-500">
                    {e.patchedBy && e.patchedBy.length > 0 ? (
                      <span className="text-emerald-400 text-[10px]">
                        +{e.patchedBy.length} patch(es)
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
