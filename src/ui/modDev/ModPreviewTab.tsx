import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Compass,
  Layers,
  RefreshCw,
  Shield,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { WorldVisualPreview } from '../dev/editor/WorldVisualPreview';
import { World } from '../../gameplay/mundo/World';
import { globalWorldRegistry } from '../../gameplay/mundo/WorldRegistry';
import { ModPackage } from '../../mods';

export interface ModPreviewTabProps {
  pkg: ModPackage;
}

export const ModPreviewTab: React.FC<ModPreviewTabProps> = ({ pkg }) => {
  const [seed, setSeed] = useState(837492);
  const [regenKey, setRegenKey] = useState(1);

  const isCore = pkg.isCore || pkg.manifest.id === 'core';

  // Base world for previewing
  const previewWorld = useMemo(() => {
    // Pick the primary surface/world from registry
    const worlds = globalWorldRegistry.getAll();
    const base = worlds.length > 0 ? worlds[0] : new World('preview_world', 'Preview World', seed);
    // Clone and assign seed
    const worldInstance = World.fromJSON(base.toJSON());
    worldInstance.seed = seed;
    return worldInstance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, regenKey]);

  const handleRandomSeed = () => {
    const nextSeed = Math.floor(Math.random() * 900000) + 100000;
    setSeed(nextSeed);
  };

  const handleRegenerate = () => {
    setRegenKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Mod Preview Header */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              Preview do Mundo em Tempo Real
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              WorldGenerator Real
            </span>
          </div>
          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>Ambiente composto por:</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Shield className="w-3 h-3 text-amber-400" /> Core
            </span>
            {!isCore && (
              <>
                <span>+</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  <Boxes className="w-3 h-3 text-sky-400" /> {pkg.manifest.name} ({pkg.manifest.id})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Seed Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-24 font-mono font-bold text-amber-300 bg-transparent focus:outline-none text-xs"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRandomSeed}
            icon={<Shuffle className="w-3.5 h-3.5" />}
          >
            Random Seed
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRegenerate}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate
          </Button>
        </div>
      </div>

      {/* World Preview Canvas Container */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950 p-2 shadow-2xl">
        <WorldVisualPreview
          key={`${seed}-${regenKey}`}
          world={previewWorld}
          activeSurfaceId={previewWorld.getDefaultSurface()?.id}
        />
      </div>
    </div>
  );
};
