import { Player } from '../../../core/configuracao/types';
import { lerp } from '../../../core/utilitarios/math';
import { SoundManager } from '../../../sistemas/audio/SoundManager';
import { ParticleSystem } from '../../../sistemas/particulas/ParticleSystem';
import { ChunkManager } from '../../mundo/chunks/ChunkManager';

export interface PlayerMovementContext {
  player: Player;
  inputX: number;
  inputY: number;
  isShift: boolean;
  dt: number;
  chunkManager: ChunkManager;
  soundManager: SoundManager;
  particleSystem: ParticleSystem;
  lastStepSoundTime: number;
  onStepSoundTriggered: (time: number) => void;
}

export function updatePlayerMovement(ctx: PlayerMovementContext) {
  const {
    player,
    inputX,
    inputY,
    isShift,
    dt,
    chunkManager,
    soundManager,
    particleSystem,
    lastStepSoundTime,
    onStepSoundTriggered,
  } = ctx;

  const inputMagnitude = Math.hypot(inputX, inputY);
  const isMoving = inputMagnitude > 0.05;
  player.isMoving = isMoving;
  player.isRunning = isShift && isMoving;

  const currentMaxSpeed = player.isRunning ? player.runSpeed : player.speed;

  let normX = 0;
  let normY = 0;
  if (isMoving) {
    normX = inputX / inputMagnitude;
    normY = inputY / inputMagnitude;
  }

  const targetVx = normX * currentMaxSpeed;
  const targetVy = normY * currentMaxSpeed;

  const accel = isMoving ? 16 : 22;
  player.vx = lerp(player.vx, targetVx, Math.min(1, dt * accel));
  player.vy = lerp(player.vy, targetVy, Math.min(1, dt * accel));

  // Update facing direction
  if (isMoving) {
    if (Math.abs(normX) > Math.abs(normY)) {
      player.facing = normX > 0 ? 'right' : 'left';
    } else {
      player.facing = normY > 0 ? 'down' : 'up';
    }
  }

  // Update walk animation frame
  if (isMoving) {
    player.animTimer += dt * (player.isRunning ? 12 : 7.5);
    player.animFrame = Math.floor(player.animTimer) % 4;

    // Trigger footstep sound and running dust
    const now = performance.now();
    const stepInterval = player.isRunning ? 220 : 340;
    if (now - lastStepSoundTime >= stepInterval) {
      const surface = chunkManager.getGroundType(player.x, player.y);
      const soundSurface = surface === 'sand' ? 'sand' : surface === 'water' ? 'water' : 'grass';
      soundManager.playFootstep(soundSurface);
      onStepSoundTriggered(now);

      if (player.isRunning) {
        particleSystem.spawnDustPuff(player.x, player.y + 12);
      }
    }
  } else {
    player.animFrame = 0;
    player.animTimer = 0;
  }

  // Separate axis collision resolution
  const nextX = player.x + player.vx * dt;
  const nextY = player.y + player.vy * dt;
  const collisionRadius = 11;

  if (!chunkManager.isSolid(nextX, player.y, collisionRadius)) {
    player.x = nextX;
  } else {
    player.vx = 0;
  }

  if (!chunkManager.isSolid(player.x, nextY, collisionRadius)) {
    player.y = nextY;
  } else {
    player.vy = 0;
  }
}
