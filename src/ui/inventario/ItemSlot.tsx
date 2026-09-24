import React, { useState } from 'react';
import { CursorItem, ItemStack } from '../../core/configuracao/types';
import { getItemDef } from '../../gameplay/inventario/items/ItemDefinitions';
import { ItemVisualRenderer } from '../itens/ItemVisualRenderer';
import { ItemTooltip } from './ItemTooltip';

interface ItemSlotProps {
  index: number;
  item: ItemStack | null;
  isSelected?: boolean;
  hotbarKey?: number;
  cursorItem?: CursorItem | null;
  allowManagement?: boolean;
  onSelect?: () => void;
  onUseItem?: () => void;
  onSlotClick?: (index: number, isRightClick: boolean, isShiftClick: boolean) => void;
  onSlotHover?: (index: number | null) => void;
  onDragStartItem?: (index: number, e: React.DragEvent) => void;
  onDragEndItem?: (index: number, e: React.DragEvent) => void;
  onDropItem?: (index: number, e: React.DragEvent) => void;
  onDragOverSlot?: (index: number, e: React.DragEvent) => void;
  size?: 'normal' | 'large' | 'compact';
  showHotbarKey?: boolean;
}

export const ItemSlot: React.FC<ItemSlotProps> = ({
  index,
  item,
  isSelected = false,
  hotbarKey,
  cursorItem,
  allowManagement = true,
  onSelect,
  onUseItem,
  onSlotClick,
  onSlotHover,
  onDragStartItem,
  onDragEndItem,
  onDropItem,
  onDragOverSlot,
  size = 'normal',
  showHotbarKey = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragTarget, setIsDragTarget] = useState(false);
  const [isSelfDragging, setIsSelfDragging] = useState(false);

  const def = item ? getItemDef(item.type) : null;

  // Sizing styles
  const sizeClasses = {
    compact: 'w-10 h-10 md:w-11 md:h-11 text-lg',
    normal: 'w-12 h-12 md:w-13 md:h-13 text-xl',
    large: 'w-14 h-14 md:w-16 md:h-16 text-2xl',
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!allowManagement) {
      if (onSelect) {
        onSelect();
      }
      return;
    }
    if (onSlotClick) {
      onSlotClick(index, e.button === 2, e.shiftKey);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!allowManagement) {
      if (onSelect) {
        onSelect();
      }
      if (onUseItem) {
        onUseItem();
      }
      return;
    }
    if (onSlotClick) {
      onSlotClick(index, true, e.shiftKey);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!allowManagement || !item) {
      e.preventDefault();
      return;
    }
    setIsSelfDragging(true);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.setData('application/json', JSON.stringify({ slotIndex: index, item }));
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStartItem) {
      onDragStartItem(index, e);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsSelfDragging(false);
    if (!allowManagement) return;
    if (onDragEndItem) {
      onDragEndItem(index, e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!allowManagement) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    setIsDragTarget(true);
    if (onDragOverSlot) {
      onDragOverSlot(index, e);
    }
  };

  const handleDragLeave = () => {
    setIsDragTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragTarget(false);
    setIsSelfDragging(false);
    if (!allowManagement) {
      return;
    }
    if (onDropItem) {
      onDropItem(index, e);
    }
  };

  return (
    <div
      className="relative group select-none"
      onMouseEnter={() => {
        setIsHovered(true);
        if (onSlotHover) onSlotHover(index);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (onSlotHover) onSlotHover(null);
      }}
    >
      <div
        id={`inventory-slot-${index}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={allowManagement ? !!item : false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          ${sizeClasses}
          relative rounded-[8px] flex items-center justify-center cursor-pointer transition-all duration-100
          border-2
          ${
            isSelfDragging
              ? 'opacity-30 border-dashed border-amber-400/80 scale-95'
              : isSelected
              ? 'bg-zinc-800/90 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-105 z-10 ring-2 ring-amber-400/40'
              : isDragTarget
              ? 'bg-emerald-950/80 border-emerald-400 scale-105 ring-2 ring-emerald-500/50'
              : 'bg-zinc-900/85 border-zinc-700/80 hover:border-zinc-500 hover:bg-zinc-800/90'
          }
          shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]
        `}
      >
        {/* Hotbar Key Indicator (1..9) */}
        {showHotbarKey && hotbarKey !== undefined && (
          <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-zinc-500 select-none pointer-events-none">
            {hotbarKey}
          </span>
        )}

        {/* Item Content */}
        {item && def && (
          <div className="flex items-center justify-center w-full h-full relative pointer-events-none">
            <ItemVisualRenderer
              itemDef={def}
              size={size === 'large' ? 'lg' : size === 'compact' ? 'sm' : 'md'}
              className="group-hover:scale-110"
            />

            {/* Stack Count Badge */}
            {item.count > 1 && (
              <span
                id={`slot-count-${index}`}
                className="absolute bottom-0.5 right-1 font-mono font-black text-[11px] leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] tracking-tighter"
                style={{
                  textShadow: '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
                }}
              >
                {item.count}
              </span>
            )}
          </div>
        )}

        {/* Highlight ring when cursor has an item compatible with this slot (management only) */}
        {allowManagement && cursorItem && !item && isHovered && (
          <div className="absolute inset-0 rounded-[6px] border border-dashed border-emerald-400/80 bg-emerald-500/10 pointer-events-none" />
        )}
        {allowManagement && cursorItem && item && cursorItem.item.type === item.type && isHovered && (
          <div className="absolute inset-0 rounded-[6px] border border-amber-400/80 bg-amber-500/10 pointer-events-none" />
        )}
      </div>

      {/* Tooltip on Hover */}
      {isHovered && item && (!cursorItem || !allowManagement) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none bg-zinc-950/95 backdrop-blur-md rounded-lg shadow-2xl border border-zinc-700/80 min-w-[180px] animate-in fade-in zoom-in-95 duration-100">
          <ItemTooltip item={item} showShortcuts={allowManagement} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950" />
        </div>
      )}
    </div>
  );
};
