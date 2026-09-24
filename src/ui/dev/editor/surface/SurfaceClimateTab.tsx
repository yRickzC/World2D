import React from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, Droplets, Thermometer, Wind } from 'lucide-react';
import { Surface } from '../../../../gameplay/mundo/superficie/Surface';
import { WorldClimateComponent } from '../../../../gameplay/mundo/componentes/WorldClimateComponent';

export interface SurfaceClimateTabProps {
  surface: Surface;
  onChange: () => void;
}

export const SurfaceClimateTab: React.FC<SurfaceClimateTabProps> = ({ surface, onChange }) => {
  let climateComp = surface.getComponent('WorldClimateComponent') as WorldClimateComponent | undefined;
  if (!climateComp) {
    climateComp = new WorldClimateComponent();
    surface.addComponent(climateComp);
  }

  const rain = climateComp.data.rain;
  const fog = climateComp.data.fog;

  return (
    <div className="space-y-6">
      {/* Surface Climate Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cloud className="w-4 h-4 text-sky-400" />
          Clima Global da Superfície ({surface.name})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Temperatura Base (
              {climateComp.data.baseTemperature}°C)
            </label>
            <input
              type="range"
              min={-30}
              max={60}
              value={climateComp.data.baseTemperature}
              onChange={(e) => {
                climateComp.data.baseTemperature = parseInt(e.target.value, 10) || 0;
                onChange();
              }}
              className="w-full accent-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-400" /> Umidade Base (
              {Math.round(climateComp.data.baseHumidity * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(climateComp.data.baseHumidity * 100)}
              onChange={(e) => {
                climateComp.data.baseHumidity = (parseInt(e.target.value, 10) || 0) / 100;
                onChange();
              }}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-teal-400" /> Vento Base (
              {Math.round(climateComp.data.globalWind * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(climateComp.data.globalWind * 100)}
              onChange={(e) => {
                climateComp.data.globalWind = (parseInt(e.target.value, 10) || 0) / 100;
                onChange();
              }}
              className="w-full accent-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Surface Rain System */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-400" />
            Sistema de Chuva da Superfície
          </h4>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={rain.enabled}
              onChange={(e) => {
                rain.enabled = e.target.checked;
                onChange();
              }}
              className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0"
            />
            <span className={rain.enabled ? 'text-blue-300' : 'text-slate-500'}>
              {rain.enabled ? 'Chuva Ativa nesta Superfície' : 'Superfície Sem Chuva (Seca/Vácuo)'}
            </span>
          </label>
        </div>

        {rain.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Chance de Ocorrência ({Math.round(rain.chance * 100)}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={Math.round(rain.chance * 100)}
                onChange={(e) => {
                  rain.chance = (parseInt(e.target.value, 10) || 1) / 100;
                  onChange();
                }}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Intensidade ({Math.round(rain.intensity * 100)}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={Math.round(rain.intensity * 100)}
                onChange={(e) => {
                  rain.intensity = (parseInt(e.target.value, 10) || 1) / 100;
                  onChange();
                }}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Duração Mínima ({rain.durationMin}s)
              </label>
              <input
                type="number"
                min={5}
                max={600}
                value={rain.durationMin}
                onChange={(e) => {
                  rain.durationMin = Math.max(5, parseInt(e.target.value, 10) || 5);
                  onChange();
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Duração Máxima ({rain.durationMax}s)
              </label>
              <input
                type="number"
                min={rain.durationMin}
                max={1200}
                value={rain.durationMax}
                onChange={(e) => {
                  rain.durationMax = Math.max(rain.durationMin, parseInt(e.target.value, 10) || 30);
                  onChange();
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Surface Fog System */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <CloudFog className="w-4 h-4 text-slate-400" />
            Sistema de Neblina da Superfície
          </h4>
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={fog.enabled}
              onChange={(e) => {
                fog.enabled = e.target.checked;
                onChange();
              }}
              className="rounded border-slate-700 bg-slate-950 text-slate-400 focus:ring-0"
            />
            <span className={fog.enabled ? 'text-slate-300' : 'text-slate-500'}>
              {fog.enabled ? 'Neblina Ativa' : 'Sem Neblina'}
            </span>
          </label>
        </div>

        {fog.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Chance de Ocorrência ({Math.round(fog.chance * 100)}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={Math.round(fog.chance * 100)}
                onChange={(e) => {
                  fog.chance = (parseInt(e.target.value, 10) || 1) / 100;
                  onChange();
                }}
                className="w-full accent-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Densidade ({Math.round(fog.intensity * 100)}%)
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={Math.round(fog.intensity * 100)}
                onChange={(e) => {
                  fog.intensity = (parseInt(e.target.value, 10) || 1) / 100;
                  onChange();
                }}
                className="w-full accent-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Duração Mínima ({fog.durationMin}s)
              </label>
              <input
                type="number"
                min={10}
                max={600}
                value={fog.durationMin}
                onChange={(e) => {
                  fog.durationMin = Math.max(10, parseInt(e.target.value, 10) || 10);
                  onChange();
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Duração Máxima ({fog.durationMax}s)
              </label>
              <input
                type="number"
                min={fog.durationMin}
                max={1200}
                value={fog.durationMax}
                onChange={(e) => {
                  fog.durationMax = Math.max(fog.durationMin, parseInt(e.target.value, 10) || 60);
                  onChange();
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
