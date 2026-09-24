import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AlertTriangle,
  CloudFog,
  CloudLightning,
  CloudRain,
  Compass,
  Droplets,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  Move,
  RefreshCw,
  Shuffle,
  Sun,
  Sunrise,
  Thermometer,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { World } from '../../../gameplay/mundo/World';
import { Surface } from '../../../gameplay/mundo/superficie/Surface';
import { PreviewWorld, PreviewTile } from '../../../gameplay/mundo/editor/PreviewWorld';

interface WorldVisualPreviewProps {
  world: World;
  activeSurfaceId?: string;
  activeBiomeId?: string;
  onSelectSurface?: (surfaceId: string) => void;
  onSelectBiome?: (biomeId: string) => void;
}

export const WorldVisualPreview: React.FC<WorldVisualPreviewProps> = ({
  world,
  activeSurfaceId,
  activeBiomeId,
  onSelectSurface,
  onSelectBiome,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Surface selection
  const activeSurface = (activeSurfaceId ? world.getSurface(activeSurfaceId) : null) || world.getDefaultSurface();

  // Preview World State
  const [seed, setSeed] = useState<number>(() => world.seed || 837492);
  const [gridSize, setGridSize] = useState<number>(32);
  const [selectedTargetBiomeId, setSelectedTargetBiomeId] = useState<string>(activeBiomeId || 'all');

  // Preview Instance & Status
  const [previewWorld, setPreviewWorld] = useState<PreviewWorld | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);

  // Camera: Zoom & Pan
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });

  // Visual Debug Overlays
  const [showBiomes, setShowBiomes] = useState<boolean>(false);
  const [showHeight, setShowHeight] = useState<boolean>(false);
  const [showGround, setShowGround] = useState<boolean>(false);

  // Time & Weather Test Toggles
  const [timeHour, setTimeHour] = useState<number>(12); // 12 = Day, 19 = Sunset, 0 = Night
  const [weatherPreset, setWeatherPreset] = useState<'clear' | 'rain' | 'heavy_rain' | 'fog' | 'storm'>('clear');

  // Hover Inspector
  const [hoveredTile, setHoveredTile] = useState<PreviewTile | null>(null);

  // Synchronize targetBiomeId if parent changes it
  useEffect(() => {
    if (activeBiomeId && activeBiomeId !== selectedTargetBiomeId) {
      setSelectedTargetBiomeId(activeBiomeId);
      setIsDirty(true);
    }
  }, [activeBiomeId]);

  // Track changes on surface to mark preview as dirty
  const lastSurfaceJSONRef = useRef<string>('');
  useEffect(() => {
    const currentJSON = JSON.stringify(activeSurface.toJSON());
    if (lastSurfaceJSONRef.current && lastSurfaceJSONRef.current !== currentJSON) {
      setIsDirty(true);
    }
  }, [activeSurface]);

  // Generate / Regenerate Preview World
  const regeneratePreview = useCallback(() => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const target = selectedTargetBiomeId === 'all' ? undefined : selectedTargetBiomeId;
      const newPreview = new PreviewWorld(activeSurface, {
        seed,
        cols: gridSize,
        rows: gridSize,
        targetBiomeId: target,
      });

      setPreviewWorld(newPreview);
      setIsDirty(false);
      lastSurfaceJSONRef.current = JSON.stringify(activeSurface.toJSON());
    } catch (err: any) {
      console.error('[PreviewWorld Error]:', err);
      setGenerationError(err?.message || 'Falha desconhecida na geração do mapa.');
    } finally {
      setIsGenerating(false);
    }
  }, [activeSurface, seed, gridSize, selectedTargetBiomeId]);

  // Initial creation on mount
  useEffect(() => {
    regeneratePreview();
  }, [regeneratePreview]);

  // Randomize Seed
  const handleRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    setSeed(newSeed);
    setIsDirty(true);
  };

  // Reset Zoom & Pan
  const handleResetCamera = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewWorld) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      previewWorld.render(
        ctx,
        canvas.width,
        canvas.height,
        {
          zoom,
          panX: pan.x,
          panY: pan.y,
          showBiomes,
          showHeight,
          showGround,
          timeHour,
          weatherPreset,
          hoveredCoord: hoveredTile ? { x: hoveredTile.x, y: hoveredTile.y } : null,
        },
        time
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [previewWorld, zoom, pan, showBiomes, showHeight, showGround, timeHour, weatherPreset, hoveredTile]);

  // Mouse Drag (Pan)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 1) return; // Left or Middle button
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !previewWorld) return;

    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
      return;
    }

    // Inspect hovered tile
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const baseTileSize = Math.min(canvas.width / previewWorld.cols, canvas.height / previewWorld.rows);
    const tileSize = Math.max(6, baseTileSize * zoom);
    const totalMapWidth = previewWorld.cols * tileSize;
    const totalMapHeight = previewWorld.rows * tileSize;
    const originX = (canvas.width - totalMapWidth) / 2 + pan.x;
    const originY = (canvas.height - totalMapHeight) / 2 + pan.y;

    const col = Math.floor((mouseX - originX) / tileSize);
    const row = Math.floor((mouseY - originY) / tileSize);

    const tile = previewWorld.getTile(col, row);
    setHoveredTile(tile || null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredTile(null);
  };

  // Mouse Wheel (Zoom)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.max(0.4, Math.min(4.0, prev + delta)));
  };

  const surfaces = world.getSurfaces();
  const biomes = activeSurface.getAllBiomes();

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-2xl select-none"
    >
      {/* Top Header: Seed, Random, Regenerate, Status */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Seed Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-300">Seed:</span>
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-700">
            <input
              type="number"
              value={seed}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                setSeed(val);
                setIsDirty(true);
              }}
              className="w-24 bg-transparent font-mono text-xs text-amber-300 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleRandomSeed}
            title="Gerar Seed Aleatória"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>🎲 Random Seed</span>
          </button>

          <button
            type="button"
            onClick={regeneratePreview}
            disabled={isGenerating}
            title="Recriar PreviewWorld com os dados atuais do editor"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold text-white shadow-xs transition-all ${
              isDirty
                ? 'bg-amber-600 hover:bg-amber-500 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>🔄 Regenerate Preview</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Generating...
            </span>
          ) : generationError ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Generation failed
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Changes not previewed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Up to date
            </span>
          )}
        </div>
      </div>

      {/* Surface & Target Selection + Size + Camera controls */}
      <div className="px-3 py-2 bg-slate-900/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Surface Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-700">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Superfície:</span>
            <select
              value={activeSurface.id}
              onChange={(e) => {
                onSelectSurface && onSelectSurface(e.target.value);
                setIsDirty(true);
              }}
              className="bg-transparent font-semibold text-slate-200 outline-none cursor-pointer"
            >
              {surfaces.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Biome target selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Modo:</span>
            <select
              value={selectedTargetBiomeId}
              onChange={(e) => {
                setSelectedTargetBiomeId(e.target.value);
                if (e.target.value !== 'all' && onSelectBiome) {
                  onSelectBiome(e.target.value);
                }
                setIsDirty(true);
              }}
              className="bg-transparent font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                🌐 Toda a Superfície
              </option>
              {biomes.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  Bioma: {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grid Resolution */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-700">
            <span className="text-slate-400">Grade:</span>
            {[32, 48, 64].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  setGridSize(sz);
                  setIsDirty(true);
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  gridSize === sz ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sz}x{sz}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom & Camera Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.25))}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-mono text-[11px] text-slate-200"
            title="Resetar Câmera"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4.0, z + 0.25))}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 ml-1"
            title="Centralizar Câmera"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Debug Overlays & Atmospheric Controls Bar */}
      <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Debug Overlays */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Debug:</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showBiomes}
              onChange={(e) => setShowBiomes(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
            />
            <span>Show Biomes</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showHeight}
              onChange={(e) => setShowHeight(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
            />
            <span>Show Height</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showGround}
              onChange={(e) => setShowGround(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
            />
            <span>Show Ground</span>
          </label>
        </div>

        {/* Time of Day & Weather Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
            <button
              type="button"
              onClick={() => setTimeHour(12)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                timeHour === 12 ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Dia</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeHour(19)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                timeHour === 19 ? 'bg-orange-500/20 text-orange-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sunrise className="w-3 h-3 text-orange-400" />
              <span>Entardecer</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeHour(0)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                timeHour === 0 ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Noite</span>
            </button>
          </div>

          {/* Weather buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
            <button
              type="button"
              onClick={() => setWeatherPreset('clear')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                weatherPreset === 'clear' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Limpo
            </button>
            <button
              type="button"
              onClick={() => setWeatherPreset('rain')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                weatherPreset === 'rain' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3 h-3 text-blue-400" />
              <span>Chuva</span>
            </button>
            <button
              type="button"
              onClick={() => setWeatherPreset('heavy_rain')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                weatherPreset === 'heavy_rain' ? 'bg-blue-600/30 text-blue-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>Forte</span>
            </button>
            <button
              type="button"
              onClick={() => setWeatherPreset('fog')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                weatherPreset === 'fog' ? 'bg-slate-600/30 text-slate-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudFog className="w-3 h-3 text-slate-400" />
              <span>Neblina</span>
            </button>
            <button
              type="button"
              onClick={() => setWeatherPreset('storm')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                weatherPreset === 'storm' ? 'bg-purple-600/30 text-purple-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudLightning className="w-3 h-3 text-purple-400" />
              <span>Tempestade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Display Area */}
      <div className="flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden min-h-[380px]">
        {/* Error notification banner if generation fails */}
        {generationError && (
          <div className="absolute z-20 inset-4 bg-rose-950/95 border border-rose-700/80 rounded-xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-md">
            <AlertTriangle className="w-12 h-12 text-rose-400 mb-3 animate-bounce" />
            <h4 className="text-base font-bold text-rose-100 mb-1">⚠ Preview Generation Error</h4>
            <p className="text-xs text-rose-300 max-w-md mb-4">
              Não foi possível gerar o mapa de preview temporário com os dados informados.
            </p>
            {showErrorDetails && (
              <pre className="text-[11px] font-mono bg-black/50 p-3 rounded text-rose-200 max-w-lg overflow-x-auto text-left mb-4">
                {generationError}
              </pre>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded-md text-xs font-semibold"
              >
                {showErrorDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
              </button>
              <button
                type="button"
                onClick={regeneratePreview}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-bold shadow transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className={`w-full h-full max-h-[560px] object-contain rounded-lg border border-slate-800 shadow-2xl ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        />

        {/* Floating helper badges */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-xs border border-slate-800 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 shadow-md">
          {previewWorld?.resolvedClimate?.sourceName || `Superfície: ${activeSurface.name}`}
        </div>

        <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-xs border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-400">
          Scroll: Zoom | Arraste: Mover
        </div>
      </div>

      {/* Real-time Tile Inspector Footer */}
      <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 text-xs">
        {hoveredTile ? (
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5 font-mono text-indigo-400">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>
                [{hoveredTile.x}, {hoveredTile.y}]
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded-xs border border-white/20 inline-block shadow-xs"
                style={{ backgroundColor: hoveredTile.blockColor }}
              />
              <span className="font-semibold text-white">{hoveredTile.blockName}</span>
              <span className="text-[10px] text-slate-400 font-mono">({hoveredTile.blockId})</span>
            </div>

            <div className="text-slate-400">
              Chão: <span className="text-slate-200 font-medium">{hoveredTile.groundName}</span>
            </div>

            <div className="text-slate-400 flex items-center gap-1">
              Bioma:{' '}
              <span
                className="px-1.5 py-0.2 rounded font-semibold text-[11px]"
                style={{ backgroundColor: hoveredTile.biomeColor + '33', color: hoveredTile.biomeColor }}
              >
                {hoveredTile.biomeName}
              </span>
            </div>

            {hoveredTile.patchId && (
              <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-semibold">
                Mancha: {hoveredTile.patchId}
              </span>
            )}

            {hoveredTile.scatterItem && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px] font-semibold flex items-center gap-1">
                <span>{hoveredTile.scatterItem.emoji}</span>
                <span>{hoveredTile.scatterItem.name || hoveredTile.scatterItem.id}</span>
              </span>
            )}

            {hoveredTile.vegetationItem && (
              <span className="px-1.5 py-0.2 rounded bg-green-950/80 text-green-300 border border-green-800/80 text-[10px] font-semibold flex items-center gap-1">
                <span>{hoveredTile.vegetationItem.emoji}</span>
                <span>{hoveredTile.vegetationItem.name}</span>
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-red-400" />
                {hoveredTile.temperature}°C
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                {Math.round(hoveredTile.humidity * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 italic">
            Passe o cursor sobre o mapa para inspecionar blocos, chão, bioma, manchas e vegetação gerados em tempo real.
          </span>
        )}
      </div>
    </div>
  );
};
