import React, { useEffect, useRef } from 'react';
import { TILE_SIZE } from '../../core/configuracao/constants';
import { Player, TileType } from '../../core/configuracao/types';
import { ChunkManager } from '../../gameplay/mundo/chunks/ChunkManager';

interface MiniMapProps {
  chunkManager: ChunkManager;
  player: Player;
  isOpen: boolean;
  onToggle: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({ chunkManager, player, isOpen, onToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 130;
    const radiusTiles = 28; // Sample tiles around player
    const centerTileX = Math.floor(player.x / TILE_SIZE);
    const centerTileY = Math.floor(player.y / TILE_SIZE);

    ctx.clearRect(0, 0, size, size);

    // Draw circular map mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    const tileSizeInMap = size / (radiusTiles * 2);

    for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
      for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        const tile: TileType = chunkManager.getTile(tx, ty);

        let color = '#22c55e';
        if (tile === 'deep_water') color = '#1d4ed8';
        else if (tile === 'water') color = '#38bdf8';
        else if (tile === 'sand') color = '#e2c589';
        else if (tile === 'dense_grass') color = '#15803d';

        ctx.fillStyle = color;
        const px = (dx + radiusTiles) * tileSizeInMap;
        const py = (dy + radiusTiles) * tileSizeInMap;
        ctx.fillRect(px, py, tileSizeInMap + 0.5, tileSizeInMap + 0.5);
      }
    }

    // Player position at center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Player ping halo
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 5.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Map Border
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Compass North Indicator
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 9px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', size / 2, 13);
  }, [chunkManager, player.x, player.y, isOpen]);

  if (!isOpen) {
    return (
      <button
        id="btn-open-minimap"
        onClick={onToggle}
        className="bg-white/90 hover:bg-white text-[#111] text-xs font-semibold px-3.5 py-2 rounded-full border border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.15)] backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
        title="Abrir Mini-mapa"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
        Radar
      </button>
    );
  }

  return (
    <div
      id="minimap-container"
      className="bg-white/90 backdrop-blur-md p-3 rounded-[16px] border border-white/60 shadow-[0_10px_25px_rgba(0,0,0,0.25)] flex flex-col items-center select-none"
    >
      <div className="flex items-center justify-between w-full px-1 pb-1.5 mb-2 border-b border-[#eee]">
        <span className="text-[10px] font-bold text-[#666] tracking-[1px] uppercase">RADAR</span>
        <button
          id="btn-close-minimap"
          onClick={onToggle}
          className="text-[#888] hover:text-[#111] text-xs px-1.5 py-0.5 hover:bg-[#f0f0f0] rounded transition cursor-pointer"
          title="Fechar"
        >
          ✕
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={130}
        height={130}
        className="rounded-full shadow-inner bg-[#1a1a1a]"
      />
    </div>
  );
};
