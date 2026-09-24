import { FloatingText, Particle } from '../../core/configuracao/types';

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  getParticles(): Particle[] {
    return this.particles;
  }

  getFloatingTexts(): FloatingText[] {
    return this.floatingTexts;
  }

  update(dt: number) {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 38; // Float upwards
      ft.life += dt;

      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Wood chips burst when chopping
  spawnWoodChips(x: number, y: number, count: number = 7) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.4 ? '#b45309' : '#d97706',
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.35,
      });
    }
  }

  // Foliage leaf burst when harvesting bushes/trees
  spawnLeafBurst(x: number, y: number, count: number = 8) {
    const colors = ['#22c55e', '#16a34a', '#86efac', '#4ade80'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2 + 0.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 3.5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 0.5 + 0.4,
      });
    }
  }

  // Running dust puff
  spawnDustPuff(x: number, y: number) {
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI + Math.PI; // Upwards/backwards
      const speed = Math.random() * 1.2 + 0.4;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.5,
        size: Math.random() * 2.5 + 1.5,
        color: '#a3a3a3',
        alpha: 0.6,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  // Food / sparkles
  spawnFoodSparkles(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        size: Math.random() * 3 + 2,
        color: '#f43f5e',
        alpha: 1,
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  // Floating text feedback (e.g. "+3 Madeira", "+1 Flor")
  addFloatingText(text: string, x: number, y: number, color: string = '#4ade80') {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      life: 0,
      maxLife: 1.1,
    });
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
