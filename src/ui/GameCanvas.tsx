import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CursorItem,
  FloatingText,
  GameSettings,
  ItemStack,
  Particle,
  Player,
  TileType,
} from '../core/configuracao/types';
import { PLAYER_INTERACTION_RANGE } from '../core/configuracao/constants';
import { DroppedItemManager } from '../gameplay/entidades/itens/DroppedItemManager';
import { HarvestSystem } from '../gameplay/interacao/coleta/HarvestSystem';
import { MouseInteractionSystem, MouseTarget } from '../gameplay/interacao/MouseInteractionSystem';
import { getItemDef } from '../gameplay/inventario/items/ItemDefinitions';
import {
  addItemToSlots,
  createInitialSlots,
  handleMinecraftSlotClick,
  quickMoveSlot,
  sortInventorySlots,
} from '../gameplay/inventario/sistemas/InventorySystem';
import { ChunkManager } from '../gameplay/mundo/chunks/ChunkManager';
import { GameRenderer } from '../gameplay/mundo/renderizacao/GameRenderer';
import { soundManager } from '../sistemas/audio/SoundManager';
import { GameHUD, NearbyInteractableInfo } from './hud/GameHUD';
import { Hotbar } from './inventario/Hotbar';
import { InventoryModal } from './inventario/InventoryModal';
import { MiniMap } from './mapa/MiniMap';
import { GameMenuModal } from './menu/GameMenuModal';
import { CraftingSystem } from '../gameplay/crafting/CraftingSystem';
import { CraftingRecipe } from '../gameplay/crafting/Recipe';
import { ItemDatabase } from '../gameplay/itens/ItemDatabase';
import { ToolComponent } from '../gameplay/itens/componentes';
import { ENABLE_DEV_MENU } from '../dev/config';
import { WorldData } from '../gameplay/mundo/WorldStorage';
import { EntitySpawnerSystem, ActiveSpawnEvent } from '../gameplay/EntitySystem/spawning/EntitySpawnerSystem';
import { createWorldEntityFromDefinition } from '../gameplay/entidades/recursos/WorldEntity';
import { WeatherManager } from '../gameplay/mundo/clima/WeatherManager';
import { World } from '../gameplay/mundo/World';
import { globalWorldRegistry } from '../gameplay/mundo/WorldRegistry';

const INITIAL_SEED = 124816;

export interface GameCanvasProps {
  activeWorld?: WorldData | null;
  onExitToMainMenu?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  activeWorld,
  onExitToMainMenu,
}) => {
  const currentInitialSeed = activeWorld?.seed ?? INITIAL_SEED;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const chunkManagerRef = useRef<ChunkManager>(new ChunkManager(currentInitialSeed));
  const droppedItemManagerRef = useRef<DroppedItemManager>(new DroppedItemManager());
  const activeWorldModelRef = useRef<World>(
    activeWorld?.id
      ? globalWorldRegistry.get(activeWorld.id) ||
          new World(activeWorld.id, activeWorld.name, currentInitialSeed)
      : new World('default_world', 'Mundo Padrão', currentInitialSeed)
  );
  const weatherManagerRef = useRef<WeatherManager>(
    new WeatherManager(
      activeWorldModelRef.current.getComponent('WorldClimateComponent'),
      activeWorldModelRef.current.getComponent('WorldRegionComponent')
    )
  );

  // Game state
  const [seed, setSeed] = useState(currentInitialSeed);
  const [groundTile, setGroundTile] = useState<TileType>('grass');
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Menu Modal state (Controls, World Data, Admin / Developer)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const isMenuOpenRef = useRef<boolean>(false);
  isMenuOpenRef.current = isMenuOpen;
  const [menuInitialTab, setMenuInitialTab] = useState<'controls' | 'world' | 'admin'>('controls');
  const [menuInitialAdminSection, setMenuInitialAdminSection] = useState<'general' | 'item_creator'>('general');

  // Minecraft-inspired 36-slot Inventory & Hotbar state
  const [slots, setSlots] = useState<(ItemStack | null)[]>(() => createInitialSlots());
  const slotsRef = useRef<(ItemStack | null)[]>(slots);
  slotsRef.current = slots;

  const [selectedHotbarIndex, setSelectedHotbarIndex] = useState<number>(0);
  const selectedHotbarRef = useRef<number>(0);
  selectedHotbarRef.current = selectedHotbarIndex;

  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const isInventoryOpenRef = useRef<boolean>(false);
  isInventoryOpenRef.current = isInventoryOpen;

  const [cursorItem, setCursorItem] = useState<CursorItem | null>(null);
  const cursorItemRef = useRef<CursorItem | null>(null);
  cursorItemRef.current = cursorItem;

  // Nearest interactable target
  const [, setNearbyInteractable] = useState<NearbyInteractableInfo | null>(null);
  const nearbyRef = useRef<NearbyInteractableInfo | null>(null);

  // Settings & Day/Night state
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    timeOfDay: 'day',
    timeHour: 10.0, // Start at 10:00 AM bright daylight
    isTimeAutoAdvancing: true,
    timeSpeed: 1.0, // ~4.8 minutes for full 24h cycle
    zoom: 1.15,
    showMiniMap: false,
  });

  // Mutable refs for high frequency animation loop
  const timeHourRef = useRef<number>(10.0);
  const isTimeAutoAdvancingRef = useRef<boolean>(true);
  const timeSpeedRef = useRef<number>(1.0);

  // Camera state for smooth following
  const cameraRef = useRef<Camera>({
    x: 0,
    y: 0,
  });

  // Floating text notifications (+3 Madeira, etc)
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Player state reference for 60fps game loop without React re-render lag
  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 160,
    runSpeed: 280,
    isRunning: false,
    facing: 'down',
    animFrame: 0,
    animTimer: 0,
    isMoving: false,
  });

  // Expose React state for HUD updates
  const [playerHud, setPlayerHud] = useState<Player>({ ...playerRef.current });

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Mouse tracking and range-based target calculation
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseTargetRef = useRef<MouseTarget | null>(null);

  // Input state
  const keysRef = useRef<Record<string, boolean>>({});
  const lastStepSoundTimeRef = useRef<number>(0);

  // Initialize spawn position on grass
  useEffect(() => {
    const spawn = chunkManagerRef.current.findSafeSpawn();
    playerRef.current.x = spawn.x;
    playerRef.current.y = spawn.y;
    cameraRef.current.x = spawn.x;
    cameraRef.current.y = spawn.y;
    setPlayerHud({ ...playerRef.current });
  }, []);

  // Register EntitySpawnerSystem listener to spawn entities in chunk manager
  useEffect(() => {
    const handleSpawn = (event: ActiveSpawnEvent) => {
      const chunks = chunkManagerRef.current;
      if (!chunks) return;

      for (let i = 0; i < event.count; i++) {
        const ox = (Math.random() - 0.5) * 32;
        const oy = (Math.random() - 0.5) * 32;
        const livingEntity = createWorldEntityFromDefinition(
          event.entityDef,
          event.x + ox,
          event.y + oy
        );
        chunks.addEntity(livingEntity);
      }
    };

    const spawner = EntitySpawnerSystem.getInstance();
    spawner.addListener(handleSpawn);
    return () => {
      spawner.removeListener(handleSpawn);
    };
  }, []);

  // Sync settings changes with animation refs
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.timeHour !== undefined) {
        timeHourRef.current = newSettings.timeHour;
      }
      if (newSettings.isTimeAutoAdvancing !== undefined) {
        isTimeAutoAdvancingRef.current = newSettings.isTimeAutoAdvancing;
      }
      if (newSettings.timeSpeed !== undefined) {
        timeSpeedRef.current = newSettings.timeSpeed;
      }
      return updated;
    });
  }, []);

  // Update sound manager
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Handle Resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      rendererRef.current = new GameRenderer(canvas);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => ro.disconnect();
  }, []);

  // Core Harvest / Interact action execution
  const handleInteract = useCallback(() => {
    const player = playerRef.current;
    const target = HarvestSystem.findNearbyInteractable(player.x, player.y, chunkManagerRef.current);
    if (!target) return;

    const result = HarvestSystem.harvestEntity(target.entity.id, chunkManagerRef.current);
    if (!result) return;

    player.isInteracting = true;
    player.interactTimer = 0.2;

    if (target.action === 'chop') {
      soundManager.playChop();
    } else {
      soundManager.playHarvest();
    }
    soundManager.playPickup();

    let updatedSlots = [...slotsRef.current];
    let hadOverflow = false;

    for (const item of result.items) {
      const { newSlots, leftover } = addItemToSlots(updatedSlots, item.type, item.count);
      updatedSlots = newSlots;

      if (leftover > 0) {
        hadOverflow = true;
      }
    }

    setSlots(updatedSlots);
    slotsRef.current = updatedSlots;

    if (hadOverflow) {
      floatingTextsRef.current.push({
        id: `full_${Date.now()}`,
        text: `Inventário Cheio!`,
        x: player.x,
        y: player.y - 32,
        color: '#f87171',
        life: 0,
        maxLife: 1.2,
      });
      soundManager.playError();
    }

    // Spawn floating item collection text notifications
    result.items.forEach((item, idx) => {
      let color = '#fde047'; // Wood golden
      if (item.type === 'berries') color = '#f87171'; // Red
      if (item.type === 'fiber') color = '#86efac'; // Green
      if (item.type === 'seed') color = '#bef264'; // Lime
      if (item.type === 'flower') color = '#f472b6'; // Pink

      floatingTextsRef.current.push({
        id: `${Date.now()}_${idx}_${Math.random()}`,
        text: `+${item.count} ${item.name}`,
        x: target.entity.x + (Math.random() - 0.5) * 16,
        y: target.entity.y - 12 - idx * 16,
        color,
        life: 0,
        maxLife: 1.1,
      });
    });

    // Spawn harvest burst particles
    const pCount = target.action === 'chop' ? 8 : 6;
    for (let i = 0; i < pCount; i++) {
      const pColor =
        target.action === 'chop'
          ? Math.random() > 0.5
            ? '#b45309'
            : '#fef08a'
          : Math.random() > 0.5
          ? '#22c55e'
          : '#4ade80';

      particlesRef.current.push({
        x: target.entity.x + (Math.random() - 0.5) * 12,
        y: target.entity.y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 70,
        vy: -Math.random() * 50 - 20,
        size: Math.random() * 3 + 1.5,
        color: pColor,
        alpha: 0.9,
        life: 0,
        maxLife: 0.45,
      });
    }

    // Refresh interactable status immediately
    const nextTarget = HarvestSystem.findNearbyInteractable(player.x, player.y, chunkManagerRef.current);
    const nearbyInfo = nextTarget
      ? {
          prompt: nextTarget.prompt,
          action: nextTarget.action,
          itemType: nextTarget.itemType,
          entityId: nextTarget.entity.id,
        }
      : null;
    nearbyRef.current = nearbyInfo;
    setNearbyInteractable(nearbyInfo);
  }, []);

  const handleInteractRef = useRef(handleInteract);
  handleInteractRef.current = handleInteract;

  // Biome translation helper
  const getBiomeName = (tile: TileType) => {
    switch (tile) {
      case 'grass':
        return 'Planície de Grama';
      case 'dense_grass':
        return 'Bosque Fechado';
      case 'sand':
        return 'Costa Arenosa';
      case 'water':
        return 'Lago';
      case 'deep_water':
        return 'Águas Profundas';
      default:
        return 'Mundo Aberto';
    }
  };

  // Consume active held item (e.g. berries or apple)
  const handleUseHeldItem = useCallback(() => {
    const currentSlots = [...slotsRef.current];
    const activeSlot = currentSlots[selectedHotbarRef.current];
    if (!activeSlot) return;

    const def = getItemDef(activeSlot.type);
    if (!def.consumable) {
      soundManager.playError();
      return;
    }

    if (activeSlot.count > 1) {
      activeSlot.count -= 1;
    } else {
      currentSlots[selectedHotbarRef.current] = null;
    }

    setSlots(currentSlots);
    slotsRef.current = currentSlots;

    soundManager.playEat();

    floatingTextsRef.current.push({
      id: `eat_${Date.now()}`,
      text: `+15 Energia (${def.name})`,
      x: playerRef.current.x,
      y: playerRef.current.y - 28,
      color: '#34d399',
      life: 0,
      maxLife: 1.2,
    });

    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: playerRef.current.x + (Math.random() - 0.5) * 16,
        y: playerRef.current.y - 10 + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 40,
        vy: -Math.random() * 40 - 15,
        size: Math.random() * 3 + 1.5,
        color: '#34d399',
        alpha: 0.9,
        life: 0,
        maxLife: 0.5,
      });
    }
  }, []);

  const handleUseHeldItemRef = useRef(handleUseHeldItem);
  handleUseHeldItemRef.current = handleUseHeldItem;

  // Range-based Primary Click interaction (Harvest, Chop, Dig)
  const handlePrimaryClick = useCallback((target: MouseTarget) => {
    const player = playerRef.current;
    const chunks = chunkManagerRef.current;

    // 1. Strict interaction range check
    if (!target.inRange) {
      soundManager.playError();
      floatingTextsRef.current.push({
        id: `out_range_${Date.now()}`,
        text: 'Fora de Alcance!',
        x: target.worldX,
        y: target.worldY - 16,
        color: '#f87171',
        life: 0,
        maxLife: 0.8,
      });
      return;
    }

    const heldItem = slotsRef.current[selectedHotbarRef.current];
    const result = MouseInteractionSystem.executePrimaryAction(target, player, chunks, heldItem);
    if (!result.success) {
      if (result.reason === 'already_harvested') {
        soundManager.playError();
      }
      return;
    }

    player.isInteracting = true;
    player.interactTimer = 0.2;

    if (result.actionType === 'chop') {
      soundManager.playChop();
    } else if (result.actionType === 'harvest') {
      soundManager.playHarvest();
    } else if (result.actionType === 'attack') {
      soundManager.playHit();
      floatingTextsRef.current.push({
        id: `dmg_${Date.now()}_${Math.random()}`,
        text: '-12',
        x: target.worldX,
        y: target.worldY - 24,
        color: '#ef4444',
        life: 0,
        maxLife: 0.8,
      });
      for (let i = 0; i < 6; i++) {
        particlesRef.current.push({
          x: target.worldX + (Math.random() - 0.5) * 12,
          y: target.worldY + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 60,
          vy: -Math.random() * 40 - 15,
          size: Math.random() * 3 + 1.5,
          color: '#ef4444',
          alpha: 0.9,
          life: 0,
          maxLife: 0.4,
        });
      }
    }
    soundManager.playPickup();

    if (result.harvestResult) {
      let updatedSlots = [...slotsRef.current];
      let hadOverflow = false;

      for (const item of result.harvestResult.items) {
        const { newSlots, leftover } = addItemToSlots(updatedSlots, item.type, item.count);
        updatedSlots = newSlots;
        if (leftover > 0) {
          hadOverflow = true;
        }
      }

      setSlots(updatedSlots);
      slotsRef.current = updatedSlots;

      if (hadOverflow) {
        floatingTextsRef.current.push({
          id: `full_${Date.now()}`,
          text: 'Inventário Cheio!',
          x: player.x,
          y: player.y - 32,
          color: '#f87171',
          life: 0,
          maxLife: 1.2,
        });
        soundManager.playError();
      }

      // Spawn floating item collection text notifications
      result.harvestResult.items.forEach((item, idx) => {
        let color = '#fde047';
        if (item.type === 'berries') color = '#f87171';
        if (item.type === 'fiber') color = '#86efac';
        if (item.type === 'seed') color = '#bef264';
        if (item.type === 'flower') color = '#f472b6';

        floatingTextsRef.current.push({
          id: `${Date.now()}_${idx}_${Math.random()}`,
          text: `+${item.count} ${item.name}`,
          x: target.worldX + (Math.random() - 0.5) * 16,
          y: target.worldY - 12 - idx * 16,
          color,
          life: 0,
          maxLife: 1.1,
        });
      });

      // Spawn burst particles
      const pCount = result.actionType === 'chop' ? 8 : 6;
      for (let i = 0; i < pCount; i++) {
        const pColor =
          result.actionType === 'chop'
            ? Math.random() > 0.5
              ? '#b45309'
              : '#fef08a'
            : Math.random() > 0.5
            ? '#22c55e'
            : '#4ade80';

        particlesRef.current.push({
          x: target.worldX + (Math.random() - 0.5) * 12,
          y: target.worldY + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 70,
          vy: -Math.random() * 50 - 20,
          size: Math.random() * 3 + 1.5,
          color: pColor,
          alpha: 0.9,
          life: 0,
          maxLife: 0.45,
        });
      }
    } else if (result.actionType === 'dig') {
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push({
          x: target.worldX + (Math.random() - 0.5) * 10,
          y: target.worldY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 35,
          vy: -Math.random() * 35 - 10,
          size: Math.random() * 2.5 + 1,
          color: '#84cc16',
          alpha: 0.8,
          life: 0,
          maxLife: 0.35,
        });
      }
    }

    // Tool Durability & Breakage: tools wear out and are permanently lost when broken
    if (heldItem && (result.actionType === 'chop' || result.actionType === 'dig')) {
      const heldDef = ItemDatabase.getItem(heldItem.type);
      const toolComp = heldDef.getComponent(ToolComponent);
      if (toolComp) {
        const maxDura = heldItem.maxDurability || toolComp.maxDurability || 60;
        const currentDura = heldItem.durability !== undefined ? heldItem.durability : maxDura;
        const newDura = currentDura - 1;

        const currentSlots = [...slotsRef.current];
        if (newDura <= 0) {
          // Tool broken permanently!
          currentSlots[selectedHotbarRef.current] = null;
          setSlots(currentSlots);
          slotsRef.current = currentSlots;
          soundManager.playError();

          floatingTextsRef.current.push({
            id: `broken_tool_${Date.now()}`,
            text: `💥 ${heldDef.name} quebrou e foi perdido!`,
            x: player.x,
            y: player.y - 34,
            color: '#ef4444',
            life: 0,
            maxLife: 1.6,
          });
        } else {
          currentSlots[selectedHotbarRef.current] = {
            ...heldItem,
            durability: newDura,
            maxDurability: maxDura,
          };
          setSlots(currentSlots);
          slotsRef.current = currentSlots;
        }
      }
    }
  }, []);

  const handlePrimaryClickRef = useRef(handlePrimaryClick);
  handlePrimaryClickRef.current = handlePrimaryClick;

  // Range-based Secondary Click interaction (Use item, Eat food, Plant seeds)
  const handleSecondaryClick = useCallback((target: MouseTarget) => {
    const player = playerRef.current;
    const chunks = chunkManagerRef.current;
    const heldItem = slotsRef.current[selectedHotbarRef.current];

    // 1. Strict interaction range check
    if (!target.inRange) {
      soundManager.playError();
      floatingTextsRef.current.push({
        id: `out_range_${Date.now()}`,
        text: 'Fora de Alcance!',
        x: target.worldX,
        y: target.worldY - 16,
        color: '#f87171',
        life: 0,
        maxLife: 0.8,
      });
      return;
    }

    // 2. If holding consumable food (berries, apple): consume it!
    if (heldItem && getItemDef(heldItem.type).consumable) {
      handleUseHeldItemRef.current();
      return;
    }

    // 3. Execute secondary action (e.g. planting seeds or flowers)
    const result = MouseInteractionSystem.executeSecondaryAction(target, player, heldItem, chunks);
    if (!result.success) {
      if (result.reason === 'blocked') {
        floatingTextsRef.current.push({
          id: `blocked_${Date.now()}`,
          text: 'Espaço ocupado!',
          x: target.worldX,
          y: target.worldY - 16,
          color: '#fca5a5',
          life: 0,
          maxLife: 0.8,
        });
        soundManager.playError();
      } else if (result.reason === 'invalid_tile') {
        floatingTextsRef.current.push({
          id: `invalid_tile_${Date.now()}`,
          text: 'Solo inadequado!',
          x: target.worldX,
          y: target.worldY - 16,
          color: '#fca5a5',
          life: 0,
          maxLife: 0.8,
        });
        soundManager.playError();
      }
      return;
    }

    // Consume 1 item from active hotbar slot
    if (result.consumedItem && heldItem) {
      const currentSlots = [...slotsRef.current];
      const activeSlot = currentSlots[selectedHotbarRef.current];
      if (activeSlot) {
        if (activeSlot.count > 1) {
          activeSlot.count -= 1;
        } else {
          currentSlots[selectedHotbarRef.current] = null;
        }
        setSlots(currentSlots);
        slotsRef.current = currentSlots;
      }
    }

    player.isInteracting = true;
    player.interactTimer = 0.2;
    soundManager.playHarvest();

    if (result.message) {
      floatingTextsRef.current.push({
        id: `sec_${Date.now()}`,
        text: result.message,
        x: target.worldX,
        y: target.worldY - 18,
        color: '#4ade80',
        life: 0,
        maxLife: 1.1,
      });
    }

    // Planting particles
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: target.worldX + (Math.random() - 0.5) * 12,
        y: target.worldY + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 40,
        vy: -Math.random() * 40 - 15,
        size: Math.random() * 2.5 + 1.5,
        color: '#22c55e',
        alpha: 0.9,
        life: 0,
        maxLife: 0.45,
      });
    }
  }, []);

  const handleSecondaryClickRef = useRef(handleSecondaryClick);
  handleSecondaryClickRef.current = handleSecondaryClick;

  // Minecraft-style slot click handler
  const handleSlotClick = useCallback(
    (slotIndex: number, isRightClick: boolean, isShiftClick: boolean) => {
      // Bloqueio rigoroso: com o inventário fechado, a Hotbar é apenas para uso e seleção, não para gerenciamento
      if (!isInventoryOpenRef.current) {
        if (slotIndex >= 0 && slotIndex < 9) {
          setSelectedHotbarIndex(slotIndex);
          soundManager.playInventoryClick();
        }
        return;
      }

      if (isShiftClick) {
        const { newSlots, moved } = quickMoveSlot(slotsRef.current, slotIndex);
        if (moved) {
          setSlots(newSlots);
          slotsRef.current = newSlots;
          soundManager.playInventoryDrop();
        } else {
          soundManager.playError();
        }
        return;
      }

      const { newSlots, newCursor, action } = handleMinecraftSlotClick(
        slotsRef.current,
        slotIndex,
        isRightClick,
        cursorItemRef.current
      );

      setSlots(newSlots);
      slotsRef.current = newSlots;
      setCursorItem(newCursor);
      cursorItemRef.current = newCursor;

      if (action === 'pickup') {
        soundManager.playInventoryClick();
      } else if (action === 'drop' || action === 'merge') {
        soundManager.playInventoryDrop();
      } else if (action === 'split') {
        soundManager.playSplit();
      } else if (action === 'swap') {
        soundManager.playInventoryClick();
      }
    },
    []
  );

  // Auto-sort inventory
  const handleSortInventory = useCallback(() => {
    const sorted = sortInventorySlots(slotsRef.current, false);
    setSlots(sorted);
    slotsRef.current = sorted;
  }, []);

  // Return item in cursor back to inventory (or drop on ground if completely full)
  const handleClearCursorItem = useCallback(() => {
    const currentCursor = cursorItemRef.current;
    if (!currentCursor) return;

    const { newSlots, leftover } = addItemToSlots(
      slotsRef.current,
      currentCursor.item.type,
      currentCursor.item.count
    );

    setSlots(newSlots);
    slotsRef.current = newSlots;
    setCursorItem(null);
    cursorItemRef.current = null;

    if (leftover > 0) {
      const player = playerRef.current;
      droppedItemManagerRef.current.spawnItem(
        currentCursor.item.type,
        leftover,
        player.x,
        player.y,
        player.facing,
        chunkManagerRef.current
      );
      soundManager.playDropWorld();
      floatingTextsRef.current.push({
        id: `discard_${Date.now()}`,
        text: `Sem espaço! Dropado no chão (${leftover})`,
        x: player.x,
        y: player.y - 20,
        color: '#f87171',
        life: 0,
        maxLife: 1.2,
      });
    }
  }, []);

  // Discard slot directly to Trash (destruction)
  const handleDiscardSlot = useCallback((slotIndex: number) => {
    const currentSlots = [...slotsRef.current];
    const item = currentSlots[slotIndex];
    if (!item) return;

    const def = getItemDef(item.type);
    currentSlots[slotIndex] = null;
    setSlots(currentSlots);
    slotsRef.current = currentSlots;

    soundManager.playTrash();

    floatingTextsRef.current.push({
      id: `trash_${Date.now()}`,
      text: `Descartado: ${def.name} (${item.count})`,
      x: playerRef.current.x,
      y: playerRef.current.y - 20,
      color: '#fb7185',
      life: 0,
      maxLife: 1.2,
    });
  }, []);

  // Discard cursor item directly to Trash
  const handleDiscardCursorItem = useCallback(() => {
    const currentCursor = cursorItemRef.current;
    if (!currentCursor) return;

    const def = getItemDef(currentCursor.item.type);
    const count = currentCursor.item.count;
    setCursorItem(null);
    cursorItemRef.current = null;

    soundManager.playTrash();

    floatingTextsRef.current.push({
      id: `trash_cursor_${Date.now()}`,
      text: `Descartado: ${def.name} (${count})`,
      x: playerRef.current.x,
      y: playerRef.current.y - 20,
      color: '#fb7185',
      life: 0,
      maxLife: 1.2,
    });
  }, []);

  // Drop item from slot into the game world at the player's position
  const handleDropSlotToWorld = useCallback((slotIndex: number) => {
    const currentSlots = [...slotsRef.current];
    const item = currentSlots[slotIndex];
    if (!item) return;

    const def = getItemDef(item.type);
    currentSlots[slotIndex] = null;
    setSlots(currentSlots);
    slotsRef.current = currentSlots;

    const player = playerRef.current;
    droppedItemManagerRef.current.spawnItem(
      item.type,
      item.count,
      player.x,
      player.y,
      player.facing,
      chunkManagerRef.current
    );

    soundManager.playDropWorld();

    floatingTextsRef.current.push({
      id: `drop_world_${Date.now()}`,
      text: `Dropado: ${def.name} (x${item.count})`,
      x: player.x,
      y: player.y - 20,
      color: '#38bdf8',
      life: 0,
      maxLife: 1.2,
    });

    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        x: player.x + (Math.random() - 0.5) * 12,
        y: player.y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        size: Math.random() * 2 + 1,
        color: def.accentColor,
        alpha: 0.8,
        life: 0,
        maxLife: 0.35,
      });
    }
  }, []);

  // Drop cursor item into the game world
  const handleDropCursorItemToWorld = useCallback(() => {
    const currentCursor = cursorItemRef.current;
    if (!currentCursor) return;

    const def = getItemDef(currentCursor.item.type);
    const { type, count } = currentCursor.item;

    setCursorItem(null);
    cursorItemRef.current = null;

    const player = playerRef.current;
    droppedItemManagerRef.current.spawnItem(
      type,
      count,
      player.x,
      player.y,
      player.facing,
      chunkManagerRef.current
    );

    soundManager.playDropWorld();

    floatingTextsRef.current.push({
      id: `drop_cursor_world_${Date.now()}`,
      text: `Dropado: ${def.name} (x${count})`,
      x: player.x,
      y: player.y - 20,
      color: '#38bdf8',
      life: 0,
      maxLife: 1.2,
    });

    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        x: player.x + (Math.random() - 0.5) * 12,
        y: player.y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        size: Math.random() * 2 + 1,
        color: def.accentColor,
        alpha: 0.8,
        life: 0,
        maxLife: 0.35,
      });
    }
  }, []);

  // Craft recipe handler
  const handleCraftRecipe = useCallback(
    (recipe: CraftingRecipe, multiplier: number = 1) => {
      const result = CraftingSystem.craft(recipe, slotsRef.current, multiplier);
      if (!result.success) {
        soundManager.playError();
        floatingTextsRef.current.push({
          id: `craft_err_${Date.now()}`,
          text: 'Recursos insuficientes!',
          x: playerRef.current.x,
          y: playerRef.current.y - 24,
          color: '#f87171',
          life: 0,
          maxLife: 0.9,
        });
        return;
      }

      setSlots(result.newSlots);
      slotsRef.current = result.newSlots;
      soundManager.playPickup();

      floatingTextsRef.current.push({
        id: `craft_ok_${Date.now()}`,
        text: `+${result.craftedItem.count} ${result.craftedItem.name}`,
        x: playerRef.current.x,
        y: playerRef.current.y - 28,
        color: '#4ade80',
        life: 0,
        maxLife: 1.2,
      });

      if (result.leftover > 0) {
        droppedItemManagerRef.current.spawnItem(
          result.craftedItem.type,
          result.leftover,
          playerRef.current.x,
          playerRef.current.y,
          playerRef.current.facing,
          chunkManagerRef.current
        );
        floatingTextsRef.current.push({
          id: `craft_full_${Date.now()}`,
          text: `Inventário cheio! Dropado no chão (${result.leftover})`,
          x: playerRef.current.x,
          y: playerRef.current.y - 42,
          color: '#f59e0b',
          life: 0,
          maxLife: 1.3,
        });
      }
    },
    []
  );

  // Drag & drop item between slots
  const handleDropItemToSlot = useCallback((targetIndex: number, e: React.DragEvent) => {
    // Bloqueio rigoroso: reorganização/drop de itens só é permitido com o inventário aberto
    if (!isInventoryOpenRef.current) {
      return;
    }

    const fromIndexStr = e.dataTransfer.getData('text/plain');
    if (!fromIndexStr) return;
    const fromIndex = parseInt(fromIndexStr, 10);
    if (isNaN(fromIndex) || fromIndex === targetIndex) return;

    const currentSlots = [...slotsRef.current];
    const source = currentSlots[fromIndex];
    const target = currentSlots[targetIndex];

    if (!source) return;

    const def = getItemDef(source.type);

    if (!target) {
      currentSlots[targetIndex] = source;
      currentSlots[fromIndex] = null;
      soundManager.playInventoryDrop();
    } else if (target.type === source.type) {
      const space = def.maxStack - target.count;
      const add = Math.min(space, source.count);
      target.count += add;
      source.count -= add;
      if (source.count <= 0) {
        currentSlots[fromIndex] = null;
      }
      soundManager.playInventoryDrop();
    } else {
      currentSlots[targetIndex] = source;
      currentSlots[fromIndex] = target;
      soundManager.playInventoryClick();
    }

    setSlots(currentSlots);
    slotsRef.current = currentSlots;
  }, []);

  // Split exact count from slot into cursor
  const handleSplitExactStack = useCallback((slotIndex: number, count: number) => {
    const currentSlots = [...slotsRef.current];
    const source = currentSlots[slotIndex];
    if (!source || count <= 0 || count >= source.count) return;

    source.count -= count;
    const newCursor: CursorItem = {
      item: {
        id: `${source.type}_${Date.now()}`,
        type: source.type,
        count,
      },
      sourceSlotIndex: slotIndex,
    };

    setSlots(currentSlots);
    slotsRef.current = currentSlots;
    setCursorItem(newCursor);
    cursorItemRef.current = newCursor;
    soundManager.playSplit();
  }, []);

  // Mouse tracking and range-based world interaction
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    mousePosRef.current = { x: canvasX, y: canvasY };
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    mousePosRef.current = null;
    mouseTargetRef.current = null;
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // If inventory or menu is open, do not trigger world interaction
    if (isInventoryOpenRef.current || isMenuOpenRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    mousePosRef.current = { x: canvasX, y: canvasY };

    const player = playerRef.current;
    const camera = cameraRef.current;
    const chunks = chunkManagerRef.current;
    const heldItem = slotsRef.current[selectedHotbarRef.current];

    const target = MouseInteractionSystem.getMouseTarget(
      canvasX,
      canvasY,
      canvas.width,
      canvas.height,
      player,
      camera,
      settings.zoom,
      chunks,
      heldItem,
      PLAYER_INTERACTION_RANGE
    );

    if (e.button === 0) {
      // Left Click: Primary action (harvest, chop, inspect ground)
      handlePrimaryClickRef.current(target);
    } else if (e.button === 2) {
      // Right Click: Secondary action (eat food, plant seeds/flowers, place items)
      e.preventDefault();
      handleSecondaryClickRef.current(target);
    }
  }, [settings.zoom]);

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Mouse Wheel scroll listener for Hotbar cycling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isInventoryOpenRef.current) return;
      if (e.deltaY > 0) {
        setSelectedHotbarIndex((prev) => (prev + 1) % 9);
        soundManager.playInventoryClick();
      } else if (e.deltaY < 0) {
        setSelectedHotbarIndex((prev) => (prev - 1 + 9) % 9);
        soundManager.playInventoryClick();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore gameplay input if user is typing in an input element or modal editor
      const target = e.target as HTMLElement | null;
      const active = document.activeElement as HTMLElement | null;
      const isInputFocused =
        (target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('input, textarea, select, [contenteditable="true"]') !== null
        )) ||
        (active && (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable ||
          active.closest('input, textarea, select, [contenteditable="true"]') !== null
        ));

      if (isInputFocused) {
        return;
      }

      // Hotbar selection numbers 1..9
      if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= 9) {
          setSelectedHotbarIndex(digit - 1);
          soundManager.playInventoryClick();
          return;
        }
      }

      // Open/Close Inventory [E] or [I]
      if (e.code === 'KeyE' || e.code === 'KeyI') {
        e.preventDefault();
        setIsInventoryOpen((prev) => {
          const next = !prev;
          if (next) {
            soundManager.playInventoryClick();
          } else {
            soundManager.playInventoryDrop();
            handleClearCursorItem();
          }
          return next;
        });
        return;
      }

      // Admin / Criação de Item shortcut [F8] or [Ctrl+Shift+D] -> opens Game Menu at Admin > Criação de Item
      if (ENABLE_DEV_MENU && (e.code === 'F8' || (e.ctrlKey && e.shiftKey && e.code === 'KeyD'))) {
        e.preventDefault();
        setMenuInitialTab('admin');
        setMenuInitialAdminSection('item_creator');
        setIsMenuOpen(true);
        soundManager.playInventoryClick();
        return;
      }

      // Escape: close inventory if open, otherwise toggle Game Menu
      if (e.code === 'Escape') {
        if (isInventoryOpenRef.current) {
          setIsInventoryOpen(false);
          handleClearCursorItem();
          soundManager.playInventoryDrop();
          return;
        }
        setIsMenuOpen((prev) => {
          const next = !prev;
          if (next) {
            setMenuInitialTab('controls');
            setMenuInitialAdminSection('general');
          }
          soundManager.playInventoryClick();
          return next;
        });
        return;
      }

      // Mini-map toggle shortcut [M]
      if (e.code === 'KeyM') {
        setShowMiniMap((prev) => {
          const next = !prev;
          soundManager.playInventoryClick();
          return next;
        });
        return;
      }

      // Crafting / Inventory toggle shortcut [C]
      if (e.code === 'KeyC') {
        soundManager.playInventoryClick();
        setIsInventoryOpen((prev) => {
          const next = !prev;
          if (!next) {
            handleClearCursorItem();
          }
          return next;
        });
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;

      // WASD navigation
      if (e.code === 'KeyW') keysRef.current['ArrowUp'] = true;
      if (e.code === 'KeyS') keysRef.current['ArrowDown'] = true;
      if (e.code === 'KeyA') keysRef.current['ArrowLeft'] = true;
      if (e.code === 'KeyD') keysRef.current['ArrowRight'] = true;

      // Interaction key [Space]
      if (e.code === 'Space') {
        if (!isInventoryOpenRef.current && !isMenuOpenRef.current) {
          if (mouseTargetRef.current && mouseTargetRef.current.inRange) {
            handlePrimaryClickRef.current(mouseTargetRef.current);
          } else {
            handleInteractRef.current();
          }
        }
      }

      if (e.shiftKey) {
        playerRef.current.isRunning = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === 'KeyW') keysRef.current['ArrowUp'] = false;
      if (e.code === 'KeyS') keysRef.current['ArrowDown'] = false;
      if (e.code === 'KeyA') keysRef.current['ArrowLeft'] = false;
      if (e.code === 'KeyD') keysRef.current['ArrowRight'] = false;

      if (!e.shiftKey && !keysRef.current['ShiftLeft'] && !keysRef.current['ShiftRight']) {
        playerRef.current.isRunning = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleClearCursorItem]);

  // New random map seed
  const handleNewSeed = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    setSeed(newSeed);
    chunkManagerRef.current.setSeed(newSeed);
    droppedItemManagerRef.current.clear();
    const spawn = chunkManagerRef.current.findSafeSpawn();
    playerRef.current.x = spawn.x;
    playerRef.current.y = spawn.y;
    cameraRef.current.x = spawn.x;
    cameraRef.current.y = spawn.y;
    soundManager.playChime();
    setPlayerHud({ ...playerRef.current });
  }, []);

  // Reset to safe spawn
  const handleResetSpawn = useCallback(() => {
    const spawn = chunkManagerRef.current.findSafeSpawn();
    playerRef.current.x = spawn.x;
    playerRef.current.y = spawn.y;
    cameraRef.current.x = spawn.x;
    cameraRef.current.y = spawn.y;
    soundManager.playChime();
    setPlayerHud({ ...playerRef.current });
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudUpdateTimer = 0;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const player = playerRef.current;
      const chunks = chunkManagerRef.current;
      const keys = keysRef.current;

      // Advance world entity animations, living mob AI & regrowth timers
      chunks.update(dt, player);

      // Advance dynamic entity spawner system tick
      EntitySpawnerSystem.getInstance().update(
        dt,
        player,
        chunks,
        timeHourRef.current,
        chunks.getLivingEntities()
      );

      // 1. Advance Continuous Day & Night Cycle (Gradual 24h Clock)
      if (isTimeAutoAdvancingRef.current) {
        timeHourRef.current = (timeHourRef.current + (dt * timeSpeedRef.current) / 12) % 24;
      }

      // 2. Calculate input vector (keyboard only for pure PC gameplay)
      let inputX = 0;
      let inputY = 0;

      if (!isInventoryOpenRef.current && !isMenuOpenRef.current) {
        if (keys['ArrowLeft'] || keys['KeyA']) inputX -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) inputX += 1;
        if (keys['ArrowUp'] || keys['KeyW']) inputY -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) inputY += 1;
      }

      const inputMagnitude = Math.hypot(inputX, inputY);
      const isMoving = inputMagnitude > 0.05;
      player.isMoving = isMoving;

      // 3. Movement & Physics
      if (isMoving) {
        const normX = inputX / (inputMagnitude > 1 ? inputMagnitude : 1);
        const normY = inputY / (inputMagnitude > 1 ? inputMagnitude : 1);

        if (Math.abs(normX) > Math.abs(normY)) {
          player.facing = normX > 0 ? 'right' : 'left';
        } else {
          player.facing = normY > 0 ? 'down' : 'up';
        }

        const moveSpeed = player.isRunning ? player.runSpeed : player.speed;
        const targetVx = normX * moveSpeed;
        const targetVy = normY * moveSpeed;

        player.vx += (targetVx - player.vx) * 0.35;
        player.vy += (targetVy - player.vy) * 0.35;

        const nextX = player.x + player.vx * dt;
        const nextY = player.y + player.vy * dt;

        const playerRadius = 9;
        const canMoveBoth = !chunks.isSolid(nextX, nextY, playerRadius);

        if (canMoveBoth) {
          player.x = nextX;
          player.y = nextY;
        } else {
          if (!chunks.isSolid(nextX, player.y, playerRadius)) {
            player.x = nextX;
          }
          if (!chunks.isSolid(player.x, nextY, playerRadius)) {
            player.y = nextY;
          }
        }

        const currentGround = chunks.getGroundType(player.x, player.y);
        const stepInterval = player.isRunning ? 230 : 340;
        if (currentTime - lastStepSoundTimeRef.current > stepInterval) {
          lastStepSoundTimeRef.current = currentTime;
          const surface = currentGround === 'sand' ? 'sand' : 'grass';
          soundManager.playFootstep(surface);

          if (player.isRunning) {
            for (let i = 0; i < 2; i++) {
              particlesRef.current.push({
                x: player.x + (Math.random() - 0.5) * 8,
                y: player.y + 10 + (Math.random() - 0.5) * 4,
                vx: -player.vx * 0.2 + (Math.random() - 0.5) * 20,
                vy: -player.vy * 0.2 + (Math.random() - 0.5) * 20 - 10,
                size: Math.random() * 2.5 + 1.5,
                color: currentGround === 'sand' ? '#d4b373' : '#86efac',
                alpha: 0.8,
                life: 0,
                maxLife: 0.35,
              });
            }
          }
        }
      } else {
        player.vx *= 0.7;
        player.vy *= 0.7;
        if (Math.abs(player.vx) < 1) player.vx = 0;
        if (Math.abs(player.vy) < 1) player.vy = 0;
      }

      // 4. Smooth Camera Following
      const camera = cameraRef.current;
      const camSmoothFactor = 1 - Math.exp(-12 * dt);
      camera.x += (player.x - camera.x) * camSmoothFactor;
      camera.y += (player.y - camera.y) * camSmoothFactor;

      // 5. Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 6. Update Floating Text Notifications
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.life += dt;
        ft.y -= 22 * dt;
        if (ft.life >= ft.maxLife) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // 7. Check Proximity to Interactables
      const nearbyTarget = HarvestSystem.findNearbyInteractable(player.x, player.y, chunks);
      const currentNearby = nearbyTarget
        ? {
            prompt: nearbyTarget.prompt,
            action: nearbyTarget.action,
            itemType: nearbyTarget.itemType,
            entityId: nearbyTarget.entity.id,
          }
        : null;

      // 7b. Update Dropped Items physics & player magnetic collection
      droppedItemManagerRef.current.update(
        dt,
        player,
        slotsRef.current,
        (type, collectedCount, x, y, newSlots) => {
          setSlots(newSlots);
          slotsRef.current = newSlots;
          soundManager.playPickup();

          const def = getItemDef(type);
          floatingTextsRef.current.push({
            id: `pickup_${Date.now()}_${Math.random()}`,
            text: `+${collectedCount} ${def.name}`,
            x,
            y: y - 14,
            color: '#4ade80',
            life: 0,
            maxLife: 0.9,
          });

          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              x: x + (Math.random() - 0.5) * 8,
              y: y + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 30,
              vy: -Math.random() * 30 - 10,
              size: Math.random() * 2 + 1,
              color: def.accentColor,
              alpha: 0.8,
              life: 0,
              maxLife: 0.3,
            });
          }
        },
        () => {
          floatingTextsRef.current.push({
            id: `full_${Date.now()}`,
            text: 'Inventário Cheio!',
            x: player.x,
            y: player.y - 24,
            color: '#f87171',
            life: 0,
            maxLife: 0.8,
          });
        }
      );

      // 7c. Compute dynamic mouse interaction target & range feedback
      let currentMouseTarget: MouseTarget | null = null;
      if (
        mousePosRef.current &&
        canvasRef.current &&
        !isInventoryOpenRef.current &&
        !isMenuOpenRef.current
      ) {
        const heldItem = slotsRef.current[selectedHotbarRef.current];
        currentMouseTarget = MouseInteractionSystem.getMouseTarget(
          mousePosRef.current.x,
          mousePosRef.current.y,
          canvasRef.current.width,
          canvasRef.current.height,
          player,
          camera,
          settings.zoom,
          chunks,
          heldItem,
          PLAYER_INTERACTION_RANGE
        );
      }
      mouseTargetRef.current = currentMouseTarget;

      // 7d. Update Dynamic Weather System
      weatherManagerRef.current.update(dt, player.x, player.y, timeHourRef.current);
      const activeClimate = weatherManagerRef.current.getCurrentPlayerClimate();

      // 8. Render Frame
      if (rendererRef.current) {
        rendererRef.current.render(
          chunks,
          player,
          camera,
          particlesRef.current,
          floatingTextsRef.current,
          settings.zoom,
          timeHourRef.current,
          currentTime,
          currentMouseTarget?.entity?.id || currentNearby?.entityId,
          droppedItemManagerRef.current.getItems(),
          currentMouseTarget,
          activeClimate
        );
      }

      // 9. Periodic HUD state sync
      hudUpdateTimer += dt;
      if (hudUpdateTimer >= 0.1) {
        hudUpdateTimer = 0;
        const currentTile = chunks.getGroundType(player.x, player.y);
        setGroundTile(currentTile);
        setPlayerHud({ ...player });
        setNearbyInteractable(currentNearby);

        setSettings((prev) => {
          if (Math.abs(prev.timeHour - timeHourRef.current) > 0.02) {
            return { ...prev, timeHour: timeHourRef.current };
          }
          return prev;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [settings.zoom]);

  return (
    <div
      ref={containerRef}
      id="game-viewport-container"
      className="relative w-full h-screen overflow-hidden bg-[#1a1a1a] font-sans select-none"
    >
      {/* The 2D Canvas */}
      <canvas
        ref={canvasRef}
        id="game-canvas"
        className="block w-full h-full cursor-crosshair"
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        onMouseDown={handleCanvasMouseDown}
        onContextMenu={handleCanvasContextMenu}
      />

      {/* Mini-Map in Top-Right (Optional, toggled via Menu or M) */}
      {showMiniMap && (
        <div className="absolute top-5 right-5 z-20 pointer-events-auto">
          <MiniMap
            chunkManager={chunkManagerRef.current}
            player={playerHud}
            isOpen={showMiniMap}
            onToggle={() => setShowMiniMap((v) => !v)}
          />
        </div>
      )}

      {/* Active World Badge & Quick Main Menu Navigation */}
      {activeWorld && (
        <div className="absolute top-5 left-5 z-20 pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-zinc-700/80 text-xs shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-bold text-white truncate max-w-[140px]">{activeWorld.name}</span>
          <span className="text-zinc-400 font-mono text-[10px] hidden sm:inline">
            Seed: {activeWorld.seed}
          </span>
          {onExitToMainMenu && (
            <button
              type="button"
              onClick={onExitToMainMenu}
              className="ml-1 px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold border border-zinc-600/70 transition-colors cursor-pointer"
              title="Sair para o Menu Principal"
            >
              Menu Principal
            </button>
          )}
        </div>
      )}

      {/* Clean Minimalist PC HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <GameHUD
          onOpenMenu={() => {
            soundManager.playInventoryClick();
            setMenuInitialTab('controls');
            setMenuInitialAdminSection('general');
            setIsMenuOpen(true);
          }}
          onToggleCrafting={() => {
            soundManager.playInventoryClick();
            setIsInventoryOpen((v) => !v);
          }}
          isCraftingOpen={isInventoryOpen}
        />
      </div>

      {/* Minecraft-style Bottom Hotbar Dock for PC */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 pointer-events-none flex justify-center px-3">
        <Hotbar
          slots={slots}
          selectedSlotIndex={selectedHotbarIndex}
          onSelectSlot={(idx) => {
            setSelectedHotbarIndex(idx);
            soundManager.playInventoryClick();
          }}
          onOpenInventory={() => {
            soundManager.playInventoryClick();
            setIsInventoryOpen(true);
          }}
          cursorItem={cursorItem}
          onSlotClick={handleSlotClick}
          onDropItem={handleDropItemToSlot}
          onUseHeldItem={handleUseHeldItem}
        />
      </div>

      {/* Full Minecraft-style Inventory Screen Modal with Fixed Integrated Crafting */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          handleClearCursorItem();
        }}
        slots={slots}
        player={playerHud}
        biomeName={getBiomeName(groundTile)}
        cursorItem={cursorItem}
        onSlotClick={handleSlotClick}
        onSortInventory={handleSortInventory}
        onClearCursorItem={handleClearCursorItem}
        onDiscardSlot={handleDiscardSlot}
        onDiscardCursorItem={handleDiscardCursorItem}
        onDropItemToSlot={handleDropItemToSlot}
        onDropSlotToWorld={handleDropSlotToWorld}
        onDropCursorItemToWorld={handleDropCursorItemToWorld}
        onSplitExactStack={handleSplitExactStack}
        onCraft={handleCraftRecipe}
        initialCraftingOpen={true}
      />

      {/* Unified Desktop Game Menu (Controls, World Data, Admin / Desenvolvedor) */}
      <GameMenuModal
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
          soundManager.playInventoryClick();
        }}
        player={playerHud}
        groundTile={groundTile}
        seed={seed}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onNewSeed={handleNewSeed}
        onResetSpawn={handleResetSpawn}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap((v) => !v)}
        initialTab={menuInitialTab}
        initialAdminSection={menuInitialAdminSection}
        onExitToMainMenu={onExitToMainMenu}
      />
    </div>
  );
};
