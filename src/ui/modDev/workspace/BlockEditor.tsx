import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  Code,
  Edit2,
  Eye,
  ImageIcon,
  Layers,
  Palette,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { BlockDefinitionJSON, BlockTextureDefinition } from '../../../gameplay/BlockSystem/types';
import { BlockComponentSchemaDefinition } from '../../../gameplay/BlockSystem/schemas/BlockSchemaRegistry';
import { TagSelectorDialog } from './TagSelectorDialog';
import { TextureDialog, TextureConfig } from './TextureDialog';
import { ModuleSelectorDialog } from './ModuleSelectorDialog';
import { ModuleEditorDialog } from './ModuleEditorDialog';
import { BlockPreview } from './BlockPreview';
import { TileRenderer } from '../../../gameplay/mundo/renderizacao/TileRenderer';

export interface BlockEditorProps {
  initialData: BlockDefinitionJSON;
  onSave: (updatedData: BlockDefinitionJSON) => void;
  isReadOnly?: boolean;
}

const BlockThumbnail: React.FC<{ texture?: BlockTextureDefinition; size?: number }> = ({
  texture,
  size = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle checkerboard pattern for transparency feedback
    const checkSize = 6;
    for (let cy = 0; cy < canvas.height; cy += checkSize) {
      for (let cx = 0; cx < canvas.width; cx += checkSize) {
        ctx.fillStyle = ((cx / checkSize + cy / checkSize) % 2 === 0) ? '#27272a' : '#18181b';
        ctx.fillRect(cx, cy, checkSize, checkSize);
      }
    }

    // Render using the REAL game engine TileRenderer (no 2.5D, no fake elevation)
    TileRenderer.renderBlock(ctx, 4, 4, size - 8, { texture });
  }, [texture, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl border border-zinc-700 bg-zinc-950 shadow-md [image-rendering:pixelated] flex-shrink-0"
    />
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialData,
  onSave,
  isReadOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [blockData, setBlockData] = useState<BlockDefinitionJSON>(initialData);
  const [isOutdatedPreview, setIsOutdatedPreview] = useState(false);

  // Dialog states
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isTextureDialogOpen, setIsTextureDialogOpen] = useState(false);
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);

  useEffect(() => {
    setBlockData(initialData);
  }, [initialData]);

  const updateBlock = (updater: (prev: BlockDefinitionJSON) => BlockDefinitionJSON) => {
    setBlockData((prev) => {
      const next = updater({ ...prev });
      setIsOutdatedPreview(true);
      onSave(next);
      return next;
    });
  };

  // ==========================================
  // Tags handling
  // ==========================================
  const handleRemoveTag = (tagToRemove: string) => {
    updateBlock((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove),
    }));
  };

  const handleAddTag = (newTag: string) => {
    updateBlock((prev) => {
      const current = prev.tags || [];
      if (current.includes(newTag)) return prev;
      return { ...prev, tags: [...current, newTag] };
    });
  };

  // ==========================================
  // Texture handling (Texture is top-level, NOT a component)
  // ==========================================
  const getTextureConfig = (): TextureConfig => {
    if (blockData.texture) {
      const bg = blockData.texture.background?.color ?? blockData.texture.backgroundColor;
      const hasBg = !!(bg && bg !== 'transparent' && bg !== 'none' && bg !== 'null');
      return {
        mode: blockData.texture.type === 'emoji' ? 'icon' : (blockData.texture.type as any) || 'icon',
        hasBackground: hasBg,
        backgroundColor: hasBg ? bg : null,
        background: hasBg ? { color: bg as string } : null,
        primaryColor: bg || '#64748b',
        secondaryColor: blockData.texture.secondaryColor || '#334155',
        pattern: blockData.texture.pattern || 'solid',
        emoji: blockData.texture.value || '🧱',
        emojiSize: blockData.texture.size ?? 1.0,
        imageData: blockData.texture.imageSrc,
        svgCode: blockData.texture.svgContent,
      };
    }

    const comps = blockData.components || [];
    const colorComp = comps.find((c) => c.type === 'ColorTextureComponent');
    const topComp = comps.find((c) => c.type === 'TopTextureComponent');
    const emojiComp = comps.find((c) => c.type === 'EmojiIconComponent');

    return {
      mode: emojiComp?.data?.emoji ? 'icon' : 'color',
      hasBackground: false,
      backgroundColor: null,
      background: null,
      primaryColor: topComp?.data?.primaryColor || colorComp?.data?.primaryColor || '#64748b',
      secondaryColor: colorComp?.data?.secondaryColor || '#334155',
      pattern: topComp?.data?.pattern || colorComp?.data?.pattern || 'solid',
      emoji: emojiComp?.data?.emoji || '🧱',
      emojiSize: 1.0,
    };
  };

  const handleApplyTexture = (config: TextureConfig) => {
    updateBlock((prev) => {
      // Clean legacy texture components from components list
      const cleanedComponents = (prev.components || []).filter(
        (c) =>
          c.type !== 'EmojiIconComponent' &&
          c.type !== 'ColorTextureComponent' &&
          c.type !== 'TopTextureComponent' &&
          c.type !== 'SideTextureComponent'
      );

      const isIcon = config.mode === 'icon';
      const texType: 'color' | 'emoji' | 'image' | 'svg' = isIcon
        ? 'emoji'
        : (config.mode as 'color' | 'image' | 'svg');
      const hasBg = isIcon ? (config.hasBackground ?? false) : true;
      const finalBg = hasBg ? (config.backgroundColor || config.primaryColor || '#64748b') : null;

      const newTexture: BlockTextureDefinition = {
        type: texType,
        backgroundColor: finalBg,
        background: finalBg ? { color: finalBg } : null,
        secondaryColor: config.secondaryColor || '#334155',
        pattern: config.pattern || 'solid',
        value: config.emoji || '🧱',
        size: config.emojiSize ?? 1.0,
        imageSrc: config.imageData,
        svgContent: config.svgCode,
      };

      return {
        ...prev,
        texture: newTexture,
        components: cleanedComponents,
      };
    });
  };

  // ==========================================
  // Components / Modules handling
  // ==========================================
  const handleAddModule = (schema: BlockComponentSchemaDefinition) => {
    const defaultData: Record<string, any> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (prop.default !== undefined) {
        defaultData[key] = prop.default;
      }
    }

    updateBlock((prev) => ({
      ...prev,
      components: [
        ...(prev.components || []),
        {
          id: `${schema.type.toLowerCase()}_${Date.now().toString(36)}`,
          type: schema.type,
          data: defaultData,
        },
      ],
    }));
  };

  const handleRemoveModule = (index: number) => {
    updateBlock((prev) => {
      const next = [...(prev.components || [])];
      next.splice(index, 1);
      return { ...prev, components: next };
    });
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    updateBlock((prev) => {
      const next = [...(prev.components || [])];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return { ...prev, components: next };
    });
  };

  const handleSaveModuleData = (index: number, updatedData: any) => {
    updateBlock((prev) => {
      const next = [...(prev.components || [])];
      if (next[index]) {
        next[index] = { ...next[index], data: updatedData };
      }
      return { ...prev, components: next };
    });
  };

  const textureConfig = getTextureConfig();

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Top Editor Sub-header / Tabs */}
      <div className="h-11 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-zinc-800 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-zinc-800 text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
            {isOutdatedPreview && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500">{blockData.id}</span>
        </div>
      </div>

      {/* Main Tab View */}
      {activeTab === 'editor' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
          {/* Section: Block Identity & Metadata */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Identificação do Bloco
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ID do Block (Namespace)
                </label>
                <input
                  type="text"
                  disabled
                  value={blockData.id}
                  className="w-full px-3 py-2 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400/90 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={blockData.name || ''}
                  onChange={(e) => updateBlock((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do Bloco"
                  className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Descrição</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={blockData.description || ''}
                onChange={(e) => updateBlock((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional do bloco e comportamento no mundo..."
                className="w-full px-3 py-2 bg-zinc-850 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Tags & Texture (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags Box */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Tags
                    </h3>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setIsTagDialogOpen(true)}
                      className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Adicionar Tag"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[48px]">
                  {(blockData.tags || []).length > 0 ? (
                    blockData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-300"
                      >
                        <span>#{tag}</span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Nenhuma tag atribuída.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Texture Box */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Texture / Visual
                    </h3>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setIsTextureDialogOpen(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {/* Clickable Texture Preview Area */}
                <div
                  onClick={() => !isReadOnly && setIsTextureDialogOpen(true)}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                    !isReadOnly
                      ? 'border-zinc-750 hover:border-amber-400/80 bg-zinc-850/60 cursor-pointer'
                      : 'border-zinc-800 bg-zinc-900/40'
                  }`}
                >
                  <BlockThumbnail
                    size={48}
                    texture={{
                      type: textureConfig.mode === 'icon' ? 'emoji' : (textureConfig.mode as any),
                      backgroundColor: textureConfig.primaryColor || '#64748b',
                      secondaryColor: textureConfig.secondaryColor || '#334155',
                      pattern: textureConfig.pattern || 'solid',
                      value: textureConfig.emoji || '🧱',
                      size: textureConfig.emojiSize ?? 0.55,
                      imageSrc: textureConfig.imageData,
                      svgContent: textureConfig.svgCode,
                    }}
                  />

                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white capitalize">
                      Modo: {textureConfig.mode === 'icon' ? 'Emoji / Ícone' : textureConfig.mode || 'Cor'}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-mono truncate">
                      {textureConfig.mode === 'icon'
                        ? `Ícone: ${textureConfig.emoji} • Escala: ${Math.round((textureConfig.emojiSize ?? 0.55) * 100)}%`
                        : `Cor: ${textureConfig.primaryColor} • Padrão: ${textureConfig.pattern}`}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Fundo sólido ativo (superfície preservada sob o ícone)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Components / Modules */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Components / Modules ({blockData.components?.length || 0})
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Módulos determinam a lógica de colisão, quebra, resistência, iluminação e física do bloco.
                </p>
              </div>

              {!isReadOnly && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModuleSelectorOpen(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs py-1.5"
                >
                  Adicionar Módulo
                </Button>
              )}
            </div>

            {/* Modules List */}
            <div className="space-y-2">
              {(blockData.components || []).length > 0 ? (
                blockData.components.map((comp, idx) => {
                  const summaryText = comp.data
                    ? Object.entries(comp.data)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')
                    : 'Sem propriedades configuradas';

                  return (
                    <div
                      key={comp.id || `${comp.type}_${idx}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-850/80 border border-zinc-750 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 flex-shrink-0">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{comp.type}</span>
                            <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                            {summaryText}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!isReadOnly && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveModule(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-750 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveModule(idx, 'down')}
                            disabled={idx === (blockData.components?.length || 0) - 1}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-750 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingModuleIndex(idx)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-750"
                            title="Editar Módulo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(idx)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-750"
                            title="Remover Módulo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  Nenhum módulo adicionado a este bloco. Clique em "Adicionar Módulo" para adicionar
                  colisão, resistência, luz, etc.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <BlockPreview
          blockData={blockData}
          isOutdated={isOutdatedPreview}
          onRegenerate={() => setIsOutdatedPreview(false)}
        />
      )}

      {/* Subdialogs */}
      {isTagDialogOpen && (
        <TagSelectorDialog
          currentTags={blockData.tags || []}
          onSelectTag={handleAddTag}
          onClose={() => setIsTagDialogOpen(false)}
        />
      )}

      {isTextureDialogOpen && (
        <TextureDialog
          currentConfig={textureConfig}
          onApply={handleApplyTexture}
          onClose={() => setIsTextureDialogOpen(false)}
        />
      )}

      {isModuleSelectorOpen && (
        <ModuleSelectorDialog
          currentComponents={blockData.components || []}
          onSelectModule={handleAddModule}
          onClose={() => setIsModuleSelectorOpen(false)}
        />
      )}

      {editingModuleIndex !== null && blockData.components?.[editingModuleIndex] && (
        <ModuleEditorDialog
          component={blockData.components[editingModuleIndex]}
          onSave={(updatedData) => handleSaveModuleData(editingModuleIndex, updatedData)}
          onClose={() => setEditingModuleIndex(null)}
        />
      )}
    </div>
  );
};
