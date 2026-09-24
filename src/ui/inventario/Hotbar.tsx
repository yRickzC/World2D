import React, { useEffect, useState } from 'react';
import { Backpack, Sparkles } from 'lucide-react';
import { CursorItem, ItemStack } from '../../core/configuracao/types';
import { getItemDef } from '../../gameplay/inventario/items/ItemDefinitions';
import { HOTBAR_SLOTS_COUNT } from '../../gameplay/inventario/slots/InventorySlots';
import { ItemSlot } from './ItemSlot';

interface HotbarProps {
  slots: (ItemStack | null)[];
  selectedSlotIndex: number;
  onSelectSlot: (index: number) => void;
  onOpenInventory: () => void;
  isInventoryOpen: boolean;
  cursorItem: CursorItem | null;
  onSlotClick?: (index: number, isRightClick: boolean, isShiftClick: boolean) => void;
  onDropItem?: (index: number, e: React.DragEvent) => void;
  onUseHeldItem?: () => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
  slots,
  selectedSlotIndex,
  onSelectSlot,
  onOpenInventory,
  isInventoryOpen,
  cursorItem,
  onSlotClick,
  onDropItem,
  onUseHeldItem,
}) => {
  const [fadingItemName, setFadingItemName] = useState<string | null>(null);

  // Selected item reference
  const activeItem = slots[selectedSlotIndex];
  const activeDef = activeItem ? getItemDef(activeItem.type) : null;

  // Show fading item name on slot change (Minecraft-style item title pop)
  useEffect(() => {
    if (activeItem && activeDef) {
      setFadingItemName(`${activeDef.name} (${activeItem.count})`);
      const timer = setTimeout(() => {
        setFadingItemName(null);
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      setFadingItemName(null);
    }
  }, [selectedSlotIndex, activeItem?.id, activeItem?.count]);

  return (
    <div className="relative flex flex-col items-center pointer-events-none select-none">
      {/* Minecraft-style Fading Held Item Label */}
      <div className="h-7 mb-1 flex items-center justify-center pointer-events-none">
        {fadingItemName ? (
          <div className="px-3 py-1 rounded-md bg-black/75 backdrop-blur-sm border border-white/20 text-white font-bold text-xs shadow-lg tracking-wide animate-in fade-in zoom-in-95 duration-150">
            {fadingItemName}
          </div>
        ) : activeDef?.consumable && onUseHeldItem ? (
          <button
            onClick={onUseHeldItem}
            className="pointer-events-auto px-2.5 py-0.5 rounded-md bg-amber-500/90 hover:bg-amber-400 text-black font-bold text-[11px] shadow flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-3 h-3" />
            <span>Comer {activeDef.name} [Botão Direito]</span>
          </button>
        ) : null}
      </div>

      {/* Main Hotbar Dock Container */}
      <div className="flex items-center gap-2 pointer-events-auto bg-zinc-950/90 backdrop-blur-md p-2 rounded-[14px] shadow-[0_12px_35px_rgba(0,0,0,0.5)] border border-white/20">
        {/* Hotbar Slots (0..8) */}
        <div className="flex items-center gap-1.5">
          {slots.slice(0, HOTBAR_SLOTS_COUNT).map((slotItem, idx) => (
            <div
              key={`hotbar-slot-${idx}`}
              className="relative"
            >
              <ItemSlot
                index={idx}
                item={slotItem}
                isSelected={idx === selectedSlotIndex}
                hotbarKey={idx + 1}
                cursorItem={isInventoryOpen ? cursorItem : null}
                allowManagement={isInventoryOpen}
                onSelect={() => onSelectSlot(idx)}
                onUseItem={() => {
                  onSelectSlot(idx);
                  if (slotItem && getItemDef(slotItem.type).consumable && onUseHeldItem) {
                    onUseHeldItem();
                  }
                }}
                onSlotClick={isInventoryOpen ? onSlotClick : undefined}
                onDropItem={isInventoryOpen ? onDropItem : undefined}
                size="normal"
              />
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-zinc-700/80 mx-1" />

        {/* Open Inventory Button */}
        <button
          id="btn-open-inventory"
          onClick={onOpenInventory}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-[8px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 hover:text-white transition-all cursor-pointer shadow-inner active:scale-95 group"
          title="Abrir Inventário Completo [E]"
        >
          <Backpack className="w-5 h-5 group-hover:scale-110 transition-transform text-amber-400" />
          <span className="text-[9px] font-mono font-bold text-zinc-400 mt-0.5 group-hover:text-zinc-200">
            [E]
          </span>
        </button>
      </div>
    </div>
  );
};
