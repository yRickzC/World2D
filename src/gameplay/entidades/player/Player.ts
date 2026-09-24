import { Player } from '../../../core/configuracao/types';

export function createInitialPlayer(x: number = 0, y: number = 0): Player {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    speed: 165,
    runSpeed: 290,
    isRunning: false,
    facing: 'down',
    animFrame: 0,
    animTimer: 0,
    isMoving: false,
    isInteracting: false,
    interactTimer: 0,
  };
}
