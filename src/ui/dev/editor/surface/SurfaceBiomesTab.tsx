import React, { useState } from 'react';
import {
  CloudFog,
  CloudRain,
  Copy,
  Layers,
  Palette,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Tag,
  Thermometer,
  Trash2,
  TreePine,
  Wind,
  X,
  Droplet,
  Shuffle,
} from 'lucide-react';
import { Surface } from '../../../../gameplay/mundo/superficie/Surface';
import { BiomeDefinition } from '../../../../gameplay/mundo/biomas/BiomeDefinition';
import { GroundComponent } from '../../../../gameplay/mundo/biomas/componentes/GroundComponent';
import { RainComponent, WeatherRainType } from '../../../../gameplay/mundo/biomas/componentes/RainComponent';
import { ScatterComponent, ScatterEntry } from '../../../../gameplay/mundo/biomas/componentes/ScatterComponent';
import { PatchComponent, PatchEntry, PatchShape } from '../../../../gameplay/mundo/biomas/componentes/PatchComponent';
import { BiomeVegetationComponent, VegetationEntry } from '../../../../gameplay/mundo/biomas/componentes/BiomeVegetationComponent';
import { FogComponent } from '../../../../gameplay/mundo/biomas/componentes/FogComponent';
import { BiomeTemperatureComponent } from '../../../../gameplay/mundo/biomas/componentes/BiomeTemperatureComponent';
import { BiomeHumidityComponent } from '../../../../gameplay/mundo/biomas/componentes/BiomeHumidityComponent';
import { SurfaceGroundTab } from './SurfaceGroundTab';
import { BlockSelectModal } from '../BlockSelectModal';

export interface SurfaceBiomesTabProps {
  surface: Surface;
  selectedBiomeId: string;
  onSelectBiome: (id: string) => void;
  onChange: () => void;
}

export const SurfaceBiomesTab: React.FC<SurfaceBiomesTabProps> = ({
  surface,
  selectedBiomeId,
  onSelectBiome,
  onChange,
}) => {
  const biomes = surface.getAllBiomes();
  const activeBiome = surface.getBiome(selectedBiomeId) || biomes[0];

  // Block modal for Patch targets
  const [blockModalOpen, setBlockModalOpen] = useState<boolean>(false);
  const [activePatchIdx, setActivePatchIdx] = useState<number | null>(null);

  const handleAddBiome = () => {
    const newId = `biome_${Date.now().toString(36).slice(-4)}`;
    const newBiome = new BiomeDefinition(
      newId,
      'Novo Bioma',
      ['custom'],
      [
        new GroundComponent(),
        new RainComponent(),
        new ScatterComponent(),
        new PatchComponent(),
        new BiomeVegetationComponent(),
        new FogComponent(),
        new BiomeTemperatureComponent(),
        new BiomeHumidityComponent(),
      ],
      'temperate',
      '#10b981'
    );
    surface.addBiome(newBiome);
    onSelectBiome(newId);
    onChange();
  };

  const handleDuplicateBiome = (biome: BiomeDefinition) => {
    const dup = biome.clone();
    dup.id = `${biome.id}_copy_${Date.now().toString(36).slice(-3)}`;
    dup.name = `${biome.name} (Cópia)`;
    surface.addBiome(dup);
    onSelectBiome(dup.id);
    onChange();
  };

  const handleRemoveBiome = (id: string) => {
    if (biomes.length <= 1) return;
    surface.removeBiome(id);
    const remaining = surface.getAllBiomes();
    onSelectBiome(remaining[0]?.id || '');
    onChange();
  };

  // Add component to active biome if not present
  const handleAddComponent = (type: string) => {
    if (!activeBiome) return;
    if (type === 'Ground' && !activeBiome.hasComponent('Ground')) {
      activeBiome.addComponent(new GroundComponent());
    } else if (type === 'Rain' && !activeBiome.hasComponent('Rain')) {
      activeBiome.addComponent(new RainComponent());
    } else if (type === 'Scatter' && !activeBiome.hasComponent('Scatter')) {
      activeBiome.addComponent(new ScatterComponent());
    } else if (type === 'Patch' && !activeBiome.hasComponent('Patch')) {
      activeBiome.addComponent(new PatchComponent());
    } else if (type === 'Fog' && !activeBiome.hasComponent('Fog')) {
      activeBiome.addComponent(new FogComponent());
    } else if (type === 'Vegetation' && !activeBiome.hasComponent('Vegetation')) {
      activeBiome.addComponent(new BiomeVegetationComponent());
    } else if (type === 'Temperature' && !activeBiome.hasComponent('Temperature')) {
      activeBiome.addComponent(new BiomeTemperatureComponent());
    } else if (type === 'Humidity' && !activeBiome.hasComponent('Humidity')) {
      activeBiome.addComponent(new BiomeHumidityComponent());
    }
    onChange();
  };

  // Ensure GroundComponent exists on activeBiome
  let groundComp = (activeBiome?.getComponent('Ground') as GroundComponent | undefined);
  if (activeBiome && !groundComp) {
    groundComp = new GroundComponent();
    activeBiome.addComponent(groundComp);
  }

  const rainComp = (activeBiome?.getComponent('Rain') as RainComponent | undefined);
  const scatterComp = (activeBiome?.getComponent('Scatter') as ScatterComponent | undefined);
  const patchComp = (activeBiome?.getComponent('Patch') as PatchComponent | undefined);
  const fogComp = (activeBiome?.getComponent('Fog') as FogComponent | undefined);
  const vegComp = (activeBiome?.getComponent('Vegetation') as BiomeVegetationComponent | undefined);
  const tempComp = (activeBiome?.getComponent('Temperature') as BiomeTemperatureComponent | undefined);
  const humComp = (activeBiome?.getComponent('Humidity') as BiomeHumidityComponent | undefined);

  return (
    <div className="space-y-6">
      {/* Biomes List Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-slate-100">
              Biomas da Superfície ({biomes.length})
            </h4>
          </div>
          <button
            type="button"
            onClick={handleAddBiome}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Bioma</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {biomes.map((b) => {
            const isSelected = activeBiome?.id === b.id;
            return (
              <div
                key={b.id}
                onClick={() => onSelectBiome(b.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 font-semibold shadow-xs'
                    : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: b.color || '#84cc16' }}
                />
                <span>{b.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({b.id})</span>

                <button
                  type="button"
                  title="Duplicar Bioma"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateBiome(b);
                  }}
                  className="p-1 hover:text-indigo-400 text-slate-400"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {biomes.length > 1 && (
                  <button
                    type="button"
                    title="Remover Bioma"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBiome(b.id);
                    }}
                    className="p-1 hover:text-red-400 text-slate-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Biome Details & Component Editors */}
      {activeBiome && (
        <div className="space-y-5">
          {/* General Metadata */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                Propriedades do Bioma: <span className="text-white">{activeBiome.name}</span>
              </h5>

              {/* Add Component Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Adicionar Componente:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddComponent(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="" disabled>
                    + Selecionar...
                  </option>
                  {!rainComp && <option value="Rain">Chuva (RainComponent)</option>}
                  {!scatterComp && <option value="Scatter">Scatter (ScatterComponent)</option>}
                  {!patchComp && <option value="Patch">Manchas (PatchComponent)</option>}
                  {!fogComp && <option value="Fog">Neblina (FogComponent)</option>}
                  {!vegComp && <option value="Vegetation">Vegetação (VegetationComponent)</option>}
                  {!tempComp && <option value="Temperature">Temperatura (TemperatureComponent)</option>}
                  {!humComp && <option value="Humidity">Umidade (HumidityComponent)</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ID do Bioma</label>
                <input
                  type="text"
                  value={activeBiome.id}
                  onChange={(e) => {
                    activeBiome.id = e.target.value;
                    onChange();
                  }}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Bioma</label>
                <input
                  type="text"
                  value={activeBiome.name}
                  onChange={(e) => {
                    activeBiome.name = e.target.value;
                    onChange();
                  }}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Categoria</label>
                <select
                  value={activeBiome.category}
                  onChange={(e) => {
                    activeBiome.category = e.target.value as any;
                    onChange();
                  }}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="temperate">Temperado</option>
                  <option value="aquatic">Aquático</option>
                  <option value="arid">Árido / Deserto</option>
                  <option value="subterranean">Subterrâneo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor no Mapa</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activeBiome.color || '#84cc16'}
                    onChange={(e) => {
                      activeBiome.color = e.target.value;
                      onChange();
                    }}
                    className="w-8 h-8 rounded-md border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">
                    {activeBiome.color || '#84cc16'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. GroundComponent */}
          {groundComp && (
            <SurfaceGroundTab groundComponent={groundComp} onChange={onChange} />
          )}

          {/* 2. RainComponent */}
          {rainComp && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  Sistema Climático: Chuva no Bioma (RainComponent)
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    activeBiome.removeComponent('Rain');
                    onChange();
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remover Componente
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Permitir Chuva</label>
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rainComp.enabled}
                      onChange={(e) => {
                        rainComp.enabled = e.target.checked;
                        onChange();
                      }}
                      className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0"
                    />
                    <span>{rainComp.enabled ? 'Chuva Habilitada' : 'Sem Chuva (Seco)'}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Chance de Ocorrência ({Math.round(rainComp.chance * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(rainComp.chance * 100)}
                    onChange={(e) => {
                      rainComp.chance = (parseInt(e.target.value, 10) || 0) / 100;
                      onChange();
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Intensidade ({Math.round(rainComp.intensity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(rainComp.intensity * 100)}
                    onChange={(e) => {
                      rainComp.intensity = (parseInt(e.target.value, 10) || 0) / 100;
                      onChange();
                    }}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Chuva</label>
                  <select
                    value={rainComp.weatherType}
                    onChange={(e) => {
                      rainComp.weatherType = e.target.value as WeatherRainType;
                      onChange();
                    }}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="normal">Chuva Normal</option>
                    <option value="heavy">Chuva Pesada</option>
                    <option value="drizzle">Garoa / Drizzle</option>
                    <option value="storm">Tempestade com Raios</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. ScatterComponent */}
          {scatterComp && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Distribuição de Objetos Menores (ScatterComponent)
                </h5>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      scatterComp.addEntry({
                        id: 'pebble',
                        name: 'Pedrinhas',
                        density: 0.03,
                        scale: { min: 0.8, max: 1.1 },
                        rotation: { random: true },
                      });
                      onChange();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      activeBiome.removeComponent('Scatter');
                      onChange();
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {scatterComp.entries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs"
                  >
                    <div className="w-32">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Identificador</label>
                      <input
                        type="text"
                        value={entry.id}
                        onChange={(e) => {
                          entry.id = e.target.value;
                          onChange();
                        }}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded font-mono text-slate-100 text-xs"
                      />
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Densidade no Terreno ({Math.round(entry.density * 100)}%)
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={Math.round(entry.density * 100)}
                        onChange={(e) => {
                          entry.density = (parseInt(e.target.value, 10) || 1) / 100;
                          onChange();
                        }}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-slate-300 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={entry.rotation?.random ?? true}
                          onChange={(e) => {
                            if (!entry.rotation) entry.rotation = { random: true };
                            entry.rotation.random = e.target.checked;
                            onChange();
                          }}
                          className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                        />
                        <span>Rotação Aleatória</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        scatterComp.removeEntry(entry.id);
                        onChange();
                      }}
                      className="p-1 hover:text-red-400 text-slate-500 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {scatterComp.entries.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Nenhum item de scatter configurado.</p>
                )}
              </div>
            </div>
          )}

          {/* 4. PatchComponent */}
          {patchComp && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-amber-400" />
                    Geração de Manchas no Terreno (PatchComponent)
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Crie concentrações orgânicas de blocos como lama, areia, flores ou musgo.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      patchComp.addEntry({
                        id: `patch_${Date.now().toString(36).slice(-3)}`,
                        name: 'Nova Mancha',
                        target: 'mud',
                        targetType: 'block',
                        chance: 0.15,
                        size: { min: 3, max: 7 },
                        shape: 'noise',
                      });
                      onChange();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Mancha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      activeBiome.removeComponent('Patch');
                      onChange();
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {patchComp.entries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs"
                  >
                    <div className="w-28">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Nome / ID</label>
                      <input
                        type="text"
                        value={entry.name || entry.id}
                        onChange={(e) => {
                          entry.name = e.target.value;
                          onChange();
                        }}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs"
                      />
                    </div>

                    {/* Target Block with Modal Picker */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Bloco Alvo:</span>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-amber-300 text-xs">
                        {entry.target}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePatchIdx(idx);
                          setBlockModalOpen(true);
                        }}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                      >
                        <Search className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Chance */}
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Frequência ({Math.round(entry.chance * 100)}%)
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={Math.round(entry.chance * 100)}
                        onChange={(e) => {
                          entry.chance = (parseInt(e.target.value, 10) || 1) / 100;
                          onChange();
                        }}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    {/* Shape */}
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Formato</label>
                      <select
                        value={entry.shape}
                        onChange={(e) => {
                          entry.shape = e.target.value as PatchShape;
                          onChange();
                        }}
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="noise">Ruído Orgânico</option>
                        <option value="blob">Blob Natural</option>
                        <option value="circular">Circular</option>
                        <option value="irregular">Irregular</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        patchComp.removeEntry(entry.id);
                        onChange();
                      }}
                      className="p-1 hover:text-red-400 text-slate-500 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. VegetationComponent */}
          {vegComp && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-green-400" />
                  Vegetação e Árvores (VegetationComponent)
                </h5>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      vegComp.data.entries.push({
                        id: 'tree_oak',
                        chance: 0.08,
                        density: 0.06,
                      });
                      onChange();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Estrutura</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      activeBiome.removeComponent('Vegetation');
                      onChange();
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {vegComp.data.entries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs"
                  >
                    <div className="w-36">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Tipo de Árvore / Planta</label>
                      <select
                        value={entry.id}
                        onChange={(e) => {
                          entry.id = e.target.value;
                          onChange();
                        }}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="tree_oak">Carvalho (Oak Tree)</option>
                        <option value="tree_pine">Pinheiro (Pine Tree)</option>
                        <option value="tree_birch">Bétula (Birch Tree)</option>
                        <option value="bush">Arbusto (Bush)</option>
                        <option value="cactus">Cacto (Cactus)</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Densidade ({Math.round((entry.density ?? 0.05) * 100)}%)
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={25}
                        value={Math.round((entry.density ?? 0.05) * 100)}
                        onChange={(e) => {
                          entry.density = (parseInt(e.target.value, 10) || 1) / 100;
                          onChange();
                        }}
                        className="w-full accent-green-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        vegComp.data.entries.splice(idx, 1);
                        onChange();
                      }}
                      className="p-1 hover:text-red-400 text-slate-500 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. FogComponent */}
          {fogComp && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <CloudFog className="w-4 h-4 text-slate-400" />
                  Neblina no Bioma (FogComponent)
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    activeBiome.removeComponent('Fog');
                    onChange();
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Habilitar Neblina</label>
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fogComp.enabled}
                      onChange={(e) => {
                        fogComp.enabled = e.target.checked;
                        onChange();
                      }}
                      className="rounded border-slate-700 bg-slate-950 text-slate-400 focus:ring-0"
                    />
                    <span>{fogComp.enabled ? 'Neblina Presente' : 'Sem Neblina'}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Densidade ({Math.round(fogComp.density * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(fogComp.density * 100)}
                    onChange={(e) => {
                      fogComp.density = (parseInt(e.target.value, 10) || 0) / 100;
                      onChange();
                    }}
                    className="w-full accent-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cor da Neblina</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fogComp.color || '#cbd5e1'}
                      onChange={(e) => {
                        fogComp.color = e.target.value;
                        onChange();
                      }}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">{fogComp.color}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. Temperature & Humidity */}
          {(tempComp || humComp) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Thermometer className="w-4 h-4 text-orange-400" />
                Temperatura e Umidade
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tempComp && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Temperatura Base ({tempComp.data.base ?? 22}°C)
                    </label>
                    <input
                      type="range"
                      min={-20}
                      max={50}
                      value={tempComp.data.base ?? 22}
                      onChange={(e) => {
                        tempComp.data.base = parseInt(e.target.value, 10) || 0;
                        onChange();
                      }}
                      className="w-full accent-orange-500"
                    />
                  </div>
                )}

                {humComp && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Umidade Base ({Math.round((humComp.data.base ?? 0.5) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((humComp.data.base ?? 0.5) * 100)}
                      onChange={(e) => {
                        humComp.data.base = (parseInt(e.target.value, 10) || 0) / 100;
                        onChange();
                      }}
                      className="w-full accent-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Block Select Modal for Patch Target */}
      <BlockSelectModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onSelectBlock={(blockId) => {
          if (patchComp && activePatchIdx !== null && patchComp.entries[activePatchIdx]) {
            patchComp.entries[activePatchIdx].target = blockId;
            onChange();
          }
        }}
        selectedBlockId={
          patchComp && activePatchIdx !== null ? patchComp.entries[activePatchIdx]?.target : undefined
        }
        title="Selecionar Bloco da Mancha"
      />
    </div>
  );
};
