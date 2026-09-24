import React, { useEffect, useRef, useState } from 'react';
import { Eye, Layers, Lightbulb, Shield, Sparkles, Sun, Wrench } from 'lucide-react';
import { BlockDefinitionJSON } from '../../../gameplay/BlockSystem/types';

export interface BlockVisualPreviewProps {
  blockJSON: BlockDefinitionJSON;
}

export const BlockVisualPreview: React.FC<BlockVisualPreviewProps> = ({ blockJSON }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [groundType, setGroundType] = useState<'grass' | 'dirt' | 'stone' | 'sand' | 'void'>('grass');
  const [viewMode, setViewMode] = useState<'elevated' | 'flat'>('elevated');
  const [elevation, setElevation] = useState<number>(1);

  // Extract component values from blockJSON
  const components = blockJSON.components || [];

  const emojiComp = components.find(
    (c) => c.type === 'EmojiIconComponent' || c.type.toLowerCase().includes('emoji')
  );
  const emoji = emojiComp?.data?.emoji || '🧱';

  const colorComp = components.find(
    (c) => c.type === 'ColorTextureComponent' || c.type.toLowerCase().includes('color')
  );
  const topComp = components.find(
    (c) => c.type === 'TopTextureComponent' || c.type.toLowerCase().includes('top')
  );
  const sideComp = components.find(
    (c) => c.type === 'SideTextureComponent' || c.type.toLowerCase().includes('side')
  );
  const solidComp = components.find(
    (c) => c.type === 'SolidComponent' || c.type.toLowerCase().includes('solid')
  );
  const breakComp = components.find(
    (c) => c.type === 'BreakableComponent' || c.type.toLowerCase().includes('break')
  );
  const lightComp = components.find(
    (c) => c.type === 'LightComponent' || c.type.toLowerCase().includes('light')
  );
  const fluidComp = components.find(
    (c) => c.type === 'FluidComponent' || c.type.toLowerCase().includes('fluid')
  );

  const topColor = topComp?.data?.primaryColor || colorComp?.data?.primaryColor || '#4ade80';
  const topPattern = topComp?.data?.pattern || 'solid';
  const sideColor =
    sideComp?.data?.primaryColor || colorComp?.data?.secondaryColor || '#15803d';
  const sideBorderColor = sideComp?.data?.borderColor || '#0f5132';
  const wallHeight = sideComp?.data?.defaultWallHeight ?? 14;

  const isSolid = solidComp?.data ? Boolean(solidComp.data.solid) : false;
  const isFluid = fluidComp !== undefined;
  const lightIntensity = lightComp?.data?.intensity ?? 0;
  const lightColor = lightComp?.data?.color || '#fef08a';
  const hardness = breakComp?.data?.hardness ?? 1;
  const toolTag = breakComp?.data?.requiredToolTag;

  // Ground backgrounds palette
  const groundPalette = {
    grass: { primary: '#2d6a4f', secondary: '#1b4332', accent: '#40916c' },
    dirt: { primary: '#5c4033', secondary: '#3d2b1f', accent: '#70483c' },
    stone: { primary: '#475569', secondary: '#334155', accent: '#64748b' },
    sand: { primary: '#d4a373', secondary: '#bc6c25', accent: '#e9edc9' },
    void: { primary: '#18181b', secondary: '#09090b', accent: '#27272a' },
  }[groundType];

  // Draw preview on canvas whenever data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let startTime = performance.now();

    const render = () => {
      const time = (performance.now() - startTime) / 1000;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Background Dark Floor
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Grid settings (3x3 tiles, each 64x64px)
      const tileSize = 64;
      const gridCols = 3;
      const gridRows = 3;
      const startX = (width - gridCols * tileSize) / 2;
      const startY = (height - gridRows * tileSize) / 2 + 10;

      // 2. Draw Ground Grid (Ambient World Ground)
      for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
          const tx = startX + gx * tileSize;
          const ty = startY + gy * tileSize;
          const isCenter = gx === 1 && gy === 1;

          // Ambient ground tile
          ctx.fillStyle = groundPalette.primary;
          ctx.fillRect(tx, ty, tileSize, tileSize);

          // Ground subtle texture dots
          ctx.fillStyle = groundPalette.secondary;
          ctx.fillRect(tx + 8, ty + 12, 6, 6);
          ctx.fillRect(tx + 40, ty + 38, 8, 8);
          ctx.fillRect(tx + 22, ty + 46, 5, 5);

          // Ground grid border
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx, ty, tileSize, tileSize);
        }
      }

      // Center tile coordinates
      const cx = startX + 1 * tileSize;
      const cy = startY + 1 * tileSize;

      // 3. Render Center Block: either elevated 2.5D or flat ground tile
      if (viewMode === 'flat') {
        // Flat Ground Tile rendering
        ctx.fillStyle = topColor;
        ctx.fillRect(cx, cy, tileSize, tileSize);

        // Fluid shimmer if active
        if (isFluid) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          const wave = Math.sin(time * 3) * 6;
          ctx.fillRect(cx, cy + wave + 20, tileSize, 12);
        }

        // Texture accents
        if (topPattern === 'checker') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(cx, cy, tileSize / 2, tileSize / 2);
          ctx.fillRect(cx + tileSize / 2, cy + tileSize / 2, tileSize / 2, tileSize / 2);
        }

        // Center emoji
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, cx + tileSize / 2, cy + tileSize / 2);
      } else {
        // Elevated 2.5D Block Rendering with real wall height and shadow
        const totalHeight = wallHeight * elevation;
        const groundBottomY = cy + tileSize;
        const topSurfaceY = cy - totalHeight;

        // A. Soft Contact Shadow on the ground
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(
          cx + tileSize / 2,
          groundBottomY + 3,
          tileSize / 2 + 2,
          8,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // B. Lateral Wall Face (SideTextureComponent)
        ctx.fillStyle = sideColor;
        ctx.fillRect(cx, groundBottomY - totalHeight, tileSize, totalHeight);

        // Vertical brick/groove lines on the side wall
        ctx.strokeStyle = sideBorderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, groundBottomY - totalHeight, tileSize, totalHeight);
        ctx.beginPath();
        ctx.moveTo(cx + tileSize / 2, groundBottomY - totalHeight);
        ctx.lineTo(cx + tileSize / 2, groundBottomY);
        ctx.stroke();

        // C. Upper Surface Face (TopTextureComponent / ColorTexture)
        ctx.fillStyle = topColor;
        ctx.fillRect(cx, topSurfaceY, tileSize, tileSize);

        // Top surface border highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, topSurfaceY, tileSize, tileSize);

        // Top surface pattern
        if (topPattern === 'checker') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(cx, topSurfaceY, tileSize / 2, tileSize / 2);
          ctx.fillRect(cx + tileSize / 2, topSurfaceY + tileSize / 2, tileSize / 2, tileSize / 2);
        }

        // D. Fluid wave animation if active
        if (isFluid) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          const waveOffset = (Math.sin(time * 3) + 1) * 4;
          ctx.fillRect(cx + 4, topSurfaceY + waveOffset + 10, tileSize - 8, 10);
        }

        // E. Center Emoji / Icon
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, cx + tileSize / 2, topSurfaceY + tileSize / 2);

        // F. Elevation Badge if > 1
        if (elevation > 1) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.beginPath();
          ctx.roundRect(cx + tileSize - 22, topSurfaceY + 4, 18, 14, 3);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`+${elevation}`, cx + tileSize - 13, topSurfaceY + 11);
        }
      }

      // 4. Light Emission Bloom (LightComponent)
      if (lightIntensity > 0) {
        const lightRadius = 45 + lightIntensity * 25;
        const grad = ctx.createRadialGradient(
          cx + tileSize / 2,
          cy + (viewMode === 'elevated' ? -wallHeight * elevation / 2 : tileSize / 2),
          10,
          cx + tileSize / 2,
          cy + (viewMode === 'elevated' ? -wallHeight * elevation / 2 : tileSize / 2),
          lightRadius
        );
        grad.addColorStop(0, `${lightColor}80`);
        grad.addColorStop(0.5, `${lightColor}30`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(
          cx + tileSize / 2,
          cy + (viewMode === 'elevated' ? -wallHeight * elevation / 2 : tileSize / 2),
          lightRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [
    topColor,
    topPattern,
    sideColor,
    sideBorderColor,
    wallHeight,
    emoji,
    isFluid,
    lightIntensity,
    lightColor,
    groundType,
    viewMode,
    elevation,
  ]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" />
          <span>Preview do Bloco no Mundo</span>
        </h3>
        <span className="text-[10px] text-zinc-400 font-mono">BlockWorldRenderer</span>
      </div>

      {/* Canvas World Container */}
      <div className="flex flex-col items-center justify-center p-3 bg-zinc-950 rounded-xl border border-zinc-800 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={280}
          height={260}
          className="rounded-lg shadow-inner max-w-full"
        />

        {/* Floating Quick Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
          {isSolid && (
            <span className="px-2 py-0.5 rounded bg-zinc-900/90 text-zinc-200 text-[10px] font-bold border border-zinc-700 flex items-center gap-1 shadow">
              <Shield className="w-2.5 h-2.5 text-emerald-400" /> Sólido
            </span>
          )}
          {lightIntensity > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 text-[10px] font-bold border border-amber-700/60 flex items-center gap-1 shadow">
              <Sun className="w-2.5 h-2.5 text-yellow-300" /> Luz ({lightIntensity})
            </span>
          )}
        </div>
      </div>

      {/* Interactive Preview Controls */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        {/* View Mode Toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-zinc-400">Modo de Visualização</label>
          <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('elevated')}
              className={`py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                viewMode === 'elevated'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Bloco 2.5D
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                viewMode === 'flat'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Piso Plano
            </button>
          </div>
        </div>

        {/* Ground Terrain Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-zinc-400">Terreno ao Redor</label>
          <select
            value={groundType}
            onChange={(e) => setGroundType(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer h-full"
          >
            <option value="grass">🌱 Grama Verde</option>
            <option value="dirt">🟫 Terra Fértil</option>
            <option value="stone">🪨 Pedra Rocha</option>
            <option value="sand">🏖️ Areia da Praia</option>
            <option value="void">⬛ Fundo Vazio</option>
          </select>
        </div>
      </div>

      {/* Properties Summary Row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80 text-[10px]">
        <span className="font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
          id: {blockJSON.id || 'sem_id'}
        </span>
        <span className="font-semibold text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
          {blockJSON.name || 'Sem nome'}
        </span>
        <span className="text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
          Dureza: {hardness}
        </span>
        {toolTag && (
          <span className="text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50 flex items-center gap-1">
            <Wrench className="w-2.5 h-2.5" />
            <span>Ferramenta: {toolTag}</span>
          </span>
        )}
      </div>
    </div>
  );
};
