import {
  BreakComponent,
  ColorVisualComponent,
  ConsumableComponent,
  DescriptionComponent as LegacyDescriptionComponent,
  EmojiVisualComponent,
  ImageVisualComponent,
  StackComponent as LegacyStackComponent,
} from '../../../gameplay/itens/componentes';
import { ItemDefinition as LegacyItemDefinition } from '../../../gameplay/itens/ItemDefinition';
import { ItemDefinitionJSON } from '../../../gameplay/ItemSystem/types';

/**
 * Creates a runtime ItemDefinition compatible with both the core ItemSystem and UI renderers
 * directly from the editor's JSON state.
 * Strictly separates VisualComponent (asset source) and RenderComponent (interface rendering).
 */
export const createPreviewItemDef = (json: ItemDefinitionJSON): LegacyItemDefinition => {
  const components: any[] = [];

  let visualSourceEmoji: string | null = null;
  let visualSvgSource: string | null = null;
  let visualAccentColor: string = '#38bdf8';
  let isLevelItem = false;
  let customWeight: number | null = null;

  for (const comp of json.components) {
    const type = comp.type;
    const data = comp.data || {};

    // 1. VisualComponent (Asset Definition: Emoji or SVG)
    if (type === 'VisualComponent') {
      if (data.visualType === 'Emoji' || !data.visualType) {
        visualSourceEmoji = data.source || '⚔️';
      } else if (data.visualType === 'SVG') {
        visualSvgSource = data.source || '';
      }
      if (data.accentColor) {
        visualAccentColor = data.accentColor;
      }
    }

    // 2. RenderComponent (Rendering behavior)
    if (type === 'RenderComponent' || type === 'render') {
      if (data.imageUrl) {
        components.push(
          new ImageVisualComponent({
            src: data.imageUrl,
            alt: json.nome,
          })
        );
      } else if (data.renderer === 'label') {
        components.push(
          new ColorVisualComponent({
            color: visualAccentColor || '#38bdf8',
            shape: 'rounded',
            accentColor: visualAccentColor || '#38bdf8',
            label: (json.nome || 'ITM').slice(0, 3).toUpperCase(),
          })
        );
      }
    }

    // 3. IdentityComponent / Description
    if (type === 'IdentityComponent' || type === 'description') {
      components.push(
        new LegacyDescriptionComponent({
          text: data.description || data.text || '',
          categoryName: json.categoria,
          lore: data.lore,
        })
      );
    }

    // 4. ToolComponent
    if (type === 'ToolComponent' || type === 'tool') {
      components.push(
        new BreakComponent({
          toolTag: data.toolType || 'pickaxe',
          strength: Number(data.miningLevel ?? data.strength) || 2,
          damage: Number(data.damage) || 1,
          speed: Number(data.harvestSpeed ?? data.speed) || 1.2,
        })
      );
    }

    // 5. WeaponComponent
    if (type === 'WeaponComponent' || type === 'weapon') {
      components.push(
        new BreakComponent({
          toolTag: 'weapon',
          strength: 1,
          damage: Number(data.attackDamage) || 5,
          speed: Number(data.attackSpeed) || 1.0,
        })
      );
    }

    // 6. ConsumableComponent
    if (type === 'ConsumableComponent' || type === 'food' || type === 'consumable') {
      components.push(
        new ConsumableComponent({
          energyRestored: Number(data.restoreAmount ?? data.energyRestored) || 20,
          prompt: data.prompt || 'Consumir',
        })
      );
    }

    // 7. StackComponent
    if (type === 'StackComponent' || type === 'stack') {
      if (data.weight !== undefined) {
        customWeight = Number(data.weight);
      } else if (data.maxStack !== undefined) {
        customWeight = 64 / Number(data.maxStack);
      }
    }

    // 8. LevelComponent
    if (type === 'LevelComponent' || type === 'level') {
      isLevelItem = true;
    }
  }

  // Handle Visual rendering
  const hasVisualComponentAlready = components.some(
    (c) => c instanceof ColorVisualComponent || c instanceof ImageVisualComponent || c instanceof EmojiVisualComponent
  );

  if (!hasVisualComponentAlready) {
    if (visualSvgSource) {
      if (visualSvgSource.trim().startsWith('<svg') || visualSvgSource.trim().startsWith('data:')) {
        components.push(
          new ImageVisualComponent({
            src: visualSvgSource.trim().startsWith('<svg')
              ? `data:image/svg+xml;utf8,${encodeURIComponent(visualSvgSource)}`
              : visualSvgSource,
            alt: json.nome,
          })
        );
      } else {
        components.push(
          new ImageVisualComponent({
            src: visualSvgSource,
            alt: json.nome,
          })
        );
      }
    } else if (visualSourceEmoji) {
      components.push(
        new EmojiVisualComponent({
          emoji: visualSourceEmoji,
          accentColor: visualAccentColor,
        })
      );
    } else {
      const categoryEmojis: Record<string, string> = {
        weapons: '⚔️',
        weapon: '⚔️',
        tools: '⛏️',
        tool: '⛏️',
        armor: '🛡️',
        accessories: '💍',
        consumables: '🍎',
        food: '🍎',
        backpacks: '🎒',
        material: '🪵',
        nature: '🌿',
        block: '🧱',
        utility: '🔧',
      };
      components.push(
        new EmojiVisualComponent({
          emoji: categoryEmojis[json.categoria] || '📦',
          accentColor: visualAccentColor,
        })
      );
    }
  }

  // Handle Stack calculation
  if (!isLevelItem) {
    const weight = customWeight ?? 1.0;
    const computedMaxStack = Math.max(1, Math.floor(64 / Math.max(0.1, weight)));
    components.push(
      new LegacyStackComponent({
        maxStack: computedMaxStack,
      })
    );
  } else {
    // Levelable items are strictly non-stackable
    components.push(
      new LegacyStackComponent({
        maxStack: 1,
      })
    );
  }

  return new LegacyItemDefinition({
    id: json.id || 'novo_item',
    nome: json.nome || 'Novo Item',
    categoria: (json.categoria as any) || 'weapons',
    components,
  });
};
