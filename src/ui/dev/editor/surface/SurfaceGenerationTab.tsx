import React from 'react';
import { Mountain, Sliders, Waves, TreePine } from 'lucide-react';
import { Surface } from '../../../../gameplay/mundo/superficie/Surface';
import { WorldGenerationComponent } from '../../../../gameplay/mundo/componentes/WorldGenerationComponent';

export interface SurfaceGenerationTabProps {
  surface: Surface;
  onChange: () => void;
}

export const SurfaceGenerationTab: React.FC<SurfaceGenerationTabProps> = ({ surface, onChange }) => {
  let genComp = surface.getComponent('WorldGenerationComponent') as WorldGenerationComponent | undefined;
  if (!genComp) {
    genComp = new WorldGenerationComponent();
    surface.addComponent(genComp);
  }

  const d = genComp.data;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Mountain className="w-4 h-4 text-emerald-400" />
          Geração Procedural de Terreno da Superfície ({surface.name})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Mundo</label>
            <select
              value={d.worldType}
              onChange={(e) => {
                d.worldType = e.target.value as any;
                onChange();
              }}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none"
            >
              <option value="infinite">Infinito (Infinite Procedural)</option>
              <option value="island">Ilha (Island)</option>
              <option value="flat">Plano (Flat)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Escala de Terreno ({d.terrainScale})
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={Math.round(d.terrainScale * 1000)}
              onChange={(e) => {
                d.terrainScale = (parseInt(e.target.value, 10) || 1) / 1000;
                onChange();
              }}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <TreePine className="w-3.5 h-3.5 text-green-400" /> Densidade de Folhagem (
              {Math.round(d.foliageDensity * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={200}
              value={Math.round(d.foliageDensity * 100)}
              onChange={(e) => {
                d.foliageDensity = (parseInt(e.target.value, 10) || 0) / 100;
                onChange();
              }}
              className="w-full accent-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Waves className="w-3.5 h-3.5 text-blue-400" /> Nível do Mar ({Math.round(d.seaLevelThreshold * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={80}
              value={Math.round(d.seaLevelThreshold * 100)}
              onChange={(e) => {
                d.seaLevelThreshold = (parseInt(e.target.value, 10) || 0) / 100;
                onChange();
              }}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Limite de Praia ({Math.round(d.beachThreshold * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={90}
              value={Math.round(d.beachThreshold * 100)}
              onChange={(e) => {
                d.beachThreshold = (parseInt(e.target.value, 10) || 0) / 100;
                onChange();
              }}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Limite de Floresta ({Math.round(d.forestThreshold * 100)}%)
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(d.forestThreshold * 100)}
              onChange={(e) => {
                d.forestThreshold = (parseInt(e.target.value, 10) || 10) / 100;
                onChange();
              }}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Raio de Chunks Iniciais ({d.spawnChunkRadius})
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={d.spawnChunkRadius}
              onChange={(e) => {
                d.spawnChunkRadius = Math.max(1, parseInt(e.target.value, 10) || 1);
                onChange();
              }}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={d.enableCaves}
                onChange={(e) => {
                  d.enableCaves = e.target.checked;
                  onChange();
                }}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Gerar Cavernas Subterrâneas</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
