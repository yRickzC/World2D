import { CHUNK_SIZE, TILE_SIZE, PLAYER_INTERACTION_RANGE } from '../../../core/configuracao/constants';
import {
  Camera,
  DroppedItem,
  FloatingText,
  Particle,
  Player,
  TileLayerData,
  TileType,
  WorldEntity,
} from '../../../core/configuracao/types';
import { BlockDatabase } from '../../../gameplay/blocos/BlockDatabase';
import { BlockDefinition } from '../../../gameplay/blocos/BlockDefinition';
import { BreakableComponent, SolidComponent } from '../../../gameplay/blocos/componentes';
import { BlockDefinitionJSON, BlockTextureDefinition } from '../../../gameplay/BlockSystem/types';
import { MouseInteractionSystem, MouseTarget } from '../../../gameplay/interacao/MouseInteractionSystem';
import { BreakSystem } from '../../../gameplay/sistemas/quebra/BreakSystem';
import { InteractionSystem } from '../../../gameplay/sistemas/interacao/InteractionSystem';
import { ChunkManager } from '../../../gameplay/mundo/chunks/ChunkManager';
import { WeatherManager } from '../../../gameplay/mundo/clima/WeatherManager';
import { ResolvedClimate } from '../../../gameplay/mundo/clima/WeatherTypes';
import { GameRenderer } from '../../../gameplay/mundo/renderizacao/GameRenderer';
import { Surface } from '../../../gameplay/mundo/superficie/Surface';
import { World } from '../../../gameplay/mundo/World';

export type PreviewToolMode = 'select' | 'interact' | 'hit' | 'break' | 'remove' | 'place' | 'dig';

export interface SelectedTileInfo {
  tileX: number;
  tileY: number;
  worldX: number;
  worldY: number;
  blockDef: any;
  layerData: TileLayerData;
  occupyingEntity: WorldEntity | null;
  health?: { current: number; max: number };
}

export interface PreviewRuntimeOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  initialBlockData: BlockDefinitionJSON;
  onLog?: (message: {
    text: string;
    type: 'info' | 'success' | 'damage' | 'break' | 'error';
  }) => void;
  onTileSelected?: (info: SelectedTileInfo | null) => void;
  onHoverCoord?: (coords: { tileX: number; tileY: number } | null) => void;
  onClimateUpdated?: (climate: ResolvedClimate) => void;
}

/**
 * PreviewRuntime:
 * Orchestrates a temporary, isolated instance of the REAL game engine inside the Mod Dev workspace.
 *
 * Responsibilities:
 * - Instantiates and connects real engine systems: World, Surface, ChunkManager, WeatherManager, GameRenderer.
 * - Controls simulation lifecycle: create(), start(), pause(), resume(), reset(), destroy().
 * - Drives the engine loop and delegates rendering exclusively to GameRenderer onto the preview Canvas.
 * - Executes all user actions (Select, Interact, Hit, Break, Remove, Place, Dig) using real engine systems.
 * - Guarantees zero leakage into persisted world saves, mod files, or storage.
 */
export class PreviewRuntime {
  // DOM References
  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver | null = null;

  // Real Engine Systems
  public world: World;
  public surface: Surface;
  public chunkManager: ChunkManager;
  public weatherManager: WeatherManager;
  public gameRenderer: GameRenderer;

  // Simulation Entities & State
  public player: Player;
  public camera: Camera;
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public droppedItems: DroppedItem[] = [];
  private tileHealth: Map<string, number> = new Map();

  // Viewport & Environment Settings
  public zoom: number = 1.5;
  public timeHour: number = 12.0;
  public weatherType: 'clear' | 'rain' | 'fog' = 'clear';
  public groundType: TileType = 'grass';
  public activeTool: PreviewToolMode = 'select';
  public placeBlockId: string;

  // Interaction & Raycasting
  public mouseTarget: MouseTarget | null = null;
  public selectedCoord: { tileX: number; tileY: number } | null = { tileX: 0, tileY: 0 };
  private isMouseDown: boolean = false;
  private isDraggingPan: boolean = false;
  private dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private cameraStart: { x: number; y: number } = { x: 0, y: 0 };

  // Lifecycle & Loop
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private gameTime: number = 0;

  // Callbacks
  private onLog?: (message: {
    text: string;
    type: 'info' | 'success' | 'damage' | 'break' | 'error';
  }) => void;
  private onTileSelected?: (info: SelectedTileInfo | null) => void;
  private onHoverCoord?: (coords: { tileX: number; tileY: number } | null) => void;
  private onClimateUpdated?: (climate: ResolvedClimate) => void;

  // Active Block Definition Data
  private currentBlockData: BlockDefinitionJSON;

  constructor(options: PreviewRuntimeOptions) {
    this.canvas = options.canvas;
    this.container = options.container;
    this.currentBlockData = options.initialBlockData;
    this.placeBlockId = options.initialBlockData.id;
    this.onLog = options.onLog;
    this.onTileSelected = options.onTileSelected;
    this.onHoverCoord = options.onHoverCoord;
    this.onClimateUpdated = options.onClimateUpdated;

    // 1. Temporary World & Surface (Isolated from any game saves)
    const seed = 987654;
    this.surface = new Surface('preview_surface', 'Preview Arena Surface', seed, ['standard']);
    this.world = new World('preview_world', 'Temporary Preview World', seed, ['creative'], [this.surface]);

    // 2. Real ChunkManager
    this.chunkManager = new ChunkManager(seed);

    // 3. Real WeatherManager
    this.weatherManager = new WeatherManager(undefined, undefined, this.surface);

    // 4. Temporary Player & Camera
    this.player = {
      x: 0,
      y: 48,
      vx: 0,
      vy: 0,
      speed: 120,
      runSpeed: 180,
      isRunning: false,
      facing: 'up',
      animFrame: 0,
      animTimer: 0,
      isMoving: false,
    };

    this.camera = { x: 0, y: 0 };

    // 5. Initial Canvas Sizing & Real GameRenderer
    this.setupCanvasDimensions();
    this.gameRenderer = new GameRenderer(this.canvas);

    // 6. Setup Arena & Register Block
    this.registerBlockSnapshot(this.currentBlockData);
    this.resetArena(this.groundType);

    // 7. Bind Viewport & Input Listeners
    this.bindEvents();
  }

  /**
   * Helper to normalize block texture definition
   */
  private normalizeTexture(blockData: BlockDefinitionJSON): BlockTextureDefinition {
    if (blockData.texture) {
      const bg = blockData.texture.background?.color ?? blockData.texture.backgroundColor;
      const hasBg = !!(bg && bg !== 'transparent' && bg !== 'none' && bg !== 'null');
      return {
        type: blockData.texture.type || 'emoji',
        value: blockData.texture.value || '🧱',
        size: blockData.texture.size ?? 1.0,
        backgroundColor: hasBg ? bg : null,
        background: hasBg ? { color: bg as string } : null,
        secondaryColor: blockData.texture.secondaryColor || '#334155',
        pattern: blockData.texture.pattern || 'solid',
        imageSrc: blockData.texture.imageSrc,
        svgContent: blockData.texture.svgContent,
      };
    }
    return {
      type: 'emoji',
      value: '🧱',
      size: 1.0,
      backgroundColor: null,
      background: null,
      secondaryColor: '#334155',
      pattern: 'solid',
    };
  }

  /**
   * Registers a temporary snapshot of the block under edit into BlockDatabase
   */
  public registerBlockSnapshot(blockData: BlockDefinitionJSON): void {
    this.currentBlockData = blockData;
    const breakComp = blockData.components?.find((c) => c.type === 'BreakableComponent');
    const solidComp = blockData.components?.find((c) => c.type === 'SolidComponent');
    const hardness = breakComp?.data?.hardness ?? 2;
    const reqTool = breakComp?.data?.requiredToolTag ?? 'hand';
    const drops = breakComp?.data?.dropItems ?? [{ type: blockData.id, count: 1, chance: 1 }];

    const def = new BlockDefinition({
      id: blockData.id,
      name: blockData.name || 'Bloco Customizado',
      tags: blockData.tags || ['ground', 'walkable'],
      texture: this.normalizeTexture(blockData),
      components: [
        new SolidComponent({ solid: solidComp?.data?.solid ?? true }),
        new BreakableComponent({
          hardness,
          requiredToolTag: reqTool,
          dropItems: drops,
        }),
      ],
    });

    BlockDatabase.register(def);

    // Refresh selected inspection if currently on target tile
    if (this.selectedCoord && this.selectedCoord.tileX === 0 && this.selectedCoord.tileY === 0) {
      this.notifySelection(0, 0);
    }
  }

  /**
   * Resets the 9x9 test arena using the real ChunkManager
   */
  public resetArena(ground: TileType = this.groundType): void {
    this.groundType = ground;
    this.tileHealth.clear();
    this.particles = [];
    this.floatingTexts = [];
    this.droppedItems = [];

    // Clear chunks map in ChunkManager and rebuild arena
    for (let ty = -4; ty <= 4; ty++) {
      for (let tx = -4; tx <= 4; tx++) {
        const layer = this.chunkManager.getTileLayer(tx, ty);
        layer.baseGround = ground;
        layer.groundBlock = null;
        layer.isDug = false;
        layer.upperLayers = [];
        this.chunkManager.setTile(tx, ty, ground);
      }
    }

    // Target block placed at center (0, 0)
    this.chunkManager.setTile(0, 0, this.currentBlockData.id as TileType);

    // Surrounding neighbor tiles for context and transparency evaluation
    this.chunkManager.setTile(-1, 0, 'stone' as TileType);
    this.chunkManager.setTile(1, 0, 'dirt' as TileType);
    this.chunkManager.setTile(0, -1, 'wood_plank' as TileType);
    this.chunkManager.setTile(-1, -1, 'sand' as TileType);
    this.chunkManager.setTile(1, 1, 'dense_grass' as TileType);

    // Trench / excavated pit hole at (-2, 0) to demonstrate floor placement in dug ground
    this.chunkManager.digTile(-2, 0);

    // Stacked vertical upper layers at (0, 2) to demonstrate elevated layer system
    this.chunkManager.placeBlockOnTile(0, 2, 'wood_plank');
    this.chunkManager.placeBlockOnTile(0, 2, 'wood_plank');

    // Spawn a sample living foliage entity nearby to verify living entity rendering
    const chunk0 = this.chunkManager.getChunk(0, 0);
    chunk0.entities = [
      {
        id: 'preview_flower',
        type: 'flower',
        x: 48,
        y: -48,
        width: 20,
        height: 18,
        variant: 1,
        swayOffset: 0.5,
        health: 1,
        maxHealth: 1,
        isHarvested: false,
      },
    ];

    // Player positioned observing the target block
    this.player.x = 0;
    this.player.y = 48;
    this.player.facing = 'up';

    // Camera centered on target
    this.camera.x = 0;
    this.camera.y = 0;

    this.selectedCoord = { tileX: 0, tileY: 0 };
    this.notifySelection(0, 0);

    this.log(
      `Cenário de teste reinicializado com a engine real (${ground.toUpperCase()}). Bloco alvo em [0, 0].`,
      'info'
    );
  }

  /**
   * Resizes canvas to match container taking devicePixelRatio into account
   */
  private setupCanvasDimensions = (): void => {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    const targetW = Math.floor(w * dpr);
    const targetH = Math.floor(h * dpr);

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      // Recreate GameRenderer with updated canvas context
      this.gameRenderer = new GameRenderer(this.canvas);
    }
  };

  /**
   * Converts viewport / client mouse coordinates to world and tile coordinates
   */
  public screenToWorld(clientX: number, clientY: number): {
    canvasX: number;
    canvasY: number;
    worldX: number;
    worldY: number;
    tileX: number;
    tileY: number;
  } | null {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const effectiveZoom = this.zoom * dpr;

    const canvasX = (clientX - rect.left) * (this.canvas.width / rect.width);
    const canvasY = (clientY - rect.top) * (this.canvas.height / rect.height);

    const worldX = (canvasX - this.canvas.width / 2) / effectiveZoom + this.camera.x;
    const worldY = (canvasY - this.canvas.height / 2) / effectiveZoom + this.camera.y;

    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    return { canvasX, canvasY, worldX, worldY, tileX, tileY };
  }

  /**
   * Binds user input and resize observers
   */
  private bindEvents(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.setupCanvasDimensions();
    });
    this.resizeObserver.observe(this.container);

    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private unbindEvents(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  // --- Input Handlers ---

  private handleMouseMove = (e: MouseEvent): void => {
    if (this.isDraggingPan) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const effectiveZoom = this.zoom * dpr;
      const dx = (e.clientX - this.dragStart.x) * dpr / effectiveZoom;
      const dy = (e.clientY - this.dragStart.y) * dpr / effectiveZoom;
      this.camera.x = this.cameraStart.x - dx;
      this.camera.y = this.cameraStart.y - dy;
      return;
    }

    const coords = this.screenToWorld(e.clientX, e.clientY);
    if (!coords) return;

    if (this.onHoverCoord) {
      this.onHoverCoord({ tileX: coords.tileX, tileY: coords.tileY });
    }

    // Real MouseInteractionSystem target computation with extended interaction range for sandbox
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.mouseTarget = MouseInteractionSystem.getMouseTarget(
      coords.canvasX,
      coords.canvasY,
      this.canvas.width,
      this.canvas.height,
      this.player,
      this.camera,
      this.zoom * dpr,
      this.chunkManager,
      null,
      10000 // Infinite interaction range for sandbox editor
    );
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.isMouseDown = true;
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      this.isDraggingPan = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.cameraStart = { ...this.camera };
    }
  };

  private handleMouseUp = (): void => {
    this.isMouseDown = false;
    this.isDraggingPan = false;
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    this.setZoom(this.zoom + delta);
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private handleClick = (e: MouseEvent): void => {
    if (this.isDraggingPan) return;
    const coords = this.screenToWorld(e.clientX, e.clientY);
    if (!coords) return;

    this.executeToolAction(coords.tileX, coords.tileY, coords.worldX, coords.worldY);
  };

  // --- Real Engine Actions ---

  public executeToolAction(tileX: number, tileY: number, worldX: number, worldY: number): void {
    const currentTileId = this.chunkManager.getTile(tileX, tileY);
    const layer = this.chunkManager.getTileLayer(tileX, tileY);
    const blockDef = BlockDatabase.getBlock(currentTileId);

    // Make player turn towards the targeted tile
    const angle = Math.atan2(worldY - this.player.y, worldX - this.player.x);
    if (Math.abs(angle) < Math.PI / 4) this.player.facing = 'right';
    else if (Math.abs(angle) > (3 * Math.PI) / 4) this.player.facing = 'left';
    else if (angle > 0) this.player.facing = 'down';
    else this.player.facing = 'up';

    // 1. SELECT Tool
    if (this.activeTool === 'select') {
      this.selectedCoord = { tileX, tileY };
      this.notifySelection(tileX, tileY);
      this.log(`Selecionado: ${blockDef.name} (${blockDef.id}) em [${tileX}, ${tileY}]`, 'info');
      return;
    }

    // 2. INTERACT Tool
    if (this.activeTool === 'interact') {
      this.selectedCoord = { tileX, tileY };
      this.notifySelection(tileX, tileY);

      this.player.isInteracting = true;
      this.player.interactTimer = 0.25;

      // Real InteractionSystem execution
      const targetEntity = this.chunkManager.getEntityAtTile(tileX, tileY);
      const res = InteractionSystem.executePrimary(
        null,
        targetEntity,
        currentTileId,
        this.chunkManager,
        tileX,
        tileY
      );

      this.spawnSparkleParticles(worldX, worldY, '#38bdf8', 6);
      this.log(
        res.message || `Interação executada em ${blockDef.name} [${tileX}, ${tileY}]!`,
        'success'
      );
      return;
    }

    // 3. HIT Tool
    if (this.activeTool === 'hit') {
      this.selectedCoord = { tileX, tileY };
      this.player.isInteracting = true;
      this.player.interactTimer = 0.2;

      const targetEntity = this.chunkManager.getEntityAtTile(tileX, tileY);
      if (targetEntity) {
        const breakRes = BreakSystem.damageEntity(targetEntity, null);
        this.spawnDamageFeedback(worldX, worldY, breakRes.damageDealt);
        if (breakRes.isDestroyed) {
          this.chunkManager.removeEntity(targetEntity.id);
          this.spawnDropFeedback(worldX, worldY, breakRes.drops);
          this.log(`Entidade destruída!`, 'break');
        } else {
          this.log(`Hit na entidade! Dano causado: -${breakRes.damageDealt}`, 'damage');
        }
        this.notifySelection(tileX, tileY);
        return;
      }

      // Hit tile block
      const breakComp = blockDef.getComponent?.(BreakableComponent);
      const hardness = breakComp?.hardness ?? 2;
      const maxHp = Math.max(1, Math.round(hardness * 5));
      const key = `${tileX},${tileY}`;
      const currentHp = this.tileHealth.get(key) ?? maxHp;
      const damage = 1;
      const nextHp = Math.max(0, currentHp - damage);

      this.spawnDamageFeedback(worldX, worldY, damage);
      this.spawnSparkleParticles(worldX, worldY, '#fbbf24', 5);

      if (nextHp <= 0) {
        // Dismantle or break
        this.tileHealth.delete(key);
        const breakRes = BreakSystem.breakBlock(currentTileId, null, {
          chunkManager: this.chunkManager,
          tileX,
          tileY,
        });

        // Dismantle upper layer or ground block
        const dismantleRes = this.chunkManager.dismantleTile(tileX, tileY);
        if (!dismantleRes.dismantledBlockId) {
          this.chunkManager.setTile(tileX, tileY, layer.baseGround || 'grass');
        }

        this.spawnDropFeedback(worldX, worldY, breakRes.drops);
        this.spawnDebrisParticles(worldX, worldY, '#cbd5e1', 10);
        this.log(`Bloco ${blockDef.name} quebrado após receber dano!`, 'break');
      } else {
        this.tileHealth.set(key, nextHp);
        this.log(`Hit em ${blockDef.name}: vida [${nextHp}/${maxHp}]`, 'damage');
      }

      this.notifySelection(tileX, tileY);
      return;
    }

    // 4. BREAK Tool (Immediate destruction with real BreakSystem)
    if (this.activeTool === 'break') {
      this.selectedCoord = { tileX, tileY };
      this.player.isInteracting = true;
      this.player.interactTimer = 0.25;

      const targetEntity = this.chunkManager.getEntityAtTile(tileX, tileY);
      if (targetEntity) {
        const breakRes = BreakSystem.damageEntity(targetEntity, null);
        this.chunkManager.removeEntity(targetEntity.id);
        this.spawnDropFeedback(worldX, worldY, breakRes.drops);
        this.spawnDebrisParticles(worldX, worldY, '#cbd5e1', 10);
        this.log(`Entidade destruída com Break Tool!`, 'break');
        this.notifySelection(tileX, tileY);
        return;
      }

      const breakRes = BreakSystem.breakBlock(currentTileId, null, {
        chunkManager: this.chunkManager,
        tileX,
        tileY,
      });

      this.tileHealth.delete(`${tileX},${tileY}`);
      const dismantleRes = this.chunkManager.dismantleTile(tileX, tileY);
      if (!dismantleRes.dismantledBlockId) {
        this.chunkManager.setTile(tileX, tileY, layer.baseGround || 'grass');
      }

      this.spawnDropFeedback(worldX, worldY, breakRes.drops);
      this.spawnDebrisParticles(worldX, worldY, '#cbd5e1', 12);
      this.log(`Bloco ${blockDef.name} quebrado! ${breakRes.drops.length} drops gerados.`, 'break');
      this.notifySelection(tileX, tileY);
      return;
    }

    // 5. REMOVE Tool (Direct administrative dismantle/removal)
    if (this.activeTool === 'remove') {
      this.tileHealth.delete(`${tileX},${tileY}`);
      const dismantleRes = this.chunkManager.dismantleTile(tileX, tileY);
      if (!dismantleRes.dismantledBlockId) {
        layer.groundBlock = null;
        layer.upperLayers = [];
        layer.isDug = false;
        this.chunkManager.setTile(tileX, tileY, layer.baseGround || 'grass');
      }

      this.log(`Bloco removido de [${tileX}, ${tileY}].`, 'info');
      this.notifySelection(tileX, tileY);
      return;
    }

    // 6. PLACE Tool (Uses real ChunkManager layers & vertical building)
    if (this.activeTool === 'place') {
      const placeRes = this.chunkManager.placeBlockOnTile(tileX, tileY, this.placeBlockId);
      this.tileHealth.delete(`${tileX},${tileY}`);

      if (placeRes.success) {
        this.spawnSparkleParticles(worldX, worldY, '#10b981', 6);
        this.log(placeRes.message, 'success');
      } else {
        // Fallback direct placement on normal surface
        this.chunkManager.setTile(tileX, tileY, this.placeBlockId as TileType);
        this.log(`Colocado: ${this.placeBlockId} em [${tileX}, ${tileY}].`, 'success');
      }

      this.selectedCoord = { tileX, tileY };
      this.notifySelection(tileX, tileY);
      return;
    }

    // 7. DIG Tool (Escavar chão real com pá / criar chão cavado)
    if (this.activeTool === 'dig') {
      const digRes = this.chunkManager.digTile(tileX, tileY);
      if (digRes.success) {
        this.spawnSparkleParticles(worldX, worldY, '#a16207', 8);
        this.log(digRes.message || 'Solo escavado!', 'success');
      } else {
        this.log(digRes.message || 'Não é possível cavar aqui!', 'error');
      }
      this.notifySelection(tileX, tileY);
    }
  }

  private notifySelection(tileX: number, tileY: number): void {
    if (!this.onTileSelected) return;

    const layer = this.chunkManager.getTileLayer(tileX, tileY);
    const tileId = this.chunkManager.getTile(tileX, tileY);
    const blockDef = BlockDatabase.getBlock(tileId);
    const entity = this.chunkManager.getEntityAtTile(tileX, tileY);

    const breakComp = blockDef.getComponent?.(BreakableComponent);
    const maxHp = breakComp ? Math.max(1, Math.round(breakComp.hardness * 5)) : 10;
    const currentHp = this.tileHealth.get(`${tileX},${tileY}`) ?? maxHp;

    this.onTileSelected({
      tileX,
      tileY,
      worldX: (tileX + 0.5) * TILE_SIZE,
      worldY: (tileY + 0.5) * TILE_SIZE,
      blockDef,
      layerData: { ...layer, upperLayers: [...layer.upperLayers] },
      occupyingEntity: entity,
      health: { current: currentHp, max: maxHp },
    });
  }

  // --- Feedback & Particle Helpers ---

  private spawnDamageFeedback(worldX: number, worldY: number, damage: number): void {
    this.floatingTexts.push({
      id: `dmg_${Date.now()}_${Math.random()}`,
      text: `-${damage}`,
      x: worldX,
      y: worldY - 14,
      color: '#f87171',
      life: 0,
      maxLife: 0.8,
    });
  }

  private spawnDropFeedback(
    worldX: number,
    worldY: number,
    drops: Array<{ type: string; count: number; name: string }>
  ): void {
    drops.forEach((d, idx) => {
      this.floatingTexts.push({
        id: `drop_${Date.now()}_${idx}`,
        text: `+${d.count} ${d.name}`,
        x: worldX,
        y: worldY - 20 - idx * 16,
        color: '#4ade80',
        life: 0,
        maxLife: 1.2,
      });

      // Also create physical dropped item in world
      this.droppedItems.push({
        id: `drop_item_${Date.now()}_${idx}`,
        type: d.type,
        count: d.count,
        x: worldX + (Math.random() - 0.5) * 16,
        y: worldY + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        bobOffset: Math.random() * Math.PI,
        pickupCooldown: 0.5,
        createdAt: performance.now(),
      });
    });
  }

  private spawnSparkleParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 50,
        vy: -Math.random() * 40 - 10,
        size: Math.random() * 2 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.45,
      });
    }
  }

  private spawnDebrisParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 70,
        vy: -Math.random() * 60 - 20,
        size: Math.random() * 3 + 1,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  private log(text: string, type: 'info' | 'success' | 'damage' | 'break' | 'error'): void {
    if (this.onLog) {
      this.onLog({ text, type });
    }
  }

  // --- Environment & Setting Controls ---

  public setTool(tool: PreviewToolMode): void {
    this.activeTool = tool;
  }

  public setPlaceBlock(blockId: string): void {
    this.placeBlockId = blockId;
  }

  public setZoom(zoom: number): void {
    this.zoom = Math.max(0.6, Math.min(3.0, zoom));
  }

  public setTimeHour(hour: number): void {
    this.timeHour = (hour + 24) % 24;
  }

  public setWeather(weather: 'clear' | 'rain' | 'fog'): void {
    this.weatherType = weather;
    if (weather === 'rain') {
      this.weatherManager.startEvent('rain');
      this.weatherManager.stopEvent('fog');
    } else if (weather === 'fog') {
      this.weatherManager.startEvent('fog');
      this.weatherManager.stopEvent('rain');
    } else {
      this.weatherManager.stopEvent('rain');
      this.weatherManager.stopEvent('fog');
    }
  }

  public centerCamera(): void {
    this.camera = { x: 0, y: 0 };
    this.zoom = 1.5;
  }

  // --- Lifecycle Methods ---

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  private loop = (time: number): void => {
    if (!this.isRunning) return;

    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.gameTime += dt * 1000;

    if (!this.isPaused) {
      // 1. Update Entities inside ChunkManager
      this.chunkManager.update(dt, this.player);

      // 2. Update WeatherManager
      this.weatherManager.update(dt, this.player.x, this.player.y, this.timeHour);
      const climate = this.weatherManager.getCurrentPlayerClimate();
      if (this.onClimateUpdated) {
        this.onClimateUpdated(climate);
      }

      // 3. Update Player Animation Timers
      if (this.player.isInteracting && this.player.interactTimer) {
        this.player.interactTimer -= dt;
        if (this.player.interactTimer <= 0) {
          this.player.isInteracting = false;
        }
      }

      // 4. Update Particles
      this.particles = this.particles.filter((p) => {
        p.life += dt;
        if (p.life >= p.maxLife) return false;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        return true;
      });

      // 5. Update Floating Texts
      this.floatingTexts = this.floatingTexts.filter((ft) => {
        ft.life += dt;
        if (ft.life >= ft.maxLife) return false;
        ft.y -= 25 * dt;
        return true;
      });

      // 6. Update Dropped Items
      this.droppedItems = this.droppedItems.filter((dItem) => {
        dItem.x += dItem.vx * dt;
        dItem.y += dItem.vy * dt;
        dItem.vx *= 0.95;
        dItem.vy *= 0.95;
        dItem.bobOffset += dt * 4;
        return performance.now() - dItem.createdAt < 30000;
      });

      // 7. Render frame using real GameRenderer
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const effectiveZoom = this.zoom * dpr;

      this.gameRenderer.render(
        this.chunkManager,
        this.player,
        this.camera,
        this.particles,
        this.floatingTexts,
        effectiveZoom,
        this.timeHour,
        this.gameTime,
        null,
        this.droppedItems,
        this.mouseTarget,
        climate
      );
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Destroys the runtime, frees listeners, animation frames, chunk data, and references
   */
  public destroy(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.unbindEvents();

    this.particles = [];
    this.floatingTexts = [];
    this.droppedItems = [];
    this.tileHealth.clear();

    this.mouseTarget = null;
    this.selectedCoord = null;
  }
}
