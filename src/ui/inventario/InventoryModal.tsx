import {
  ArrowUpDown,
  Backpack,
  Hammer,
  Info,
  Layers,
  Split,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CursorItem, ItemStack, Player } from '../../core/configuracao/types';
import { CraftingRecipe } from '../../gameplay/crafting/Recipe';
import { getItemDef } from '../../gameplay/inventario/items/ItemDefinitions';
import {
  HOTBAR_SLOTS_COUNT,
  MAIN_INVENTORY_SLOTS_COUNT,
  TOTAL_INVENTORY_SLOTS,
} from '../../gameplay/inventario/slots/InventorySlots';
import { soundManager } from '../../sistemas/audio/SoundManager';
import { IntegratedCraftingSection } from '../crafting/CraftingPanel';
import { ItemVisualRenderer } from '../itens/ItemVisualRenderer';
import { ItemSlot } from './ItemSlot';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: (ItemStack | null)[];
  player: Player;
  biomeName: string;
  cursorItem: CursorItem | null;
  onSlotClick: (index: number, isRightClick: boolean, isShiftClick: boolean) => void;
  onSortInventory: () => void;
  onClearCursorItem: () => void;
  onDiscardSlot: (index: number) => void;
  onDiscardCursorItem: () => void;
  onDropItemToSlot: (targetIndex: number, e: React.DragEvent) => void;
  onDropSlotToWorld: (index: number) => void;
  onDropCursorItemToWorld: () => void;
  onSplitExactStack?: (slotIndex: number, count: number) => void;
  onCraft?: (recipe: CraftingRecipe, multiplier?: number) => void;
  initialCraftingOpen?: boolean;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  slots,
  player,
  biomeName,
  cursorItem,
  onSlotClick,
  onSortInventory,
  onClearCursorItem,
  onDiscardSlot,
  onDiscardCursorItem,
  onDropItemToSlot,
  onDropSlotToWorld,
  onDropCursorItemToWorld,
  onSplitExactStack,
  onCraft,
  initialCraftingOpen = true,
}) => {
  // Cursor item position tracking for smooth floating render
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom split stack modal state
  const [splittingSlotIndex, setSplittingSlotIndex] = useState<number | null>(null);
  const [splitAmount, setSplitAmount] = useState<number>(1);

  // Trash slot drag and hover states
  const [trashHovered, setTrashHovered] = useState(false);
  const [isTrashDragOver, setIsTrashDragOver] = useState(false);

  // Dragging outside window (world drop) state
  const [isDraggingOutside, setIsDraggingOutside] = useState(false);
  const [, setDraggingSlotIndex] = useState<number | null>(null);

  // Integrated Crafting section toggle state
  const [isCraftingAttached, setIsCraftingAttached] = useState(initialCraftingOpen);

  // Mobile active tab: 'inventory' | 'crafting'
  const [mobileTab, setMobileTab] = useState<'inventory' | 'crafting'>('inventory');

  // Track mouse coordinates for floating item
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

  if (!isOpen) return null;

  const slotToSplit = splittingSlotIndex !== null ? slots[splittingSlotIndex] : null;

  const handleConfirmSplit = () => {
    if (splittingSlotIndex !== null && onSplitExactStack && slotToSplit) {
      onSplitExactStack(splittingSlotIndex, splitAmount);
      soundManager.playSplit();
    }
    setSplittingSlotIndex(null);
  };

  // Trash zone drop and click handlers
  const handleTrashClick = () => {
    if (cursorItem) {
      onDiscardCursorItem();
    }
  };

  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsTrashDragOver(true);
    setIsDraggingOutside(false);
  };

  const handleTrashDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTrashDragOver(false);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTrashDragOver(false);
    setIsDraggingOutside(false);
    setDraggingSlotIndex(null);

    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      const slotIdx = parseInt(data, 10);
      if (!isNaN(slotIdx)) {
        onDiscardSlot(slotIdx);
      }
    }
  };

  // Overlay drop handlers (dragging outside inventory window to drop into the world)
  const handleOverlayDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOutside(true);
  };

  const handleOverlayDragLeave = (e: React.DragEvent) => {
    if (e.target === e.currentTarget) {
      setIsDraggingOutside(false);
    }
  };

  const handleOverlayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOutside(false);
    setDraggingSlotIndex(null);

    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      const slotIdx = parseInt(data, 10);
      if (!isNaN(slotIdx)) {
        onDropSlotToWorld(slotIdx);
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (cursorItem) {
        // Drop held cursor item directly into the world
        onDropCursorItemToWorld();
      } else {
        onClose();
      }
    }
  };

  return (
    <div
      id="inventory-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md select-none animate-in fade-in duration-150 p-2 sm:p-4"
      onClick={handleOverlayClick}
      onDragOver={handleOverlayDragOver}
      onDragLeave={handleOverlayDragLeave}
      onDrop={handleOverlayDrop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Floating Guidance Banner when dragging outside */}
      {isDraggingOutside && (
        <div
          id="drop-world-indicator"
          className="fixed top-8 left-1/2 -translate-x-1/2 pointer-events-none z-[60] bg-sky-950/95 border-2 border-sky-400 px-5 py-2.5 rounded-full text-sky-200 text-xs font-bold shadow-[0_0_25px_rgba(56,189,248,0.5)] flex items-center gap-2 animate-bounce"
        >
          <span className="text-base">🌍</span>
          <span>Solte aqui para dropar o item no chão do mundo</span>
        </div>
      )}

      {/* Main Integrated Inventory & Crafting Window */}
      <div
        id="inventory-window"
        className={`relative bg-zinc-900/95 border-2 border-zinc-700 rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-zinc-100 p-4 sm:p-5 flex flex-col gap-3.5 overflow-hidden transition-all duration-300 max-h-[95vh] ${
          isCraftingAttached ? 'w-full max-w-5xl' : 'w-full max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOutside(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOutside(false);
          setDraggingSlotIndex(null);
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
              <Backpack className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-white drop-shadow-sm flex items-center gap-2">
                <span>Inventário & Bancada</span>
                {isCraftingAttached && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Hammer className="w-3 h-3" />
                    Criação Integrada
                  </span>
                )}
              </h2>
              <span className="text-[11px] text-zinc-400">
                Gerencie seus itens e crie novos recursos na mesma bancada
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Crafting Wing Button (Always accessible directly in header) */}
            <button
              id="btn-toggle-integrated-crafting"
              onClick={() => {
                soundManager.playInventoryClick();
                setIsCraftingAttached((v) => !v);
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 ${
                isCraftingAttached
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-zinc-300'
              }`}
              title={
                isCraftingAttached
                  ? 'Recolher Bancada de Criação'
                  : 'Expandir Bancada de Criação'
              }
            >
              <Hammer className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCraftingAttached ? 'Bancada Ativa' : 'Abrir Bancada'}</span>
            </button>

            {/* Auto-Sort Button */}
            <button
              id="btn-sort-inventory"
              onClick={() => {
                soundManager.playInventorySort();
                onSortInventory();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Organizar e agrupar todos os itens automaticamente"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Organizar</span>
            </button>

            {/* Close Button */}
            <button
              id="btn-close-inventory"
              onClick={() => {
                if (cursorItem) onClearCursorItem();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-700 border border-zinc-700 text-zinc-400 transition-colors cursor-pointer"
              title="Fechar Inventário [E / Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher (Visible on small screens when crafting is attached) */}
        {isCraftingAttached && (
          <div className="flex sm:hidden items-center bg-zinc-950/80 p-1 rounded-lg border border-zinc-800 gap-1">
            <button
              onClick={() => setMobileTab('inventory')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
                mobileTab === 'inventory'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Backpack className="w-3.5 h-3.5" />
              <span>Inventário</span>
            </button>
            <button
              onClick={() => setMobileTab('crafting')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
                mobileTab === 'crafting'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Criação</span>
            </button>
          </div>
        )}

        {/* Unified Workstation Body: Side-by-Side Integrated Layout */}
        <div className="flex flex-col lg:flex-row gap-4 overflow-y-auto custom-scrollbar flex-1">
          {/* LEFT WING: Inventory Slots, Player Stats, Trash Zone */}
          <div
            className={`flex-1 flex flex-col gap-3.5 min-w-0 ${
              isCraftingAttached && mobileTab === 'crafting' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Player Stats & Trash Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
              {/* Player Info */}
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                  <span>🧑‍🌾</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-200">Explorador</span>
                  <span className="text-[10px] text-emerald-400 truncate">
                    Bioma: {biomeName}
                  </span>
                </div>
              </div>

              {/* Status Bars */}
              <div className="flex flex-col justify-center gap-1">
                {/* Health Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Vida</span>
                  <span className="text-rose-400 font-bold">100 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-full" />
                </div>

                {/* Energy Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Energia</span>
                  <span className="text-emerald-400 font-bold">100 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>

              {/* Trash Bin Zone */}
              <div className="flex items-center justify-end">
                <div
                  id="inventory-trash-slot"
                  onClick={handleTrashClick}
                  onDragOver={handleTrashDragOver}
                  onDragLeave={handleTrashDragLeave}
                  onDrop={handleTrashDrop}
                  onMouseEnter={() => setTrashHovered(true)}
                  onMouseLeave={() => setTrashHovered(false)}
                  className={`w-full h-11 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isTrashDragOver || (trashHovered && cursorItem)
                      ? 'border-rose-500 bg-rose-950/60 text-rose-300 scale-102 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'border-dashed border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                  title="Lixeira: Arraste itens ou clique com item no cursor para descartar"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">
                    {isTrashDragOver
                      ? 'Solte para destruir'
                      : cursorItem
                      ? 'Descartar item'
                      : 'Lixeira'}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Inventory Grid (3 rows x 9 columns = 27 slots) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 px-1">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-amber-400" />
                  <span>MOCHILA PRINCIPAL</span>
                  <span className="text-[10px] font-normal text-zinc-400">(27 Espaços)</span>
                </span>
                <span className="text-[10px] text-zinc-500">
                  Shift+Clique transfere | Botão Dir. divide
                </span>
              </div>

              <div
                id="main-inventory-grid"
                className="grid grid-cols-9 gap-1.5 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 shadow-inner"
              >
                {Array.from({ length: MAIN_INVENTORY_SLOTS_COUNT }).map((_, i) => {
                  const slotIndex = HOTBAR_SLOTS_COUNT + i;
                  const slotItem = slots[slotIndex] ?? null;

                  return (
                    <ItemSlot
                      key={`main-slot-${slotIndex}`}
                      index={slotIndex}
                      item={slotItem}
                      cursorItem={cursorItem}
                      onSlotClick={onSlotClick}
                      onDropItem={onDropItemToSlot}
                      onDragStartItem={(idx) => setDraggingSlotIndex(idx)}
                      onDragEndItem={() => {
                        setDraggingSlotIndex(null);
                        setIsDraggingOutside(false);
                        setIsTrashDragOver(false);
                      }}
                      size="normal"
                      showHotbarKey={false}
                    />
                  );
                })}
              </div>
            </div>

            {/* Hotbar Grid (1 row x 9 columns = 9 slots) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400/90 px-1">
                <span className="flex items-center gap-1.5">
                  <span>BARRA RÁPIDA (HOTBAR)</span>
                  <span className="text-[10px] font-normal text-zinc-400">[Teclas 1 a 9]</span>
                </span>
              </div>

              <div
                id="modal-hotbar-grid"
                className="grid grid-cols-9 gap-1.5 bg-zinc-950/80 p-2.5 rounded-xl border-2 border-amber-500/30 shadow-inner"
              >
                {slots.slice(0, HOTBAR_SLOTS_COUNT).map((slotItem, idx) => (
                  <ItemSlot
                    key={`hotbar-slot-modal-${idx}`}
                    index={idx}
                    item={slotItem}
                    hotbarKey={idx + 1}
                    cursorItem={cursorItem}
                    onSlotClick={onSlotClick}
                    onDropItem={onDropItemToSlot}
                    onDragStartItem={(slotIdx) => setDraggingSlotIndex(slotIdx)}
                    onDragEndItem={() => {
                      setDraggingSlotIndex(null);
                      setIsDraggingOutside(false);
                      setIsTrashDragOver(false);
                    }}
                    size="normal"
                    showHotbarKey={true}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT WING: Fixed Integrated Crafting Station */}
          {isCraftingAttached && (
            <div
              className={`w-full lg:w-96 flex-shrink-0 flex flex-col ${
                mobileTab === 'inventory' ? 'hidden sm:flex' : 'flex'
              }`}
            >
              <IntegratedCraftingSection
                slots={slots}
                onCraft={onCraft ?? (() => {})}
                maxHeight="max-h-[460px]"
              />
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              <strong className="text-zinc-300">Dica:</strong> Arraste itens para fora da janela
              para jogá-los no mundo.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-zinc-400">
            [E] ou [C] para fechar
          </span>
        </div>

        {/* Split Stack Modal Popover */}
        {splittingSlotIndex !== null && slotToSplit && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-5 w-80 shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-amber-400" />
                  Dividir Stack
                </span>
                <button
                  onClick={() => setSplittingSlotIndex(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>{getItemDef(slotToSplit.type).nome || getItemDef(slotToSplit.type).name}</span>
                <span className="font-mono font-bold text-amber-400">
                  {splitAmount} de {slotToSplit.count}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1"
                max={slotToSplit.count - 1}
                value={splitAmount}
                onChange={(e) => setSplitAmount(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSplitAmount(Math.floor(slotToSplit.count / 2))}
                  className="flex-1 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  Metade (50%)
                </button>
                <button
                  onClick={handleConfirmSplit}
                  className="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Cursor Item with Dynamic ItemVisualRenderer */}
      {cursorItem && (
        <div
          className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 select-none"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          <div className="w-12 h-12 rounded-[8px] bg-zinc-900/90 border-2 border-amber-400 flex items-center justify-center text-xl shadow-[0_8px_20px_rgba(0,0,0,0.6)] animate-pulse">
            <ItemVisualRenderer itemDef={getItemDef(cursorItem.item.type)} size="md" />
            {cursorItem.item.count > 1 && (
              <span
                className="absolute bottom-0.5 right-1 font-mono font-black text-[11px] text-white tracking-tighter"
                style={{
                  textShadow:
                    '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
                }}
              >
                {cursorItem.item.count}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
