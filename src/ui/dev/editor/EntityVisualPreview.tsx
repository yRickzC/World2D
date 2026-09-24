import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { EntityComponentSerializedData } from '../../../gameplay/EntitySystem/types';

export interface EntityVisualPreviewProps {
  id: string;
  name: string;
  tags: string[];
  components: EntityComponentSerializedData[];
}

export const EntityVisualPreview: React.FC<EntityVisualPreviewProps> = ({
  id,
  name,
  tags,
  components,
}) => {
  const [stageBg, setStageBg] = useState<'grid' | 'grass' | 'stone' | 'dark'>('grass');
  const [showHitbox, setShowHitbox] = useState<boolean>(true);
  const [animate, setAnimate] = useState<boolean>(true);

  // Extract components
  const nameComp = components.find((c) => c.type === 'NameComponent');
  const healthComp = components.find((c) => c.type === 'HealthComponent');
  const movementComp = components.find((c) => c.type === 'MovementComponent');
  const styleComp = components.find((c) => c.type === 'StyleComponent');
  const combatComp = components.find((c) => c.type === 'CombatComponent');
  const aiComp = components.find((c) => c.type === 'AIComponent');
  const physicsComp = components.find((c) => c.type === 'PhysicsComponent');
  const spawnComp = components.find((c) => c.type === 'EntitySpawnComponent');

  // Values
  const displayName = nameComp?.data?.name || name || 'Entidade Sem Nome';
  const maxHealth = healthComp?.data?.maxHealth ?? 100;
  const currentHealth = healthComp?.data?.currentHealth ?? maxHealth;
  const invulnerable = Boolean(healthComp?.data?.invulnerable);
  const speed = movementComp?.data?.speed ?? 2.5;
  const damage = combatComp?.data?.damage;
  const behavior = aiComp?.data?.behavior;

  // Style attributes
  const styleMode = styleComp?.data?.mode || 'emoji';
  const styleValue = styleComp?.data?.value || '👾';
  const styleSize = styleComp?.data?.size || 40;
  const styleScale = styleComp?.data?.scale || 1.0;
  const styleTint = styleComp?.data?.tint || '';

  // Background style
  const getStageBgStyle = () => {
    switch (stageBg) {
      case 'grass':
        return 'bg-emerald-950/70 border-emerald-900/60 [background-image:radial-gradient(#15803d_1px,transparent_1px)] [background-size:16px_16px]';
      case 'stone':
        return 'bg-zinc-950 border-zinc-800 [background-image:radial-gradient(#52525b_1px,transparent_1px)] [background-size:16px_16px]';
      case 'dark':
        return 'bg-zinc-950 border-zinc-900';
      case 'grid':
      default:
        return 'bg-zinc-950/90 border-zinc-800 [background-image:linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] [background-size:24px_24px]';
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Background and controls bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-400">Cenário:</span>
          {(['grass', 'stone', 'grid', 'dark'] as const).map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => setStageBg(bg)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer capitalize ${
                stageBg === bg
                  ? 'bg-zinc-700 text-zinc-100 border border-zinc-600'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer select-none text-[11px]">
            <input
              type="checkbox"
              checked={showHitbox}
              onChange={(e) => setShowHitbox(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-3 h-3"
            />
            <span>Hitbox</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer select-none text-[11px]">
            <input
              type="checkbox"
              checked={animate}
              onChange={(e) => setAnimate(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-3 h-3"
            />
            <span>Respiração</span>
          </label>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div
        className={`relative w-full h-64 rounded-xl border flex flex-col items-center justify-center overflow-hidden shadow-inner select-none transition-colors ${getStageBgStyle()}`}
      >
        {/* World Coordinates / Center Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
          <div className="w-full h-px bg-zinc-400" />
          <div className="absolute h-full w-px bg-zinc-400" />
        </div>

        {/* Entity Container */}
        <div className="relative flex flex-col items-center justify-center z-10">
          {/* Nametag overlay */}
          <div className="mb-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-zinc-700 text-[11px] font-bold text-zinc-100 shadow-md flex items-center gap-1.5 whitespace-nowrap">
            {behavior === 'hostile' && <span className="text-rose-400 font-bold">☠</span>}
            {behavior === 'passive' && <span className="text-emerald-400">🕊</span>}
            <span>{displayName}</span>
            {invulnerable && <Shield className="w-3 h-3 text-amber-400 inline" />}
          </div>

          {/* Health Bar (if HealthComponent present) */}
          {healthComp && (
            <div className="w-20 h-2 bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-700/80 mb-2 shadow-sm">
              <div
                className={`h-full transition-all duration-300 ${
                  invulnerable
                    ? 'bg-amber-400'
                    : currentHealth / maxHealth > 0.5
                    ? 'bg-emerald-500'
                    : currentHealth / maxHealth > 0.25
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (currentHealth / maxHealth) * 100))}%`,
                }}
              />
            </div>
          )}

          {/* Physical Body & Style Representation */}
          <div
            className={`relative flex items-center justify-center transition-transform ${
              animate ? 'animate-bounce [animation-duration:2.5s]' : ''
            }`}
            style={{
              width: `${Math.max(32, styleSize)}px`,
              height: `${Math.max(32, styleSize)}px`,
            }}
          >
            {/* Hitbox bounding box */}
            {showHitbox && (
              <div className="absolute inset-0 border border-dashed border-emerald-400/70 rounded-md pointer-events-none bg-emerald-500/10" />
            )}

            {/* Shadow beneath avatar */}
            <div className="absolute -bottom-2 w-3/4 h-2 bg-black/40 rounded-full blur-[2px] pointer-events-none" />

            {/* Render Style: Emoji */}
            {styleMode === 'emoji' && (
              <span
                role="img"
                aria-label={displayName}
                className="select-none leading-none drop-shadow-md"
                style={{
                  fontSize: `${styleSize}px`,
                  transform: `scale(${styleScale})`,
                  filter: styleTint ? `drop-shadow(0 0 8px ${styleTint})` : undefined,
                }}
              >
                {styleValue || '👾'}
              </span>
            )}

            {/* Render Style: SVG */}
            {styleMode === 'svg' && (
              <div
                className="w-full h-full flex items-center justify-center select-none"
                style={{
                  transform: `scale(${styleScale})`,
                  filter: styleTint ? `drop-shadow(0 0 8px ${styleTint})` : undefined,
                }}
                dangerouslySetInnerHTML={{
                  __html: styleValue.startsWith('<svg')
                    ? styleValue
                    : `<svg viewBox="0 0 100 100" width="${styleSize}" height="${styleSize}" fill="currentColor" class="text-zinc-200">${styleValue}</svg>`,
                }}
              />
            )}

            {/* Render Style: Color Box */}
            {styleMode === 'color' && (
              <div
                className="rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-white border border-white/20"
                style={{
                  width: `${styleSize}px`,
                  height: `${styleSize}px`,
                  backgroundColor: styleValue.startsWith('#') ? styleValue : '#38bdf8',
                  transform: `scale(${styleScale})`,
                  boxShadow: styleTint ? `0 0 16px ${styleTint}` : undefined,
                }}
              >
                {name.substring(0, 2).toUpperCase() || 'EN'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats overlay badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 flex-wrap">
          {healthComp && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] font-semibold text-rose-300">
              <Heart className="w-3 h-3 text-rose-400" />
              {currentHealth}/{maxHealth} HP
            </span>
          )}
          {movementComp && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] font-semibold text-sky-300">
              <Zap className="w-3 h-3 text-sky-400" />
              {speed} px/t
            </span>
          )}
          {combatComp && typeof damage === 'number' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] font-semibold text-amber-300">
              <Swords className="w-3 h-3 text-amber-400" />
              {damage} DMG
            </span>
          )}
        </div>

        {/* Tags badge pill at top-right */}
        {tags && tags.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 flex-wrap max-w-[200px] justify-end">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-[9px] font-semibold text-zinc-400"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[9px] text-zinc-500 font-bold">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Spawn Rules Summary (if EntitySpawnComponent present) */}
      {spawnComp && (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <span>🌱</span> Regras de Nascimento (EntitySpawnComponent)
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Taxa: {spawnComp.data?.spawnRate ?? 5}s • Chance: {Math.round(((spawnComp.data?.spawnChance ?? 0.25) * 100))}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Time Window */}
            <div className="flex flex-col gap-0.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
              <span className="text-[10px] text-zinc-400 font-medium">Período / Horário</span>
              <span className="text-xs font-semibold text-zinc-200 capitalize">
                {spawnComp.data?.time?.mode === 'night'
                  ? '🌙 Noturno (18h-06h)'
                  : spawnComp.data?.time?.mode === 'day'
                  ? '☀️ Diurno (06h-18h)'
                  : spawnComp.data?.time?.mode === 'custom'
                  ? `⏱️ ${spawnComp.data?.time?.startTime} - ${spawnComp.data?.time?.endTime}`
                  : '☀️🌙 Qualquer Horário'}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-0.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
              <span className="text-[10px] text-zinc-400 font-medium">Quantidade / Grupo</span>
              <span className="text-xs font-semibold text-zinc-200">
                {spawnComp.data?.minCount ?? 1} ~ {spawnComp.data?.maxCount ?? 3} (Cap: {spawnComp.data?.maxNearby ?? 8})
              </span>
            </div>

            {/* Distance */}
            <div className="flex flex-col gap-0.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
              <span className="text-[10px] text-zinc-400 font-medium">Distância do Jogador</span>
              <span className="text-xs font-semibold text-zinc-200">
                {spawnComp.data?.minDistance ?? 160}px - {spawnComp.data?.maxDistance ?? 550}px
              </span>
            </div>

            {/* Water / Aquatic */}
            <div className="flex flex-col gap-0.5 bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
              <span className="text-[10px] text-zinc-400 font-medium">Superfície Especial</span>
              <span className="text-xs font-semibold text-zinc-200">
                {spawnComp.data?.allowWater ? '💧 Permite Água' : '🌿 Apenas Solo Firme'}
              </span>
            </div>
          </div>

          {/* Biomes & Blocks */}
          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
            {spawnComp.data?.allowedBiomes && spawnComp.data.allowedBiomes.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 font-medium">Biomas:</span>
                {spawnComp.data.allowedBiomes.map((b: string) => (
                  <span key={b} className="px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded font-mono text-[10px]">
                    {b}
                  </span>
                ))}
              </div>
            )}
            {spawnComp.data?.allowedBlocks && spawnComp.data.allowedBlocks.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 font-medium">Blocos:</span>
                {spawnComp.data.allowedBlocks.map((blk: string) => (
                  <span key={blk} className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded font-mono text-[10px]">
                    {blk}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
