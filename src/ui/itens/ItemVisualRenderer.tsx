import React from 'react';
import { ItemDefinition } from '../../gameplay/itens/ItemDefinition';
import { getItemDef } from '../../gameplay/inventario/items/ItemDefinitions';
import {
  ColorVisualComponent,
  EmojiVisualComponent,
  ImageVisualComponent,
  SvgVisualComponent,
} from '../../gameplay/itens/componentes';

interface ItemVisualRendererProps {
  itemDef?: ItemDefinition | null;
  itemType?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * ItemVisualRenderer:
 * Dynamic component-based renderer for items.
 * Inspects the item's attached visual component and renders the corresponding
 * representation: Emoji, Color/Shape, Image, SVG, or custom markup.
 */
export const ItemVisualRenderer: React.FC<ItemVisualRendererProps> = ({
  itemDef,
  itemType,
  size = 'md',
  className = '',
}) => {
  const def = itemDef ?? (itemType ? getItemDef(itemType) : null);

  if (!def) {
    return <span className={`select-none ${className}`}>📦</span>;
  }

  const visual = def.getVisual();

  // Size configuration
  const sizeMap = {
    xs: { text: 'text-xs', box: 'w-4 h-4', svg: 14 },
    sm: { text: 'text-sm', box: 'w-6 h-6', svg: 18 },
    md: { text: 'text-xl md:text-2xl', box: 'w-8 h-8', svg: 24 },
    lg: { text: 'text-3xl', box: 'w-10 h-10', svg: 30 },
    xl: { text: 'text-4xl', box: 'w-12 h-12', svg: 38 },
  }[size];

  // 1. SVG Component Rendering
  const svgComp = def.getComponent(SvgVisualComponent);
  if (svgComp) {
    if (svgComp.svgMarkup) {
      return (
        <div
          className={`flex items-center justify-center pointer-events-none ${className}`}
          dangerouslySetInnerHTML={{ __html: svgComp.svgMarkup }}
        />
      );
    }
    if (svgComp.svgPath) {
      return (
        <div className={`flex items-center justify-center pointer-events-none ${className}`}>
          <svg
            width={sizeMap.svg}
            height={sizeMap.svg}
            viewBox={svgComp.viewBox}
            fill={svgComp.fill}
            stroke={svgComp.stroke}
            strokeWidth={svgComp.strokeWidth}
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter transition-transform"
            style={{ color: svgComp.accentColor }}
          >
            <path d={svgComp.svgPath} />
          </svg>
        </div>
      );
    }
  }

  // 2. Image Component Rendering
  const imageComp = def.getComponent(ImageVisualComponent);
  if (imageComp) {
    return (
      <img
        src={imageComp.src}
        alt={imageComp.alt}
        className={`${sizeMap.box} object-contain select-none pointer-events-none drop-shadow-md ${
          imageComp.pixelated ? 'image-pixelated' : ''
        } ${className}`}
      />
    );
  }

  // 3. Color / Geometric Shape Component Rendering
  const colorComp = def.getComponent(ColorVisualComponent);
  if (colorComp) {
    const shapeRadius =
      colorComp.shape === 'circle'
        ? 'rounded-full'
        : colorComp.shape === 'rounded'
        ? 'rounded-md'
        : colorComp.shape === 'gem'
        ? 'rounded-sm rotate-45 scale-90'
        : 'rounded-none';

    return (
      <div
        className={`${sizeMap.box} flex items-center justify-center pointer-events-none relative shadow-md transition-transform ${shapeRadius} ${className}`}
        style={{
          backgroundColor: colorComp.color,
          border: `2px solid ${colorComp.borderColor}`,
          boxShadow: `0 2px 8px ${colorComp.accentColor}55`,
        }}
      >
        {colorComp.innerPattern === 'gloss' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40 rounded-[inherit]" />
        )}
        {colorComp.label && (
          <span className="text-[9px] font-mono font-bold text-white drop-shadow">
            {colorComp.label}
          </span>
        )}
      </div>
    );
  }

  // 4. Emoji Component Rendering (default rich visual)
  const emojiComp = def.getComponent(EmojiVisualComponent);
  const emojiGlyph = emojiComp ? emojiComp.emoji : def.iconEmoji;

  return (
    <span
      className={`${sizeMap.text} leading-none transform transition-transform select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter ${className}`}
      style={emojiComp?.scale && emojiComp.scale !== 1 ? { transform: `scale(${emojiComp.scale})` } : undefined}
    >
      {emojiGlyph}
    </span>
  );
};
