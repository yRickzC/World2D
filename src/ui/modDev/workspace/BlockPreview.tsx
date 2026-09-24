import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Compass,
  Moon,
  RotateCcw,
  Sun,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Pointer,
  Hand,
  Hammer,
  Zap,
  Trash2,
  PlusSquare,
  Search,
  Check,
  Info,
  Shield,
  X,
  CloudRain,
  CloudFog,
  Cloud,
  Shovel,
  Layers,
  Thermometer,
  Droplets,
} from 'lucide-react';
import { BlockDefinitionJSON, BlockTextureDefinition } from '../../../gameplay/BlockSystem/types';
import { BlockDatabase } from '../../../gameplay/blocos/BlockDatabase';
import { TileType } from '../../../core/configuracao/types';
import { globalModManager } from '../../../mods/ModManager';
import {
  PreviewRuntime,
  PreviewToolMode,
  SelectedTileInfo,
} from './PreviewRuntime';
import { ResolvedClimate } from '../../../gameplay/mundo/clima/WeatherTypes';

export interface BlockPreviewProps {
  blockData: BlockDefinitionJSON;
  isOutdated?: boolean;
  onRegenerate?: () => void;
}

export const BlockPreview: React.FC<BlockPreviewProps> = ({
  blockData,
  isOutdated = false,
  onRegenerate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<PreviewRuntime | null>(null);

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<PreviewToolMode>('select');

  // Environment Settings
  const [groundType, setGroundType] = useState<TileType>('grass');
  const [weatherType, setWeatherType] = useState<'clear' | 'rain' | 'fog'>('clear');
  const [timeHour, setTimeHour] = useState<number>(12.0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);

  // Runtime Feedback State
  const [selectedTile, setSelectedTile] = useState<SelectedTileInfo | null>(null);
  const [hoveredCoord, setHoveredCoord] = useState<{ tileX: number; tileY: number } | null>(null);
  const [currentClimate, setCurrentClimate] = useState<ResolvedClimate | null>(null);
  const [logMessage, setLogMessage] = useState<{
    text: string;
    type: 'info' | 'success' | 'damage' | 'break' | 'error';
  }>({
    text: 'Engine real do jogo inicializada no Preview. Interaja livremente com o bloco.',
    type: 'info',
  });

  // Block Placement Picker
  const [isPlacePickerOpen, setIsPlacePickerOpen] = useState<boolean>(false);
  const [selectedPlaceBlockId, setSelectedPlaceBlockId] = useState<string>(blockData.id);
  const [placeSearchQuery, setPlaceSearchQuery] = useState<string>('');

  // 1. Initialize and Manage PreviewRuntime Lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const runtime = new PreviewRuntime({
      canvas,
      container,
      initialBlockData: blockData,
      onLog: (msg) => setLogMessage(msg),
      onTileSelected: (info) => setSelectedTile(info),
      onHoverCoord: (coord) => setHoveredCoord(coord),
      onClimateUpdated: (cl) => setCurrentClimate(cl),
    });

    runtimeRef.current = runtime;
    runtime.start();

    return () => {
      runtime.destroy();
      runtimeRef.current = null;
    };
  }, []); // Run on mount

  // 2. Synchronize BlockDefinition Snapshot when blockData changes
  useEffect(() => {
    if (runtimeRef.current) {
      runtimeRef.current.registerBlockSnapshot(blockData);
    }
  }, [blockData]);

  // 3. Tool Change Handler
  const handleSelectTool = (tool: PreviewToolMode) => {
    setActiveTool(tool);
    if (runtimeRef.current) {
      runtimeRef.current.setTool(tool);
    }
  };

  // 4. Ground Type Change Handler
  const handleGroundChange = (newGround: TileType) => {
    setGroundType(newGround);
    if (runtimeRef.current) {
      runtimeRef.current.resetArena(newGround);
    }
  };

  // 5. Weather Change Handler
  const handleWeatherChange = (newWeather: 'clear' | 'rain' | 'fog') => {
    setWeatherType(newWeather);
    if (runtimeRef.current) {
      runtimeRef.current.setWeather(newWeather);
    }
  };

  // 6. Time of Day Toggle Handler
  const handleToggleTime = () => {
    const times = [
      { label: 'Dia', hour: 12.0 },
      { label: 'Entardecer', hour: 18.5 },
      { label: 'Noite', hour: 23.0 },
      { label: 'Alvorecer', hour: 6.0 },
    ];
    const currentIndex = times.findIndex((t) => Math.abs(t.hour - timeHour) < 1.0);
    const nextIndex = (currentIndex + 1) % times.length;
    const nextHour = times[nextIndex].hour;
    setTimeHour(nextHour);
    if (runtimeRef.current) {
      runtimeRef.current.setTimeHour(nextHour);
    }
  };

  // 7. Zoom Handlers
  const handleZoomChange = (delta: number) => {
    const nextZoom = Math.max(0.6, Math.min(3.0, zoomLevel + delta));
    setZoomLevel(nextZoom);
    if (runtimeRef.current) {
      runtimeRef.current.setZoom(nextZoom);
    }
  };

  const handleCenterCamera = () => {
    setZoomLevel(1.5);
    if (runtimeRef.current) {
      runtimeRef.current.centerCamera();
    }
  };

  const handleResetArena = () => {
    if (runtimeRef.current) {
      runtimeRef.current.resetArena(groundType);
    }
  };

  // Available Blocks for Place tool picker
  const availablePlaceBlocks = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      isCurrent?: boolean;
      texture: BlockTextureDefinition;
    }> = [];

    // Currently edited block
    list.push({
      id: blockData.id,
      name: blockData.name || 'Bloco Customizado',
      isCurrent: true,
      texture: blockData.texture || {
        type: 'emoji',
        value: '🧱',
        size: 1.0,
      },
    });

    // Core Database Blocks
    const coreBlocks = BlockDatabase.getAll();
    for (const b of coreBlocks) {
      if (b.id !== blockData.id) {
        list.push({
          id: b.id,
          name: b.name,
          texture: b.texture || {
            type: 'emoji',
            value: '🧱',
            size: 1.0,
          },
        });
      }
    }

    // Mod Packages Blocks
    const packages = globalModManager.getAllPackages();
    for (const pkg of packages) {
      if (pkg.content?.blocks) {
        for (const mb of pkg.content.blocks) {
          if (!list.some((item) => item.id === mb.id)) {
            list.push({
              id: mb.id,
              name: mb.name || mb.id,
              texture: mb.texture || {
                type: 'emoji',
                value: '🧱',
                size: 1.0,
              },
            });
          }
        }
      }
    }

    return list;
  }, [blockData]);

  const filteredPlaceBlocks = useMemo(() => {
    if (!placeSearchQuery.trim()) return availablePlaceBlocks;
    const q = placeSearchQuery.toLowerCase();
    return availablePlaceBlocks.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    );
  }, [availablePlaceBlocks, placeSearchQuery]);

  const handleSelectPlaceBlock = (id: string) => {
    setSelectedPlaceBlockId(id);
    setIsPlacePickerOpen(false);
    if (runtimeRef.current) {
      runtimeRef.current.setPlaceBlock(id);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-zinc-950 text-zinc-100 select-none overflow-hidden"
    >
      {/* Top Engine Toolbar */}
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 px-3 flex items-center justify-between z-10 flex-shrink-0 gap-2">
        {/* Left: Engine Tool Palette */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {/* Select */}
          <button
            type="button"
            onClick={() => handleSelectTool('select')}
            className={`px-2 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTool === 'select'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
            }`}
            title="Selecionar e Inspecionar Bloco / Layers Reais"
          >
            <Pointer className="w-3.5 h-3.5" />
            <span>Select</span>
          </button>

          {/* Interact */}
          <button
            type="button"
            onClick={() => handleSelectTool('interact')}
            className={`px-2 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTool === 'interact'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
            }`}
            title="Executar Ação de Interação Real (InteractionSystem)"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Interact</span>
          </button>

          {/* Hit */}
          <button
            type="button"
            onClick={() => handleSelectTool('hit')}
            className={`px-2 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTool === 'hit'
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
            }`}
            title="Golpear Bloco (Testar Dano e Resistência com BreakSystem)"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hit</span>
          </button>

          {/* Break */}
          <button
            type="button"
            onClick={() => handleSelectTool('break')}
            className={`px-2 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTool === 'break'
                ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
            }`}
            title="Quebrar Bloco (Destruição Imediata com Drops Reais)"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Break</span>
          </button>

          {/* Dig */}
          <button
            type="button"
            onClick={() => handleSelectTool('dig')}
            className={`px-2 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTool === 'dig'
                ? 'bg-amber-600/25 border-amber-500 text-amber-200'
                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
            }`}
            title="Cavar Solo (Criar Chão Cavado para Testar Preenchimento de Piso)"
          >
            <Shovel className="w-3.5 h-3.5" />
            <span>Dig</span>
          </button>

          {/* Remove */}
          <button
            type="button"
            onClick={() => handleSelectTool('remove')}
            className={`px-2 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 ${
              activeTool === 'remove'
                ? 'bg-red-500/20 border-red-400 text-red-300'
                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
            }`}
            title="Desmontar / Remover Camada do Bloco"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>

          {/* Place */}
          <div className="flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTool('place')}
              className={`px-2 py-1 rounded-l-xl border-y border-l text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTool === 'place'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
              }`}
              title="Construir Bloco (Testa Construção Vertical e Piso em Chão Cavado)"
            >
              <PlusSquare className="w-3.5 h-3.5" />
              <span>Place</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectTool('place');
                setIsPlacePickerOpen((prev) => !prev);
              }}
              className="px-2 py-1 rounded-r-xl border text-xs font-mono font-bold bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300 hover:text-white cursor-pointer"
              title="Escolher Bloco para Colocação"
            >
              {selectedPlaceBlockId === blockData.id
                ? 'ALVO'
                : selectedPlaceBlockId.split(':').pop()} ▼
            </button>
          </div>
        </div>

        {/* Right: Environment, Lighting, Weather & Camera Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Ground Switcher */}
          <div className="flex items-center bg-zinc-950/70 p-0.5 rounded-xl border border-zinc-800">
            {(['grass', 'dirt', 'stone', 'sand'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGroundChange(g)}
                className={`px-1.5 py-0.5 rounded capitalize transition-colors cursor-pointer text-[10px] ${
                  groundType === g
                    ? 'bg-zinc-800 text-amber-300 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {g === 'grass' ? 'Grama' : g === 'dirt' ? 'Terra' : g === 'stone' ? 'Pedra' : 'Areia'}
              </button>
            ))}
          </div>

          {/* Weather Switcher */}
          <div className="flex items-center bg-zinc-950/70 p-0.5 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => handleWeatherChange('clear')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                weatherType === 'clear' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-white'
              }`}
              title="Clima: Céu Limpo"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleWeatherChange('rain')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                weatherType === 'rain' ? 'bg-zinc-800 text-sky-400' : 'text-zinc-400 hover:text-white'
              }`}
              title="Clima: Chuva Real (WeatherManager)"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleWeatherChange('fog')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                weatherType === 'fog' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-400 hover:text-white'
              }`}
              title="Clima: Neblina Atmosférica (WeatherManager)"
            >
              <CloudFog className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Day / Night Cycle (LightingRenderer) */}
          <button
            type="button"
            onClick={handleToggleTime}
            className="p-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
            title={`Horário do Mundo: ${timeHour.toFixed(1)}h (Clique para alternar)`}
          >
            {timeHour >= 7 && timeHour <= 17 ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : timeHour > 17 && timeHour <= 20 ? (
              <Sun className="w-3.5 h-3.5 text-orange-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span className="text-[10px] font-mono">{timeHour.toFixed(0)}h</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-zinc-950/70 rounded-xl border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => handleZoomChange(-0.25)}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-zinc-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoomChange(0.25)}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center Camera */}
          <button
            type="button"
            onClick={handleCenterCamera}
            className="p-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Centralizar Câmera no Bloco Alvo [0, 0]"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Reset Scenario */}
          <button
            type="button"
            onClick={handleResetArena}
            className="p-1.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Resetar Cenário com a Engine Real"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Outdated Notice Banner */}
      {isOutdated && (
        <div className="absolute top-14 left-4 right-4 z-20 bg-amber-500/15 border border-amber-500/30 rounded-xl p-2 flex items-center justify-between text-amber-300 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Propriedades do bloco foram sincronizadas com o PreviewRuntime em tempo real.</span>
          </div>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 rounded text-amber-200 text-[11px] font-semibold cursor-pointer"
            >
              Recompilar
            </button>
          )}
        </div>
      )}

      {/* Live Atmospheric Weather Badge (Top-Left HUD) */}
      {currentClimate && (
        <div className="absolute top-14 left-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-xl text-[11px] text-zinc-300 backdrop-blur-md shadow-sm pointer-events-none">
          <div className="flex items-center gap-1 font-mono text-amber-300">
            <Thermometer className="w-3 h-3" />
            <span>{Math.round(currentClimate.temperature)}°C</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1 font-mono text-sky-300">
            <Droplets className="w-3 h-3" />
            <span>{Math.round(currentClimate.humidity * 100)}%</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="capitalize text-zinc-400 font-sans">
            {weatherType === 'rain' ? 'Chuva' : weatherType === 'fog' ? 'Neblina' : 'Limpo'}
          </span>
        </div>
      )}

      {/* Canvas Viewport (100% GameRenderer target) */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`w-full h-full block ${
            activeTool === 'place'
              ? 'cursor-cell'
              : activeTool === 'hit' || activeTool === 'break'
              ? 'cursor-crosshair'
              : activeTool === 'interact'
              ? 'cursor-pointer'
              : activeTool === 'dig'
              ? 'cursor-grab'
              : 'cursor-default'
          }`}
        />

        {/* Selected Tile & Real Layer Data Inspector (Bottom-Right HUD) */}
        {selectedTile && selectedTile.blockDef && (
          <div className="absolute bottom-4 right-4 z-20 w-80 bg-zinc-900/90 border border-zinc-750 rounded-2xl shadow-xl backdrop-blur-md p-3.5 text-zinc-200 animate-in fade-in duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow border border-zinc-700/50"
                  style={{
                    backgroundColor:
                      selectedTile.blockDef.texture?.background?.color ||
                      selectedTile.blockDef.texture?.backgroundColor ||
                      'transparent',
                  }}
                >
                  {selectedTile.blockDef.texture?.value || '🧱'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate max-w-[170px]">
                    {selectedTile.blockDef.name}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">
                    Posição: [{selectedTile.tileX}, {selectedTile.tileY}]
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTile(null)}
                className="text-zinc-500 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Real Layers System Info */}
            <div className="mt-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-400">ID do Bloco:</span>
                <span className="font-mono text-zinc-200 truncate max-w-[150px]">
                  {selectedTile.blockDef.id}
                </span>
              </div>

              {/* Layer 1: Terreno Base */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Solo Base (baseGround):</span>
                <span className="font-mono text-emerald-400 uppercase">
                  {selectedTile.layerData.baseGround}
                </span>
              </div>

              {/* Layer 2: Chão Cavado */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Chão Cavado (isDug):</span>
                <span
                  className={`font-mono ${
                    selectedTile.layerData.isDug ? 'text-amber-400 font-bold' : 'text-zinc-400'
                  }`}
                >
                  {selectedTile.layerData.isDug ? 'Sim (Escavado)' : 'Não'}
                </span>
              </div>

              {/* Layer 3: Piso Preenchido */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Piso (groundBlock):</span>
                <span className="font-mono text-zinc-300 truncate max-w-[140px]">
                  {selectedTile.layerData.groundBlock || 'Vazio (Nível do Solo)'}
                </span>
              </div>

              {/* Layer 4: Construção Vertical (upperLayers) */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Camadas Elevadas:</span>
                <span
                  className={`font-mono ${
                    selectedTile.layerData.upperLayers.length > 0
                      ? 'text-sky-400 font-bold'
                      : 'text-zinc-400'
                  }`}
                >
                  {selectedTile.layerData.upperLayers.length > 0
                    ? `Nível ${selectedTile.layerData.upperLayers.length} (${selectedTile.layerData.upperLayers.join(', ')})`
                    : 'Nenhuma (Plano)'}
                </span>
              </div>

              <div className="flex justify-between pt-1 border-t border-zinc-800">
                <span className="text-zinc-400">Sólido:</span>
                <span className="font-mono text-emerald-400">
                  {selectedTile.blockDef.isSolid ? 'Sim' : 'Não'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Fundo Textura:</span>
                <span className="font-mono text-zinc-300">
                  {selectedTile.blockDef.texture?.background?.color ||
                  selectedTile.blockDef.texture?.backgroundColor
                    ? selectedTile.blockDef.texture?.background?.color ||
                      selectedTile.blockDef.texture?.backgroundColor
                    : 'Transparente (Sem Fundo)'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Escala Emoji:</span>
                <span className="font-mono text-amber-400">
                  {Math.round((selectedTile.blockDef.texture?.size ?? 1.0) * 100)}%
                </span>
              </div>

              {selectedTile.health && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Vida / Dano:</span>
                  <span className="font-mono text-yellow-400">
                    {selectedTile.health.current} / {selectedTile.health.max} HP
                  </span>
                </div>
              )}

              {selectedTile.blockDef.getTags && (
                <div className="pt-1 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block mb-1">Tags Registradas:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedTile.blockDef.getTags().map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Place Block Picker Modal Dialog */}
        {isPlacePickerOpen && (
          <div className="absolute top-4 left-4 z-30 w-80 bg-zinc-900/95 border border-zinc-750 rounded-2xl shadow-2xl backdrop-blur-md p-3 text-zinc-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
              <div className="flex items-center gap-1.5">
                <PlusSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Escolha um Bloco para Colocar
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPlacePickerOpen(false)}
                className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                autoFocus
                value={placeSearchQuery}
                onChange={(e) => setPlaceSearchQuery(e.target.value)}
                placeholder="Buscar blocos (Madeira, Grama, Pedra...)"
                className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Block Options List */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {filteredPlaceBlocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectPlaceBlock(b.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                    selectedPlaceBlockId === b.id
                      ? 'bg-emerald-500/20 border border-emerald-400/80 text-white'
                      : 'hover:bg-zinc-800 border border-transparent text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow flex-shrink-0"
                      style={{
                        backgroundColor:
                          b.texture.backgroundColor || b.texture.background?.color || '#27272a',
                      }}
                    >
                      {b.texture.value || '🧱'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isCurrent && (
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                            EDITANDO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate">{b.id}</div>
                    </div>
                  </div>
                  {selectedPlaceBlockId === b.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status / Log Bar */}
      <div className="h-8 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center justify-between text-xs text-zinc-400 z-10 flex-shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate">{logMessage?.text}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 flex-shrink-0">
          <span>Modo: {activeTool.toUpperCase()}</span>
          {hoveredCoord && <span>Cursor: [{hoveredCoord.tileX}, {hoveredCoord.tileY}]</span>}
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
