import { Player } from '../../../core/configuracao/types';

export class PlayerRenderer {
  renderPlayer(ctx: CanvasRenderingContext2D, player: Player, time: number) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Walking animation cycle
    const isMoving = player.isMoving;
    const walkCycle = isMoving ? Math.sin(time * (player.isRunning ? 0.016 : 0.01)) : 0;
    const legOffset = walkCycle * 5;
    const bobbing = isMoving ? Math.abs(Math.sin(time * (player.isRunning ? 0.016 : 0.01))) * 2.5 : 0;

    // 1. Soft Ground Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 11, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Legs / Shoes
    ctx.fillStyle = '#334155'; // Dark boots
    if (player.facing === 'left' || player.facing === 'right') {
      const dir = player.facing === 'right' ? 1 : -1;
      ctx.fillRect(-3 + legOffset * dir, 7, 5, 5);
      ctx.fillRect(-1 - legOffset * dir, 7, 5, 5);
    } else {
      // Facing up or down
      ctx.fillRect(-6, 7 + (legOffset > 0 ? legOffset * 0.6 : 0), 4, 5);
      ctx.fillRect(2, 7 - (legOffset < 0 ? legOffset * 0.6 : 0), 4, 5);
    }

    // 3. Torso / Clothes (with subtle bobbing)
    ctx.translate(0, -bobbing);

    // Explorer blue/teal tunic
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 13, 3);
    ctx.fill();

    // Belt & Gold buckle
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, 4, 16, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-2, 4, 4, 3);

    // Arms
    ctx.fillStyle = '#0369a1';
    if (player.facing === 'down') {
      ctx.fillRect(-10, -2 + legOffset * 0.5, 3, 8);
      ctx.fillRect(7, -2 - legOffset * 0.5, 3, 8);
    } else if (player.facing === 'up') {
      ctx.fillRect(-10, -2 - legOffset * 0.5, 3, 8);
      ctx.fillRect(7, -2 + legOffset * 0.5, 3, 8);
      // Backpack visible when facing up
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(-6, -3, 12, 8, 2);
      ctx.fill();
    } else if (player.facing === 'left') {
      ctx.fillRect(-2 + legOffset * 0.5, -2, 4, 7);
      // Satchel on side
      ctx.fillStyle = '#b45309';
      ctx.fillRect(3, 1, 4, 5);
    } else {
      // Right
      ctx.fillRect(-2 - legOffset * 0.5, -2, 4, 7);
      // Satchel on side
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-7, 1, 4, 5);
    }

    // 4. Head & Face
    // Head skin tone
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Adventurer hair / cap
    ctx.fillStyle = '#854d0e'; // Brown hair
    if (player.facing === 'down') {
      ctx.beginPath();
      ctx.arc(0, -13, 8.5, Math.PI, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, -10, 2, 2.5);
      ctx.fillRect(2, -10, 2, 2.5);
    } else if (player.facing === 'up') {
      // Full back of hair
      ctx.beginPath();
      ctx.arc(0, -11, 8.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.facing === 'left') {
      ctx.beginPath();
      ctx.arc(1, -12, 8.5, Math.PI * 0.8, Math.PI * 1.9);
      ctx.fill();
      // Eye profile
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-5, -10, 2, 2.5);
    } else {
      // Facing right
      ctx.beginPath();
      ctx.arc(-1, -12, 8.5, Math.PI * 1.1, Math.PI * 2.2);
      ctx.fill();
      // Eye profile
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(3, -10, 2, 2.5);
    }

    // Explorer Feathery Cap / Hat
    ctx.fillStyle = '#15803d'; // Green ranger hat
    ctx.beginPath();
    ctx.ellipse(0, -15, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hat feather
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(3, -16);
    ctx.lineTo(7, -22);
    ctx.lineTo(4, -18);
    ctx.fill();

    ctx.restore();
  }
}
