import { Player, WorldEntity } from '../../../core/configuracao/types';
import { EntityDefinition } from '../../EntitySystem/EntityDefinition';
import { NameComponent } from '../../EntitySystem/components/NameComponent';
import { HealthComponent } from '../../EntitySystem/components/HealthComponent';
import { MovementComponent } from '../../EntitySystem/components/MovementComponent';
import { StyleComponent } from '../../EntitySystem/components/StyleComponent';
import { CombatComponent } from '../../EntitySystem/components/CombatComponent';
import { AIComponent } from '../../EntitySystem/components/AIComponent';

export function createWorldEntityFromDefinition(
  def: EntityDefinition,
  x: number,
  y: number
): WorldEntity {
  const nameComp = def.getComponent<NameComponent>('Name');
  const healthComp = def.getComponent<HealthComponent>('Health');
  const movementComp = def.getComponent<MovementComponent>('Movement');
  const styleComp = def.getComponent<StyleComponent>('Style');
  const combatComp = def.getComponent<CombatComponent>('Combat');
  const aiComp = def.getComponent<AIComponent>('AI');

  const maxHp = healthComp?.maxHealth ?? 100;
  const hp = healthComp?.currentHealth ?? maxHp;
  const size = styleComp?.size || 36;

  // Fallback emojis by definition id
  let defaultEmoji = '👾';
  if (def.id === 'zombie') defaultEmoji = '🧟';
  else if (def.id === 'skeleton') defaultEmoji = '💀';
  else if (def.id === 'cow') defaultEmoji = '🐄';
  else if (def.id === 'chicken') defaultEmoji = '🐔';
  else if (def.id === 'pig') defaultEmoji = '🐷';
  else if (def.id === 'slime') defaultEmoji = '🟢';
  else if (def.id === 'merchant') defaultEmoji = '🧙';

  return {
    id: `${def.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: def.id,
    x,
    y,
    width: size,
    height: size,
    variant: 0,
    swayOffset: Math.random() * Math.PI * 2,
    health: hp,
    maxHealth: maxHp,
    isLiving: true,
    entityDefId: def.id,
    name: nameComp?.name || def.name,
    styleEmoji: styleComp?.value || defaultEmoji,
    styleSize: size,
    styleColor: styleComp?.tint || '#ffffff',
    behavior: aiComp?.behavior || (def.hasTag('hostile') ? 'hostile' : 'passive'),
    speed: movementComp?.speed || 2.0,
    detectionRadius: aiComp?.detectionRadius || 160,
    damage: combatComp?.damage || 10,
    attackRange: combatComp?.attackRange || 28,
    attackCooldown: combatComp?.attackCooldown || 1.2,
    attackTimer: 0,
    vx: 0,
    vy: 0,
    facing: Math.random() > 0.5 ? 'right' : 'left',
    wanderTimer: Math.random() * 3 + 1,
    wanderTarget: null,
    state: 'idle',
  };
}

export function updateWorldEntity(
  ent: WorldEntity,
  dt: number,
  player?: Player,
  isSolidCheck?: (x: number, y: number, radius?: number) => boolean
) {
  // Hit shake decay
  if (ent.hitShake && ent.hitShake > 0) {
    ent.hitShake = Math.max(0, ent.hitShake - dt * 12);
  }

  // Living entity AI & movement
  if (ent.isLiving) {
    updateLivingEntityAI(ent, dt, player, isSolidCheck);
  }
}

export function updateLivingEntityAI(
  ent: WorldEntity,
  dt: number,
  player?: Player,
  isSolidCheck?: (x: number, y: number, radius?: number) => boolean
) {
  if (ent.attackTimer && ent.attackTimer > 0) {
    ent.attackTimer = Math.max(0, ent.attackTimer - dt);
  }

  const speedPx = (ent.speed || 2.0) * 45 * dt;

  // 1. Hostile behavior: hunt player if in range
  if (ent.behavior === 'hostile' && player) {
    const distToPlayer = Math.hypot(player.x - ent.x, player.y - ent.y);
    const detectionRadius = ent.detectionRadius || 160;

    if (distToPlayer <= detectionRadius && distToPlayer > 18) {
      ent.state = 'chase';
      const dirX = (player.x - ent.x) / distToPlayer;
      const dirY = (player.y - ent.y) / distToPlayer;

      ent.facing = dirX < 0 ? 'left' : 'right';

      const nextX = ent.x + dirX * speedPx;
      const nextY = ent.y + dirY * speedPx;

      if (!isSolidCheck || !isSolidCheck(nextX, nextY, 10)) {
        ent.x = nextX;
        ent.y = nextY;
      }
      return;
    }
  }

  // 2. Passive or idle wandering
  ent.wanderTimer = (ent.wanderTimer || 0) - dt;
  if (ent.wanderTimer <= 0) {
    if (ent.state === 'wander' || !ent.wanderTarget) {
      // Switch to idle for 2-4 seconds
      ent.state = 'idle';
      ent.wanderTarget = null;
      ent.wanderTimer = Math.random() * 3 + 2;
    } else {
      // Pick random wander target nearby (radius 40-70px)
      ent.state = 'wander';
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 35 + 25;
      ent.wanderTarget = {
        x: ent.x + Math.cos(angle) * dist,
        y: ent.y + Math.sin(angle) * dist,
      };
      ent.wanderTimer = Math.random() * 2.5 + 1.5;
    }
  }

  if (ent.state === 'wander' && ent.wanderTarget) {
    const dx = ent.wanderTarget.x - ent.x;
    const dy = ent.wanderTarget.y - ent.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 4) {
      const dirX = dx / dist;
      const dirY = dy / dist;
      ent.facing = dirX < 0 ? 'left' : 'right';

      const wanderSpeed = speedPx * 0.55;
      const nextX = ent.x + dirX * wanderSpeed;
      const nextY = ent.y + dirY * wanderSpeed;

      if (!isSolidCheck || !isSolidCheck(nextX, nextY, 10)) {
        ent.x = nextX;
        ent.y = nextY;
      } else {
        ent.wanderTarget = null;
        ent.state = 'idle';
      }
    } else {
      ent.wanderTarget = null;
      ent.state = 'idle';
    }
  }
}
