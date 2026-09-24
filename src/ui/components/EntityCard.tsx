import React from 'react';
import {
  Code2,
  Edit3,
  Heart,
  Layers,
  Shield,
  Swords,
  Zap,
} from 'lucide-react';
import { EntityDefinition } from '../../gameplay/EntitySystem/EntityDefinition';
import { Button } from './Button';

export interface EntityCardProps {
  entity: EntityDefinition;
  onEdit: (entity: EntityDefinition) => void;
  onInspect?: (entity: EntityDefinition) => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  onEdit,
  onInspect,
}) => {
  const json = entity.toJSON();
  const components = entity.getAllComponents();

  // Extract components
  const nameComp = components.find((c) => c.type === 'NameComponent');
  const healthComp = components.find((c) => c.type === 'HealthComponent');
  const movementComp = components.find((c) => c.type === 'MovementComponent');
  const styleComp = components.find((c) => c.type === 'StyleComponent');
  const combatComp = components.find((c) => c.type === 'CombatComponent');
  const aiComp = components.find((c) => c.type === 'AIComponent');

  const displayName = nameComp?.data?.name || entity.name || entity.id;
  const styleMode = styleComp?.data?.mode || 'emoji';
  const styleValue = styleComp?.data?.value || '👾';
  const styleTint = styleComp?.data?.tint;

  const maxHealth = healthComp?.data?.maxHealth ?? 100;
  const invulnerable = Boolean(healthComp?.data?.invulnerable);
  const speed = movementComp?.data?.speed ?? 2.5;
  const damage = combatComp?.data?.damage;
  const behavior = aiComp?.data?.behavior || 'neutral';

  const tags = entity.getTags();

  return (
    <div
      id={`entity-card-${entity.id}`}
      className="group relative bg-zinc-900/90 hover:bg-zinc-850/90 border border-zinc-800 hover:border-zinc-700/90 rounded-2xl p-4 shadow-md transition-all duration-150 flex flex-col justify-between gap-3 select-none"
    >
      <div className="flex items-start gap-3.5">
        {/* Visual Avatar */}
        <div
          className="w-14 h-14 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative"
          style={{
            boxShadow: styleTint ? `0 0 12px ${styleTint}40` : undefined,
          }}
        >
          {styleMode === 'emoji' && (
            <span role="img" aria-label={displayName}>
              {styleValue}
            </span>
          )}
          {styleMode === 'svg' && (
            <div
              className="w-10 h-10 flex items-center justify-center text-zinc-200"
              dangerouslySetInnerHTML={{
                __html: styleValue.startsWith('<svg')
                  ? styleValue
                  : `<svg viewBox="0 0 100 100" width="36" height="36" fill="currentColor">${styleValue}</svg>`,
              }}
            />
          )}
          {styleMode === 'color' && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white"
              style={{ backgroundColor: styleValue }}
            >
              {entity.name.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Title, ID & Tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
              {displayName}
            </h4>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide shrink-0 ${
                behavior === 'hostile'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                  : behavior === 'passive'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                  : behavior === 'fleeing'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              {behavior}
            </span>
          </div>

          <p className="text-[11px] font-mono text-zinc-400 mt-0.5 truncate">
            id: {entity.id}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[10px] font-medium text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] text-zinc-500 font-semibold self-center">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Component stats badges */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800/80 text-[11px]">
        <div className="flex items-center gap-1 text-zinc-400">
          <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="font-semibold text-zinc-200">
            {invulnerable ? '∞' : `${maxHealth} HP`}
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="font-semibold text-zinc-200">{speed} spd</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          {damage !== undefined ? (
            <>
              <Swords className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-zinc-200">{damage} dmg</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold text-zinc-200">
                {components.length} comps
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          id={`btn-edit-entity-${entity.id}`}
          size="sm"
          variant="secondary"
          className="flex-1 text-xs py-1.5"
          onClick={() => onEdit(entity)}
        >
          <Edit3 className="w-3.5 h-3.5 mr-1" />
          Editar
        </Button>

        {onInspect && (
          <Button
            id={`btn-inspect-entity-${entity.id}`}
            size="sm"
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 px-2 py-1.5 text-xs"
            onClick={() => onInspect(entity)}
            title="Inspecionar Definição JSON"
          >
            <Code2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
