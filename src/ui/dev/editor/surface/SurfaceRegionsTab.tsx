import React from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Surface } from '../../../../gameplay/mundo/superficie/Surface';
import { WorldRegionComponent } from '../../../../gameplay/mundo/componentes/WorldRegionComponent';

export interface SurfaceRegionsTabProps {
  surface: Surface;
  onChange: () => void;
}

export const SurfaceRegionsTab: React.FC<SurfaceRegionsTabProps> = ({ surface, onChange }) => {
  let regComp = surface.getComponent('WorldRegionComponent') as WorldRegionComponent | undefined;
  if (!regComp) {
    regComp = new WorldRegionComponent();
    surface.addComponent(regComp);
  }

  const regions = regComp.data.regions;

  const handleAddRegion = () => {
    const newId = `region_${Date.now().toString(36).slice(-4)}`;
    regComp.addRegion({
      id: newId,
      name: 'Nova Região Climática',
      area: { x: 50, y: 50, width: 200, height: 150 },
      tags: ['custom_region'],
      climateOverride: {
        forceFog: true,
        fogDensity: 0.65,
        forceRain: false,
      },
    });
    onChange();
  };

  const handleRemoveRegion = (id: string) => {
    regComp.removeRegion(id);
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              Regiões Geográficas e Overrides Climáticos ({regions.length})
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina microclimas locais com prioridade hierárquica sobre o bioma e a superfície.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRegion}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Região</span>
          </button>
        </div>

        <div className="space-y-3">
          {regions.map((reg) => (
            <div
              key={reg.id}
              className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{reg.name}</span>
                  <span className="font-mono text-slate-500 text-[10px]">({reg.id})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(reg.id)}
                  className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Nome</label>
                  <input
                    type="text"
                    value={reg.name}
                    onChange={(e) => {
                      reg.name = e.target.value;
                      onChange();
                    }}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Forçar Chuva</label>
                  <label className="flex items-center gap-1.5 text-slate-300 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reg.climateOverride.forceRain ?? false}
                      onChange={(e) => {
                        reg.climateOverride.forceRain = e.target.checked;
                        if (e.target.checked && reg.climateOverride.rainIntensity === undefined) {
                          reg.climateOverride.rainIntensity = 0.8;
                        }
                        onChange();
                      }}
                      className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
                    />
                    <span>Chuva Ativa</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Forçar Neblina</label>
                  <label className="flex items-center gap-1.5 text-slate-300 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reg.climateOverride.forceFog ?? false}
                      onChange={(e) => {
                        reg.climateOverride.forceFog = e.target.checked;
                        if (e.target.checked && reg.climateOverride.fogDensity === undefined) {
                          reg.climateOverride.fogDensity = 0.7;
                        }
                        onChange();
                      }}
                      className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
                    />
                    <span>Neblina Ativa</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    Offset Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={reg.climateOverride.temperatureOffset ?? 0}
                    onChange={(e) => {
                      reg.climateOverride.temperatureOffset = parseInt(e.target.value, 10) || 0;
                      onChange();
                    }}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}

          {regions.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-4">
              Nenhuma região customizada criada para esta superfície.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
