// 2D Simplex Noise implementation with seeded permutation table

export class SimplexNoise {
  private p: Uint8Array;
  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor(seed: number = 42) {
    this.p = new Uint8Array(256);
    // Mulberry32 PRNG
    let s = seed >>> 0;
    const rng = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = this.p[i];
      this.p[i] = this.p[j];
      this.p[j] = tmp;
    }

    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  // Grad3 vectors
  private static grad3 = new Float32Array([
    1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0,
    1, 0, 1,  -1, 0, 1,  1, 0, -1,  -1, 0, -1,
    0, 1, 1,   0, -1, 1,  0, 1, -1,   0, -1, -1,
  ]);

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

    let n0 = 0;
    let n1 = 0;
    let n2 = 0;

    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1 = 0;
    let j1 = 0;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]] * 3;
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] * 3;
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] * 3;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (SimplexNoise.grad3[gi0] * x0 + SimplexNoise.grad3[gi0 + 1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (SimplexNoise.grad3[gi1] * x1 + SimplexNoise.grad3[gi1 + 1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (SimplexNoise.grad3[gi2] * x2 + SimplexNoise.grad3[gi2 + 1] * y2);
    }

    // Scale to range [-1, 1] then normalize to [0, 1]
    const raw = 70.0 * (n0 + n1 + n2);
    return Math.max(0, Math.min(1, (raw + 1) * 0.5));
  }

  // Fractal Brownian Motion (octaves)
  fbm(x: number, y: number, octaves: number = 4, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

// Pseudo-random hash for deterministic tile entity placement
export function coordHash(x: number, y: number, seed: number = 1337): number {
  let h = seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
