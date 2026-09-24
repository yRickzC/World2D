import React, { useState } from 'react';
import { Layers, Plus, Trash2, Search, Check, Shield, Droplet } from 'lucide-react';
import { GroundComponent, GroundDefinition, GroundLayer } from '../../../../gameplay/mundo/biomas/componentes/GroundComponent';
import { BlockSelectModal } from '../BlockSelectModal';

export interface SurfaceGroundTabProps {
  groundComponent: GroundComponent;
  onChange: () => void;
}

export const SurfaceGroundTab: React.FC<SurfaceGroundTabProps> = ({ groundComponent, onChange }) => {
  const [selectedGroundId, setSelectedGroundId] = useState<string>(
    groundComponent.grounds[0]?.id || ''
  );

  // Block Select Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number | null>(null);

  const activeGround =
    groundComponent.grounds.find((g) => g.id === selectedGroundId) ||
    groundComponent.grounds[0];

  const handleAddGround = () => {
    const newId = `ground_${Date.now().toString(36).slice(-4)}`;
    const newGround: GroundDefinition = {
      id: newId,
      name: 'Novo Tipo de Chão',
      weight: 20,
      layers: [
        {
          block: 'dirt',
          depth: 1,
          components: [{ type: 'SolidLayer', enabled: true }],
        },
        {
          block: 'stone',
          depth: 10,
          components: [{ type: 'SolidLayer', enabled: true }],
        },
      ],
    };
    groundComponent.addGround(newGround);
    setSelectedGroundId(newId);
    onChange();
  };

  const handleRemoveGround = (id: string) => {
    if (groundComponent.grounds.length <= 1) return;
    groundComponent.removeGround(id);
    setSelectedGroundId(groundComponent.grounds[0]?.id || '');
    onChange();
  };

  const handleAddLayer = () => {
    if (!activeGround) return;
    activeGround.layers.push({
      block: 'stone',
      depth: 5,
      components: [{ type: 'SolidLayer', enabled: true }],
    });
    onChange();
  };

  const handleRemoveLayer = (index: number) => {
    if (!activeGround || activeGround.layers.length <= 1) return;
    activeGround.layers.splice(index, 1);
    onChange();
  };

  const handleOpenBlockPicker = (layerIdx: number) => {
    setActiveLayerIndex(layerIdx);
    setModalOpen(true);
  };

  const handleBlockSelected = (blockId: string) => {
    if (activeGround && activeLayerIndex !== null && activeGround.layers[activeLayerIndex]) {
      activeGround.layers[activeLayerIndex].block = blockId;
      onChange();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Tipos de Chão e Composição de Camadas (Ground System)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina múltiplos tipos de chão com probabilidades de peso e camadas de blocos profundas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddGround}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Tipo de Chão</span>
          </button>
        </div>

        {/* Grounds Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {groundComponent.grounds.map((g) => {
            const isSelected = activeGround?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroundId(g.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{g.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">
                  Peso: {g.weight}
                </span>
                {groundComponent.grounds.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveGround(g.id);
                    }}
                    className="hover:text-red-400 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Ground Editor */}
        {activeGround && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ID do Chão</label>
                <input
                  type="text"
                  value={activeGround.id}
                  onChange={(e) => {
                    activeGround.id = e.target.value;
                    onChange();
                  }}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Exibido</label>
                <input
                  type="text"
                  value={activeGround.name}
                  onChange={(e) => {
                    activeGround.name = e.target.value;
                    onChange();
                  }}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Peso de Distribuição ({activeGround.weight}%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={activeGround.weight}
                    onChange={(e) => {
                      activeGround.weight = parseInt(e.target.value, 10) || 1;
                      onChange();
                    }}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-mono text-emerald-400 w-8 text-right">
                    {activeGround.weight}
                  </span>
                </div>
              </div>
            </div>

            {/* Layer Stack */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Camadas de Subsolo (Do topo para baixo)
                </span>
                <button
                  type="button"
                  onClick={handleAddLayer}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Camada</span>
                </button>
              </div>

              <div className="space-y-2">
                {activeGround.layers.map((layer, idx) => {
                  const isSolid = layer.components?.some(
                    (c) => c.type === 'SolidLayer' && c.enabled !== false
                  );

                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </div>

                      {/* Block Selector */}
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <span className="text-slate-400 font-medium">Bloco:</span>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded font-mono text-emerald-300 text-xs">
                            {layer.block}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenBlockPicker(idx)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded text-xs transition-colors"
                          >
                            <Search className="w-3 h-3" />
                            <span>Alterar Bloco</span>
                          </button>
                        </div>
                      </div>

                      {/* Depth */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Profundidade:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={layer.depth}
                          onChange={(e) => {
                            layer.depth = Math.max(1, parseInt(e.target.value, 10) || 1);
                            onChange();
                          }}
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded font-mono text-slate-100 text-xs text-center"
                        />
                        <span className="text-slate-500 text-[11px]">blocos</span>
                      </div>

                      {/* Solid Layer Toggle */}
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSolid ?? true}
                          onChange={(e) => {
                            if (!layer.components) layer.components = [];
                            let solidComp = layer.components.find((c) => c.type === 'SolidLayer');
                            if (!solidComp) {
                              solidComp = { type: 'SolidLayer', enabled: e.target.checked };
                              layer.components.push(solidComp);
                            } else {
                              solidComp.enabled = e.target.checked;
                            }
                            onChange();
                          }}
                          className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                        />
                        <Shield className="w-3 h-3 text-slate-400" />
                        <span>Sólido</span>
                      </label>

                      {/* Remove */}
                      {activeGround.layers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLayer(idx)}
                          className="p-1 hover:text-red-400 text-slate-500 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block Select Modal */}
      <BlockSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelectBlock={handleBlockSelected}
        selectedBlockId={
          activeGround && activeLayerIndex !== null ? activeGround.layers[activeLayerIndex]?.block : undefined
        }
      />
    </div>
  );
};
