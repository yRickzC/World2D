import { CHUNK_SIZE, TILE_SIZE } from '../../../core/configuracao/constants';
import { Camera, DroppedItem, FloatingText, Particle, Player, WorldEntity } from '../../../core/configuracao/types';
import { MouseTarget } from '../../interacao/MouseInteractionSystem';
import { ChunkManager } from '../chunks/ChunkManager';
import { DroppedItemRenderer } from './DroppedItemRenderer';
import { FoliageRenderer } from './FoliageRenderer';
import { LightingRenderer } from './LightingRenderer';
import { MouseTargetRenderer } from './MouseTargetRenderer';
import { PlayerRenderer } from './PlayerRenderer';
import { TileRenderer } from './TileRenderer';
import { LivingEntityRenderer } from './LivingEntityRenderer';
import { WeatherRenderer } from '../clima/WeatherRenderer';
import { ResolvedClimate } from '../clima/WeatherTypes';

interface RenderItem {
  yOrder: number;
  type: 'entity' | 'player' | 'particle' | 'dropped_item' | 'elevated_block';
  entity?: WorldEntity;
  particle?: Particle;
  droppedItem?: DroppedItem;
  blockData?: {
    tx: number;
    ty: number;
    layers: string[];
  };
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private tileRenderer: TileRenderer;
  private foliageRenderer: FoliageRenderer;
  private livingEntityRenderer: LivingEntityRenderer;
  private playerRenderer: PlayerRenderer;
  private lightingRenderer: LightingRenderer;
  private droppedItemRenderer: DroppedItemRenderer;
  private mouseTargetRenderer: MouseTargetRenderer;
  private weatherRenderer: WeatherRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.tileRenderer = new TileRenderer();
    this.foliageRenderer = new FoliageRenderer();
    this.livingEntityRenderer = new LivingEntityRenderer();
    this.playerRenderer = new PlayerRenderer();
    this.lightingRenderer = new LightingRenderer();
    this.droppedItemRenderer = new DroppedItemRenderer();
    this.mouseTargetRenderer = new MouseTargetRenderer();
    this.weatherRenderer = new WeatherRenderer();
  }

  render(
    chunkManager: ChunkManager,
    player: Player,
    camera: Camera,
    particles: Particle[],
    floatingTexts: FloatingText[],
    zoom: number,
    timeHour: number,
    gameTime: number,
    highlightEntityId?: string | null,
    droppedItems: DroppedItem[] = [],
    mouseTarget?: MouseTarget | null,
    climate?: ResolvedClimate | null
  ) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.save();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Camera transform centered smoothly on camera coordinates
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    const viewHalfW = width / 2 / zoom + TILE_SIZE * 2;
    const viewHalfH = height / 2 / zoom + TILE_SIZE * 2;

    const minTx = Math.floor((camera.x - viewHalfW) / TILE_SIZE);
    const maxTx = Math.ceil((camera.x + viewHalfW) / TILE_SIZE);
    const minTy = Math.floor((camera.y - viewHalfH) / TILE_SIZE);
    const maxTy = Math.ceil((camera.y + viewHalfH) / TILE_SIZE);

    // 1. Render Base Ground Tiles
    this.tileRenderer.renderTiles(ctx, chunkManager, minTx, maxTx, minTy, maxTy, gameTime);

    // 2. Gather visible entities & player for Y-sorting
    const minCx = Math.floor((camera.x - viewHalfW) / (CHUNK_SIZE * TILE_SIZE));
    const maxCx = Math.floor((camera.x + viewHalfW) / (CHUNK_SIZE * TILE_SIZE));
    const minCy = Math.floor((camera.y - viewHalfH) / (CHUNK_SIZE * TILE_SIZE));
    const maxCy = Math.floor((camera.y + viewHalfH) / (CHUNK_SIZE * TILE_SIZE));

    const renderQueue: RenderItem[] = [];

    // Collect foliage entities from visible chunks
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = chunkManager.getChunk(cx, cy);
        for (const ent of chunk.entities) {
          if (
            ent.x + ent.width >= camera.x - viewHalfW &&
            ent.x - ent.width <= camera.x + viewHalfW &&
            ent.y + ent.height >= camera.y - viewHalfH &&
            ent.y - ent.height <= camera.y + viewHalfH
          ) {
            const yOrder =
              ent.type.startsWith('tree') && !ent.isHarvested ? ent.y + ent.height * 0.35 : ent.y;
            renderQueue.push({
              yOrder,
              type: 'entity',
              entity: ent,
            });
          }
        }
      }
    }

    // Collect elevated block structures from visible tiles for 2.5D Y-sorting
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const layer = chunkManager.getTileLayer(tx, ty);
        if (layer.upperLayers && layer.upperLayers.length > 0) {
          renderQueue.push({
            yOrder: (ty + 1) * TILE_SIZE,
            type: 'elevated_block',
            blockData: {
              tx,
              ty,
              layers: layer.upperLayers,
            },
          });
        }
      }
    }

    // Add dropped items to queue
    for (const dItem of droppedItems) {
      if (
        dItem.x >= camera.x - viewHalfW &&
        dItem.x <= camera.x + viewHalfW &&
        dItem.y >= camera.y - viewHalfH &&
        dItem.y <= camera.y + viewHalfH
      ) {
        renderQueue.push({
          yOrder: dItem.y + 4,
          type: 'dropped_item',
          droppedItem: dItem,
        });
      }
    }

    // Add player to queue
    renderQueue.push({
      yOrder: player.y + 12,
      type: 'player',
    });

    // Add particles
    for (const p of particles) {
      renderQueue.push({
        yOrder: p.y,
        type: 'particle',
        particle: p,
      });
    }

    // Sort by yOrder ascending
    renderQueue.sort((a, b) => a.yOrder - b.yOrder);

    // 3. Render all sorted items
    const wind = Math.sin(gameTime * 0.0025);
    for (const item of renderQueue) {
      if (item.type === 'entity' && item.entity) {
        const isHighlighted = highlightEntityId === item.entity.id;
        if (item.entity.isLiving) {
          this.livingEntityRenderer.render(ctx, item.entity, gameTime, isHighlighted);
        } else {
          this.foliageRenderer.renderEntity(ctx, item.entity, gameTime, wind, isHighlighted);
        }
      } else if (item.type === 'player') {
        this.playerRenderer.renderPlayer(ctx, player, gameTime);
      } else if (item.type === 'dropped_item' && item.droppedItem) {
        const pDist = Math.hypot(player.x - item.droppedItem.x, player.y - item.droppedItem.y);
        this.droppedItemRenderer.render(ctx, item.droppedItem, gameTime, pDist);
      } else if (item.type === 'elevated_block' && item.blockData) {
        this.tileRenderer.renderElevatedLayers(
          ctx,
          item.blockData.tx,
          item.blockData.ty,
          item.blockData.layers,
          gameTime
        );
      } else if (item.type === 'particle' && item.particle) {
        this.renderParticle(item.particle);
      }
    }

    // 4. Render Floating Collect Texts
    for (const ft of floatingTexts) {
      const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(ft.x, ft.y);
      ctx.font = 'bold 12px "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';

      const metrics = ctx.measureText(ft.text);
      const bgW = metrics.width + 12;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect(-bgW / 2, -14, bgW, 18, 9);
      ctx.fill();

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }

    // 5. In-World Mouse Raycast & Interaction Target Highlights
    if (mouseTarget) {
      this.mouseTargetRenderer.renderInWorld(ctx, player, mouseTarget, gameTime);
    }

    // 6. Environmental Lighting / Gradual Day & Night Cycle
    ctx.restore(); // Restore camera translation before screen lighting overlay
    this.lightingRenderer.renderLighting(ctx, player, camera, width, height, zoom, timeHour, gameTime);

    // 7. Atmospheric Climate System (Rain, Volumetric Fog, Overcast Sky)
    if (climate) {
      this.weatherRenderer.renderWeather(ctx, width, height, climate, 0.016, gameTime);
    }

    // 8. Screen-Space Mouse Target Action Tooltip / Range Feedback Badge
    if (mouseTarget) {
      this.mouseTargetRenderer.renderScreenBadge(ctx, mouseTarget, width, height);
    }
  }

  private renderParticle(p: Particle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
