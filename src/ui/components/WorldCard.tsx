import React from 'react';
import { Calendar, Clock, Copy, Hash, Play, Trash2 } from 'lucide-react';
import { WorldData } from '../../gameplay/mundo/WorldStorage';
import { Button } from './Button';

export interface WorldCardProps {
  world: WorldData;
  onPlay: (world: WorldData) => void;
  onDelete: (world: WorldData) => void;
}

export const WorldCard: React.FC<WorldCardProps> = ({ world, onPlay, onDelete }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopySeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(world.seed.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div
      id={`world-card-${world.id}`}
      className="group relative bg-zinc-900/90 hover:bg-zinc-850/90 border border-zinc-800 hover:border-zinc-700/90 rounded-2xl p-5 shadow-lg transition-all duration-150 flex flex-col justify-between gap-4 select-none"
    >
      {/* Top Details */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
            🌲
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white tracking-wide truncate group-hover:text-amber-400 transition-colors">
              {world.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-700/60">
                <Hash className="w-3 h-3 text-amber-400" />
                <span>Seed: {world.seed}</span>
              </span>
              <button
                type="button"
                onClick={handleCopySeed}
                className="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Copiar Seed"
              >
                <Copy className="w-3 h-3" />
              </button>
              {copied && <span className="text-[10px] text-emerald-400 font-semibold">Copiada!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Meta timestamps */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 border-t border-zinc-800/70 pt-3">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Jogado: {formatDate(world.lastPlayedAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>Criado: {new Date(world.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(world)}
          icon={<Trash2 className="w-3.5 h-3.5" />}
          title={`Apagar mundo ${world.name}`}
        >
          Apagar
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={() => onPlay(world)}
          icon={<Play className="w-4 h-4 fill-current" />}
          className="px-5 font-bold"
        >
          Jogar
        </Button>
      </div>
    </div>
  );
};
