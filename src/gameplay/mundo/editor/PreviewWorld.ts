import { Surface } from '../superficie/Surface';
import { BiomeDefinition } from '../biomas/BiomeDefinition';
import { GroundComponent } from '../biomas/componentes/GroundComponent';
import { PatchComponent } from '../biomas/componentes/PatchComponent';
import { ScatterComponent } from '../biomas/componentes/ScatterComponent';
import { BiomeVegetationComponent } from '../biomas/componentes/BiomeVegetationComponent';
import { RainComponent } from '../biomas/componentes/RainComponent';
import { FogComponent } from '../biomas/componentes/FogComponent';
import { BiomeTemperatureComponent } from '../biomas/componentes/BiomeTemperatureComponent';
import { BiomeHumidityComponent } from '../biomas/componentes/BiomeHumidityComponent';
import { WorldGenerationComponent } from '../componentes/WorldGenerationComponent';
import { BlockDatabase } from '../../blocos/BlockDatabase';
import { ColorTextureComponent, EmojiIconComponent, TopTextureComponent } from '../../blocos/componentes';
import { SimplexNoise, coordHash } from '../../../core/utilitarios/noise';
import { ResolvedClimate } from '../clima/WeatherTypes';

export interface PreviewTile {
  x: number;
  y: number;
  elevation: number;
  biomeId: string;
  biomeName: string;
  biomeColor: string;
  groundId: string;
  groundName: string;
  blockId: string;
  blockName: string;
  blockColor: string;
  blockEmoji: string;
  patchId?: string;
  patchColor?: string;
  scatterItem?: {
    id: string;
    name?: string;
    emoji?: string;
    color?: string;
    scale: number;
    rotation: number;
  };
  vegetationItem?: {
    id: string;
    type: string;
    name?: string;
    emoji?: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  temperature: number;
  humidity: number;
  isWater: boolean;
}

export interface PreviewWorldConfig {
  seed: number;
  cols?: number;
  rows?: number;
  targetBiomeId?: string;
}

export interface RenderOptions {
  zoom: number;
  panX: number;
  panY: number;
  showBiomes?: boolean;
  showHeight?: boolean;
  showGround?: boolean;
  timeHour?: number; // 0 to 24 (12 = Day, 19 = Sunset, 0 = Night)
  weatherPreset?: 'clear' | 'rain' | 'heavy_rain' | 'fog' | 'storm';
  hoveredCoord?: { x: number; y: number } | null;
}

/**
 * PreviewWorld is an isolated, temporary procedural world instance
 * specifically engineered for the World, Surface, and Biome Editors.
 *
 * It uses the procedural generation rules from the game:
 * - Simplex Noise terrain elevation
 * - Biome distribution (or single-biome isolated view)
 * - GroundComponent multi-ground and multi-layer evaluations
 * - PatchComponent organic resource patches
 * - ScatterComponent decorative scatter
 * - BiomeVegetationComponent trees and foliage
 * - BlockDatabase visual components
 *
 * Guaranteed isolated: does NOT touch production world saves, entities or disk.
 */
export class PreviewWorld {
  public readonly seed: number;
  public readonly cols: number;
  public readonly rows: number;
  public readonly targetBiomeId?: string;
  public readonly surface: Surface;

  public tiles: PreviewTile[][] = [];
  public resolvedClimate: ResolvedClimate;

  private noise: SimplexNoise;
  private patchNoise: SimplexNoise;
  private foliageNoise: SimplexNoise;

  constructor(surface: Surface, config: PreviewWorldConfig) {
    this.seed = config.seed;
    this.cols = config.cols || 32;
    this.rows = config.rows || 32;
    this.targetBiomeId = config.targetBiomeId;

    // Create an isolated snapshot of the surface data so editor updates never touch real state
    this.surface = Surface.fromJSON(surface.toJSON());

    this.noise = new SimplexNoise(this.seed);
    this.patchNoise = new SimplexNoise(this.seed + 3456);
    this.foliageNoise = new SimplexNoise(this.seed + 9999);

    this.resolvedClimate = this.resolveInitialClimate();
    this.generate();
  }

  private resolveInitialClimate(): ResolvedClimate {
    const targetBiome = this.targetBiomeId && this.targetBiomeId !== 'all'
      ? this.surface.getBiome(this.targetBiomeId)
      : undefined;

    const rainComp = (targetBiome?.getComponent('Rain') as RainComponent | undefined);
    const fogComp = (targetBiome?.getComponent('Fog') as FogComponent | undefined);
    const tempComp = (targetBiome?.getComponent('Temperature') as BiomeTemperatureComponent | undefined);
    const humComp = (targetBiome?.getComponent('Humidity') as BiomeHumidityComponent | undefined);

    const rainIntensity = rainComp?.data?.intensity ?? 0.5;
    const fogDensity = fogComp?.data?.density ?? 0.3;
    const baseTemp = tempComp?.data?.base ?? 22;
    const baseHum = humComp?.data?.base ?? 0.5;

    return {
      rain: rainIntensity,
      fog: fogDensity,
      temperature: baseTemp,
      humidity: baseHum,
      wind: 0.25,
      activeEvents: [],
      resolvedSource: targetBiome ? 'biome' : 'local',
      sourceName: targetBiome ? `Bioma: ${targetBiome.name}` : `Superfície: ${this.surface.name}`,
      biomeId: targetBiome?.id || 'surface_main',
    };
  }

  /**
   * Generates the procedural map cells using the game's actual generation pipeline.
   */
  public generate(): void {
    const genComp = this.surface.getComponent('WorldGenerationComponent') as WorldGenerationComponent | undefined;
    const terrainScale = genComp?.data.terrainScale ?? 0.035;
    const seaLevel = genComp?.data.seaLevelThreshold ?? 0.38;
    const beachLevel = genComp?.data.beachThreshold ?? 0.43;
    const foliageDensity = genComp?.data.foliageDensity ?? 1.0;

    const allBiomes = this.surface.getAllBiomes();
    const defaultBiome = allBiomes[0] || new BiomeDefinition(
      'plains',
      'Planície Padrão',
      ['temperate'],
      [],
      'temperate',
      '#84cc16'
    );

    const targetBiome = this.targetBiomeId && this.targetBiomeId !== 'all'
      ? this.surface.getBiome(this.targetBiomeId) || defaultBiome
      : undefined;

    this.tiles = [];

    for (let r = 0; r < this.rows; r++) {
      const row: PreviewTile[] = [];
      for (let c = 0; c < this.cols; c++) {
        const tx = c;
        const ty = r;

        // 1. Terrain elevation via Simplex Noise FBM
        const elevation = this.noise.fbm(tx * terrainScale, ty * terrainScale, 4, 0.5, 2.0);

        // 2. Determine active biome for this cell
        let cellBiome: BiomeDefinition = targetBiome || defaultBiome;

        if (!targetBiome && allBiomes.length > 1) {
          // Multi-biome spatial distribution based on temperature and moisture noise
          const moistNoise = this.noise.fbm((tx + 500) * 0.02, (ty + 500) * 0.02, 3, 0.5, 2.0);
          const biomeIdx = Math.floor(Math.abs(moistNoise * allBiomes.length)) % allBiomes.length;
          cellBiome = allBiomes[biomeIdx] || defaultBiome;
        }

        // 3. Ground selection: retrieve GroundComponent from Biome or Surface
        const groundComp = (cellBiome.getComponent('Ground') as GroundComponent | undefined)
          || (this.surface.getComponent('Ground') as GroundComponent | undefined);

        const grounds = groundComp?.data?.grounds || [];
        let chosenGround = grounds[0];

        // If multiple grounds with weights, pick deterministically based on coordHash
        if (grounds.length > 1) {
          const totalWeight = grounds.reduce((acc, g) => acc + (g.weight || 1), 0);
          const roll = coordHash(tx, ty, this.seed + 101) * totalWeight;
          let running = 0;
          for (const g of grounds) {
            running += (g.weight || 1);
            if (roll <= running) {
              chosenGround = g;
              break;
            }
          }
        }

        // Determine ground surface block
        const topLayer = chosenGround?.layers && chosenGround.layers.length > 0 ? chosenGround.layers[0] : undefined;
        let finalBlockId = topLayer?.block || (elevation < seaLevel ? 'water' : elevation < beachLevel ? 'sand' : 'grass');

        const groundId = chosenGround?.id || 'ground_default';
        const groundName = chosenGround?.name || 'Chão Padrão';
        const isWater = elevation < seaLevel || finalBlockId === 'water' || finalBlockId === 'deep_water';

        // 4. Evaluate PatchComponent (mud patches, sand patches, clay patches)
        let patchId: string | undefined;
        let patchColor: string | undefined;
        const patchComp = (cellBiome.getComponent('Patch') as PatchComponent | undefined);
        if (patchComp && patchComp.data.entries && !isWater) {
          for (const p of patchComp.data.entries) {
            const pNoiseVal = this.patchNoise.noise2D(tx * 0.12, ty * 0.12);
            const threshold = 1.0 - (p.chance || 0.15);
            if (pNoiseVal > threshold) {
              patchId = p.name || p.id;
              finalBlockId = p.target;
              const pBlock = BlockDatabase.getBlock(p.target);
              patchColor = pBlock.getComponent(ColorTextureComponent)?.primaryColor || '#78350f';
              break;
            }
          }
        }

        const blockDef = BlockDatabase.getBlock(finalBlockId);
        const colorComp = blockDef.getComponent(ColorTextureComponent);
        const emojiComp = blockDef.getComponent(EmojiIconComponent);

        const blockName = blockDef.name || finalBlockId;
        const blockColor = patchColor || colorComp?.primaryColor || '#84cc16';
        const blockEmoji = emojiComp?.emoji || '🟩';

        // 5. Evaluate ScatterComponent (decorative small pebbles, flowers, mushrooms)
        let scatterItem: PreviewTile['scatterItem'];
        const scatterComp = (cellBiome.getComponent('Scatter') as ScatterComponent | undefined);
        if (scatterComp && scatterComp.data.entries && !isWater) {
          const hScatter = coordHash(tx, ty, this.seed + 202);
          for (const sc of scatterComp.data.entries) {
            if (hScatter < (sc.density || 0.04)) {
              const scBlock = BlockDatabase.getBlock(sc.id);
              const scEmoji = scBlock.getComponent(EmojiIconComponent)?.emoji || '🪨';
              const scColor = scBlock.getComponent(ColorTextureComponent)?.primaryColor || '#94a3b8';
              scatterItem = {
                id: sc.id,
                name: sc.name || scBlock.name,
                emoji: scEmoji,
                color: scColor,
                scale: 0.8 + coordHash(tx, ty, this.seed + 303) * 0.4,
                rotation: coordHash(tx, ty, this.seed + 404) * Math.PI * 2,
              };
              break;
            }
          }
        }

        // 6. Evaluate BiomeVegetationComponent (trees, oaks, pines, bushes)
        let vegetationItem: PreviewTile['vegetationItem'];
        const vegComp = (cellBiome.getComponent('Vegetation') as BiomeVegetationComponent | undefined);
        if (vegComp && vegComp.data.entries && !isWater) {
          const vegNoise = this.foliageNoise.noise2D(tx * 0.08, ty * 0.08);
          const hVeg = coordHash(tx, ty, this.seed + 505);

          for (const ve of vegComp.data.entries) {
            const threshold = 1.0 - ((ve.density ?? ve.chance ?? 0.1) * foliageDensity * 0.4);
            if (hVeg > threshold && vegNoise > 0.28) {
              const isPine = ve.id.includes('pine');
              vegetationItem = {
                id: ve.id,
                type: isPine ? 'pine' : 'tree',
                name: isPine ? 'Pinheiro' : 'Carvalho',
                emoji: isPine ? '🌲' : '🌳',
                x: tx,
                y: ty,
                width: 24,
                height: 28,
              };
              break;
            }
          }
        }

        // 7. Cell Temperature & Humidity
        const tempComp = (cellBiome.getComponent('Temperature') as BiomeTemperatureComponent | undefined);
        const humComp = (cellBiome.getComponent('Humidity') as BiomeHumidityComponent | undefined);
        const baseTemp = tempComp?.data.base ?? 22;
        const baseHum = humComp?.data.base ?? 0.5;

        row.push({
          x: tx,
          y: ty,
          elevation,
          biomeId: cellBiome.id,
          biomeName: cellBiome.name,
          biomeColor: cellBiome.color || '#22c55e',
          groundId,
          groundName,
          blockId: finalBlockId,
          blockName,
          blockColor,
          blockEmoji,
          patchId,
          patchColor,
          scatterItem,
          vegetationItem,
          temperature: Math.round((baseTemp - (elevation * 5)) * 10) / 10,
          humidity: Math.round(baseHum * 100) / 100,
          isWater,
        });
      }
      this.tiles.push(row);
    }
  }

  /**
   * Retrieves a tile by coordinates.
   */
  public getTile(x: number, y: number): PreviewTile | undefined {
    if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
      return this.tiles[y][x];
    }
    return undefined;
  }

  /**
   * Renders the PreviewWorld onto an HTML5 Canvas.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: RenderOptions,
    time: number = performance.now()
  ): void {
    ctx.clearRect(0, 0, width, height);

    // Background canvas fill
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const zoom = Math.max(0.2, Math.min(5.0, options.zoom || 1.0));
    const panX = options.panX || 0;
    const panY = options.panY || 0;

    // Calculate tile dimension in screen pixels
    const baseTileSize = Math.min(width / this.cols, height / this.rows);
    const tileSize = Math.max(6, baseTileSize * zoom);

    const totalMapWidth = this.cols * tileSize;
    const totalMapHeight = this.rows * tileSize;

    // Centered origin + user pan
    const originX = (width - totalMapWidth) / 2 + panX;
    const originY = (height - totalMapHeight) / 2 + panY;

    ctx.save();
    ctx.translate(originX, originY);

    // 1. Draw Ground Tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.tiles[r][c];
        const px = c * tileSize;
        const py = r * tileSize;

        if (options.showHeight) {
          // Topographic elevation debug mode
          const val = Math.floor(Math.max(0, Math.min(1, tile.elevation)) * 255);
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);
          continue;
        }

        if (options.showGround) {
          // Color-coded ground distribution debug mode
          ctx.fillStyle = tile.blockColor;
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);
          continue;
        }

        // Standard Natural Ground Rendering
        const block = BlockDatabase.getBlock(tile.blockId);
        const topComp = block.getComponent(TopTextureComponent);

        if (topComp && typeof topComp.render === 'function' && tileSize >= 16) {
          topComp.render(ctx, px, py, tileSize, time);
        } else {
          ctx.fillStyle = tile.blockColor;
          ctx.fillRect(px, py, tileSize, tileSize);
        }

        // Draw organic patch overlay if present
        if (tile.patchId && tile.patchColor) {
          ctx.fillStyle = tile.patchColor;
          ctx.globalAlpha = 0.65;
          ctx.beginPath();
          ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Draw tile subtle border grid
        ctx.strokeStyle = tile.isWater ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

        // Render Scatter objects
        if (tile.scatterItem && !tile.isWater && tileSize >= 12) {
          ctx.save();
          ctx.translate(px + tileSize / 2, py + tileSize / 2);
          ctx.rotate(tile.scatterItem.rotation);
          if (tile.scatterItem.emoji && tileSize >= 18) {
            ctx.font = `${Math.floor(tileSize * 0.45 * tile.scatterItem.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.scatterItem.emoji, 0, 0);
          } else {
            ctx.fillStyle = tile.scatterItem.color || '#94a3b8';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(2, tileSize * 0.2 * tile.scatterItem.scale), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Biome tinted overlay in debug mode
        if (options.showBiomes) {
          ctx.fillStyle = tile.biomeColor;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.globalAlpha = 1.0;
        }
      }
    }

    // 2. Draw Foliage / Vegetation Trees (rendered top-down after terrain for clean overlapping)
    if (!options.showHeight && !options.showGround) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const tile = this.tiles[r][c];
          if (!tile.vegetationItem || tile.isWater) continue;

          const px = c * tileSize;
          const py = r * tileSize;
          const veg = tile.vegetationItem;

          // Tree trunk shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(px + tileSize / 2, py + tileSize * 0.8, tileSize * 0.35, tileSize * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();

          if (veg.emoji && tileSize >= 14) {
            ctx.font = `${Math.floor(tileSize * 0.88)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(veg.emoji, px + tileSize / 2, py + tileSize * 0.45);
          } else {
            // Stylized vector foliage
            ctx.fillStyle = veg.type.includes('pine') ? '#14532d' : '#15803d';
            ctx.beginPath();
            ctx.arc(px + tileSize / 2, py + tileSize * 0.4, Math.max(4, tileSize * 0.38), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 3. Highlight Hovered Tile
    if (options.hoveredCoord) {
      const hx = options.hoveredCoord.x * tileSize;
      const hy = options.hoveredCoord.y * tileSize;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(hx + 1, hy + 1, tileSize - 2, tileSize - 2);

      // Subtle pulse glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.fillRect(hx, hy, tileSize, tileSize);
    }

    ctx.restore();

    // 4. Ambient Time & Weather Lighting Overlay
    this.renderLightingAndWeather(ctx, width, height, options, time);
  }

  private renderLightingAndWeather(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: RenderOptions,
    time: number
  ): void {
    const hour = options.timeHour ?? 12;

    // Time-based ambient darkness and color tint
    if (hour < 6 || hour >= 21) {
      // Deep Night: navy-blue darkness
      ctx.fillStyle = 'rgba(10, 15, 30, 0.65)';
      ctx.fillRect(0, 0, width, height);
    } else if (hour >= 18 && hour < 21) {
      // Sunset: warm amber/orange tint
      const sunsetAlpha = (hour - 18) / 3 * 0.45;
      ctx.fillStyle = `rgba(249, 115, 22, ${sunsetAlpha})`;
      ctx.fillRect(0, 0, width, height);
    } else if (hour >= 6 && hour < 8) {
      // Sunrise: soft golden morning
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }

    // Weather Effects
    const weather = options.weatherPreset || 'clear';

    if (weather === 'rain' || weather === 'heavy_rain' || weather === 'storm') {
      const dropCount = weather === 'storm' ? 140 : weather === 'heavy_rain' ? 100 : 45;
      ctx.save();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = weather === 'heavy_rain' || weather === 'storm' ? 1.5 : 1.0;

      for (let i = 0; i < dropCount; i++) {
        const rx = (Math.sin(i * 99 + time * 0.003) * 0.5 + 0.5) * width;
        const ry = ((time * 0.8 + i * 43) % height);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3, ry + 12);
        ctx.stroke();
      }
      ctx.restore();

      // Ambient rain gloom
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.fillRect(0, 0, width, height);
    }

    if (weather === 'fog') {
      ctx.fillStyle = 'rgba(203, 213, 225, 0.42)';
      ctx.fillRect(0, 0, width, height);
    }

    if (weather === 'storm') {
      // Occasional lightning flash
      if (Math.sin(time * 0.004) > 0.96) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(0, 0, width, height);
      }
    }
  }
}
