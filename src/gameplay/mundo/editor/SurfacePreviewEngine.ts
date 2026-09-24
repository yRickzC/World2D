import { Surface } from '../superficie/Surface';
import { BiomeDefinition } from '../biomas/BiomeDefinition';
import { GroundComponent, GroundDefinition } from '../biomas/componentes/GroundComponent';
import { PatchComponent, PatchEntry } from '../biomas/componentes/PatchComponent';
import { ScatterComponent, ScatterEntry } from '../biomas/componentes/ScatterComponent';
import { BiomeVegetationComponent, VegetationEntry } from '../biomas/componentes/BiomeVegetationComponent';
import { RainComponent } from '../biomas/componentes/RainComponent';
import { FogComponent } from '../biomas/componentes/FogComponent';
import { BiomeTemperatureComponent } from '../biomas/componentes/BiomeTemperatureComponent';
import { BiomeHumidityComponent } from '../biomas/componentes/BiomeHumidityComponent';
import { BlockDefinition } from '../../BlockSystem/BlockDefinition';
import { globalBlockDB } from '../../BlockSystem/BlockDB';
import { ColorTextureComponent, EmojiIconComponent } from '../../BlockSystem/components';
import { WeatherRenderer } from '../clima/WeatherRenderer';
import { ResolvedClimate } from '../clima/WeatherTypes';

export interface PreviewTile {
  x: number;
  y: number;
  biomeId: string;
  biomeName: string;
  groundId: string;
  groundName: string;
  blockId: string;
  blockName: string;
  blockColor: string;
  blockEmoji: string;
  patchId?: string;
  scatterItem?: {
    id: string;
    name?: string;
    scale: number;
    rotation: number;
  };
  vegetationItem?: {
    id: string;
    name?: string;
  };
  temperature: number;
  humidity: number;
  rainChance: number;
}

export interface PreviewGrid {
  cols: number;
  rows: number;
  seed: number;
  tiles: PreviewTile[][];
}

// Deterministic PRNG
export function createPRNG(seed: number) {
  let s = Math.floor(Math.abs(seed)) || 12345;
  return function next(): number {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Simple 2D Noise approximation for patches
export function simpleNoise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + (seed % 1000) * 0.1) * 43758.5453123;
  return n - Math.floor(n);
}

export function smoothNoise2D(x: number, y: number, seed: number, scale: number = 4): number {
  const sx = x / scale;
  const sy = y / scale;
  const x0 = Math.floor(sx);
  const x1 = x0 + 1;
  const y0 = Math.floor(sy);
  const y1 = y0 + 1;

  const dx = sx - x0;
  const dy = sy - y0;

  const n00 = simpleNoise2D(x0, y0, seed);
  const n10 = simpleNoise2D(x1, y0, seed);
  const n01 = simpleNoise2D(x0, y1, seed);
  const n11 = simpleNoise2D(x1, y1, seed);

  const nx0 = n00 * (1 - dx) + n10 * dx;
  const nx1 = n01 * (1 - dx) + n11 * dx;

  return nx0 * (1 - dy) + nx1 * dy;
}

export class SurfacePreviewEngine {
  private weatherRenderer: WeatherRenderer = new WeatherRenderer();

  /**
   * Generates an isolated procedural preview grid for a Surface or specific Biome.
   */
  generateGrid(
    surface: Surface,
    targetBiomeId?: string,
    cols: number = 32,
    rows: number = 22,
    seedModifier: number = 0
  ): PreviewGrid {
    const seed = (surface.seed || 12345) + seedModifier;
    const rng = createPRNG(seed);
    const tiles: PreviewTile[][] = [];

    const biomes = surface.getAllBiomes();
    const activeBiome = targetBiomeId ? surface.getBiome(targetBiomeId) : undefined;

    for (let r = 0; r < rows; r++) {
      tiles[r] = [];
      for (let c = 0; c < cols; c++) {
        // 1. Resolve Biome
        let biome: BiomeDefinition;
        if (activeBiome) {
          biome = activeBiome;
        } else if (biomes.length > 0) {
          // If viewing the entire surface, distribute biomes smoothly
          const biomeNoise = smoothNoise2D(c, r, seed, 8);
          const biomeIndex = Math.floor(biomeNoise * biomes.length) % biomes.length;
          biome = biomes[biomeIndex] || biomes[0];
        } else {
          biome = new BiomeDefinition('plains', 'Planície');
        }

        // 2. Resolve Ground
        const groundComp = biome.getComponent<GroundComponent>('Ground');
        let chosenGround: GroundDefinition | undefined = undefined;

        if (groundComp && groundComp.grounds.length > 0) {
          const grounds = groundComp.grounds;
          if (grounds.length === 1) {
            chosenGround = grounds[0];
          } else {
            // Weighted selection influenced by spatial noise
            const totalWeight = grounds.reduce((acc, g) => acc + (g.weight || 1), 0);
            const noiseVal = smoothNoise2D(c, r, seed + 101, 5);
            let roll = noiseVal * totalWeight;
            for (const g of grounds) {
              roll -= g.weight || 1;
              if (roll <= 0) {
                chosenGround = g;
                break;
              }
            }
            if (!chosenGround) chosenGround = grounds[0];
          }
        }

        // Fallback default ground
        if (!chosenGround) {
          chosenGround = {
            id: 'grass_ground',
            name: 'Grass Ground',
            weight: 100,
            layers: [{ block: 'grass', depth: 1 }],
          };
        }

        let resolvedBlockId = chosenGround.layers[0]?.block || 'grass';
        let patchAppliedId: string | undefined = undefined;

        // 3. Evaluate PatchComponent
        const patchComp = biome.getComponent<PatchComponent>('Patch');
        if (patchComp && patchComp.entries.length > 0) {
          for (let pIdx = 0; pIdx < patchComp.entries.length; pIdx++) {
            const patch = patchComp.entries[pIdx];
            const pNoise = smoothNoise2D(c, r, seed + 200 + pIdx * 50, (patch.size?.min || 3) + 1);
            if (pNoise > 1.0 - (patch.chance || 0.15)) {
              resolvedBlockId = patch.target;
              patchAppliedId = patch.id;
              break;
            }
          }
        }

        // 4. Look up real BlockDefinition in BlockDB
        const blockDef = globalBlockDB.getBlock(resolvedBlockId);
        const colorComp = blockDef.getComponent<ColorTextureComponent>('color_texture');
        const emojiComp = blockDef.getComponent<EmojiIconComponent>('emoji_icon');
        const blockColor = colorComp?.primaryColor || (resolvedBlockId === 'water' ? '#38bdf8' : '#22c55e');
        const blockEmoji = emojiComp?.emoji || (resolvedBlockId === 'water' ? '💧' : '🌱');

        // 5. Climate Stats
        const tempComp = biome.getComponent<BiomeTemperatureComponent>('Temperature');
        const humComp = biome.getComponent<BiomeHumidityComponent>('Humidity');
        const rainComp = biome.getComponent<RainComponent>('Rain');
        const temperature = tempComp?.data.base ?? 22;
        const humidity = humComp?.data.base ?? 0.5;
        const rainChance = rainComp?.enabled ? rainComp.chance : 0.0;

        // 6. Evaluate ScatterComponent (small rocks, flowers, mushrooms)
        let scatterItem: PreviewTile['scatterItem'] = undefined;
        const scatterComp = biome.getComponent<ScatterComponent>('Scatter');
        if (scatterComp && resolvedBlockId !== 'water') {
          for (const s of scatterComp.entries) {
            const sRoll = simpleNoise2D(c, r, seed + 777);
            if (sRoll < (s.density || 0.04)) {
              scatterItem = {
                id: s.id,
                name: s.name,
                scale: (s.scale?.min || 0.8) + simpleNoise2D(c, r, seed + 888) * ((s.scale?.max || 1.2) - (s.scale?.min || 0.8)),
                rotation: s.rotation?.random ? simpleNoise2D(c, r, seed + 999) * Math.PI * 2 : 0,
              };
              break;
            }
          }
        }

        // 7. Evaluate VegetationComponent (trees, cacti, bushes)
        let vegetationItem: PreviewTile['vegetationItem'] = undefined;
        const vegComp = biome.getComponent<BiomeVegetationComponent>('Vegetation');
        if (vegComp && !scatterItem && resolvedBlockId !== 'water') {
          // Trees need spacing - only consider every second tile to avoid clutter
          if ((c % 2 === 0 && r % 2 === 0) || (c % 3 === 1 && r % 3 === 1)) {
            for (const v of vegComp.data.entries) {
              const vRoll = simpleNoise2D(c, r, seed + 5432);
              const density = v.density ?? (v.chance ? v.chance * 0.2 : 0.05);
              if (vRoll < density) {
                vegetationItem = {
                  id: v.id,
                  name: v.id.replace(/_/g, ' '),
                };
                break;
              }
            }
          }
        }

        tiles[r][c] = {
          x: c,
          y: r,
          biomeId: biome.id,
          biomeName: biome.name,
          groundId: chosenGround.id,
          groundName: chosenGround.name,
          blockId: resolvedBlockId,
          blockName: blockDef.name,
          blockColor,
          blockEmoji,
          patchId: patchAppliedId,
          scatterItem,
          vegetationItem,
          temperature,
          humidity,
          rainChance,
        };
      }
    }

    return { cols, rows, seed, tiles };
  }

  /**
   * Renders the generated grid onto an HTML5 Canvas with lighting and weather.
   */
  renderToCanvas(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    grid: PreviewGrid,
    climate: ResolvedClimate,
    timeHour: number,
    dt: number,
    timeMs: number,
    hoveredTile?: { x: number; y: number } | null
  ): void {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const cols = grid.cols;
    const rows = grid.rows;
    const tileW = canvasWidth / cols;
    const tileH = canvasHeight / rows;

    // 1. Draw Base Tiles (Ground & Blocks)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = grid.tiles[r][c];
        const x = c * tileW;
        const y = r * tileH;

        // Base tile fill
        ctx.fillStyle = tile.blockColor;
        ctx.fillRect(x, y, tileW, tileH);

        // Subtle tile grid borders / bevel texture
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileW, tileH);

        // Water ripple effect if water
        if (tile.blockId === 'water') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          const waveOffset = Math.sin((timeMs / 600) + c * 0.5 + r * 0.5) * (tileH * 0.15);
          ctx.fillRect(x + 2, y + tileH * 0.4 + waveOffset, tileW - 4, 2);
        }

        // Patch indication highlight border
        if (tile.patchId) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.beginPath();
          ctx.arc(x + tileW / 2, y + tileH / 2, tileW * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw scatter items (small rocks, flowers, mushrooms)
        if (tile.scatterItem) {
          const sc = tile.scatterItem;
          ctx.save();
          ctx.translate(x + tileW / 2, y + tileH / 2);
          ctx.rotate(sc.rotation);
          ctx.scale(sc.scale, sc.scale);

          if (sc.id.includes('flower')) {
            // Cute flower
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(0, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(0, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(-0.8, 1, 1.6, 4);
          } else if (sc.id.includes('rock') || sc.id.includes('pebble')) {
            // Small rock with shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(1, 3, 4, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (sc.id.includes('mushroom')) {
            // Mushroom
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -1, 3.5, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-1, 0, 2, 3);
          } else {
            // Generic scatter emoji / icon
            ctx.font = `${Math.floor(tileH * 0.55)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨', 0, 0);
          }
          ctx.restore();
        }
      }
    }

    // 2. Draw Vegetation (Trees, Cacti, Bushes with depth ordering)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = grid.tiles[r][c];
        if (tile.vegetationItem) {
          const veg = tile.vegetationItem;
          const centerX = c * tileW + tileW / 2;
          const baseY = r * tileH + tileH * 0.8;

          ctx.save();
          // Drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(centerX, baseY, tileW * 0.6, tileH * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();

          if (veg.id.includes('cactus')) {
            // Cactus
            ctx.fillStyle = '#15803d';
            ctx.fillRect(centerX - 3, baseY - 18, 6, 18);
            ctx.fillRect(centerX - 9, baseY - 12, 6, 3);
            ctx.fillRect(centerX - 9, baseY - 17, 3, 5);
            ctx.fillRect(centerX + 3, baseY - 9, 6, 3);
            ctx.fillRect(centerX + 6, baseY - 14, 3, 5);
          } else if (veg.id.includes('pine') || veg.id.includes('spruce')) {
            // Pine tree
            ctx.fillStyle = '#78350f';
            ctx.fillRect(centerX - 2, baseY - 16, 4, 16);
            ctx.fillStyle = '#065f46';
            // Triangular foliage layers
            ctx.beginPath();
            ctx.moveTo(centerX, baseY - 24);
            ctx.lineTo(centerX - 8, baseY - 14);
            ctx.lineTo(centerX + 8, baseY - 14);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(centerX, baseY - 18);
            ctx.lineTo(centerX - 11, baseY - 8);
            ctx.lineTo(centerX + 11, baseY - 8);
            ctx.closePath();
            ctx.fill();
          } else if (veg.id.includes('bush')) {
            // Bush
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.arc(centerX, baseY - 6, tileW * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Deciduous Tree (Oak / Birch)
            ctx.fillStyle = veg.id.includes('birch') ? '#e2e8f0' : '#78350f';
            ctx.fillRect(centerX - 2.5, baseY - 16, 5, 16);
            // Foliage crown
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(centerX, baseY - 18, tileW * 0.65, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(centerX - 2, baseY - 21, tileW * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    // 3. Tile Hover Inspector Highlight
    if (hoveredTile && hoveredTile.x >= 0 && hoveredTile.x < cols && hoveredTile.y >= 0 && hoveredTile.y < rows) {
      const hx = hoveredTile.x * tileW;
      const hy = hoveredTile.y * tileH;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, tileW, tileH);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(hx, hy, tileW, tileH);
      ctx.restore();
    }

    // 4. Atmospheric Day / Sunset / Night Lighting Tint
    const isNight = timeHour < 5 || timeHour > 20;
    const isDawnOrDusk = (timeHour >= 5 && timeHour <= 7) || (timeHour >= 18 && timeHour <= 20);

    if (isNight) {
      // Deep blue night overlay
      ctx.fillStyle = 'rgba(10, 15, 30, 0.68)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (isDawnOrDusk) {
      // Warm golden dusk overlay
      ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 5. Dynamic Weather Overlay (Rain, Fog, Storm)
    this.weatherRenderer.renderWeather(
      ctx,
      canvasWidth,
      canvasHeight,
      climate,
      dt,
      timeMs
    );
  }
}
