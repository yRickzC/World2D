import React, { useState, useRef, useEffect } from 'react';
import {
  Code,
  FileImage,
  ImageIcon,
  Palette,
  Smile,
  Sparkles,
  Upload,
  X,
  Check,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { TileRenderer } from '../../../gameplay/mundo/renderizacao/TileRenderer';
import { BlockTextureDefinition } from '../../../gameplay/BlockSystem/types';

export interface TextureConfig {
  mode: 'color' | 'image' | 'icon' | 'svg';
  primaryColor?: string;
  secondaryColor?: string;
  pattern?: string;
  imageData?: string;
  emoji?: string;
  emojiSize?: number;
  hasBackground?: boolean;
  backgroundColor?: string | null;
  background?: { color: string } | null;
  svgCode?: string;
}

export interface TextureDialogProps {
  currentConfig: TextureConfig;
  onApply: (config: TextureConfig) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = ['🧱', '🪨', '🪵', '🌿', '🌱', '🌾', '💧', '🔥', '💎', '🪙', '📦', '🚪', '🪜', '⚙️', '✨', '💀'];

export const TextureDialog: React.FC<TextureDialogProps> = ({
  currentConfig,
  onApply,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'icon' | 'color' | 'image' | 'svg'>(
    currentConfig.mode || 'icon'
  );

  const [hasBackground, setHasBackground] = useState<boolean>(
    currentConfig.hasBackground ??
      (currentConfig.mode === 'color' ? true : !!currentConfig.backgroundColor)
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    currentConfig.backgroundColor || '#64748b'
  );
  const [primaryColor, setPrimaryColor] = useState(currentConfig.primaryColor || '#64748b');
  const [secondaryColor, setSecondaryColor] = useState(currentConfig.secondaryColor || '#334155');
  const [pattern, setPattern] = useState(currentConfig.pattern || 'solid');
  const [imageData, setImageData] = useState(currentConfig.imageData || '');
  const [emoji, setEmoji] = useState(currentConfig.emoji || '🧱');
  const [emojiSize, setEmojiSize] = useState<number>(currentConfig.emojiSize ?? 1.0);
  const [svgCode, setSvgCode] = useState(
    currentConfig.svgCode ||
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#475569"/>
  <rect x="4" y="4" width="24" height="24" fill="#64748b"/>
  <circle cx="16" cy="16" r="6" fill="#94a3b8"/>
</svg>`
  );

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw preview using real TileRenderer with checkerboard for transparency
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Checkerboard background for transparency feedback
    const checkSize = 8;
    for (let cy = 0; cy < canvas.height; cy += checkSize) {
      for (let cx = 0; cx < canvas.width; cx += checkSize) {
        ctx.fillStyle = ((cx / checkSize + cy / checkSize) % 2 === 0) ? '#27272a' : '#18181b';
        ctx.fillRect(cx, cy, checkSize, checkSize);
      }
    }

    const finalBgColor = activeTab === 'icon'
      ? (hasBackground ? backgroundColor : null)
      : (primaryColor || '#64748b');

    const textureDef: BlockTextureDefinition = {
      type: activeTab === 'icon' ? 'emoji' : activeTab,
      backgroundColor: finalBgColor,
      background: finalBgColor ? { color: finalBgColor } : null,
      secondaryColor: secondaryColor,
      pattern: pattern,
      value: emoji,
      size: emojiSize,
      imageSrc: imageData,
      svgContent: svgCode,
    };

    // Render using identical game engine TileRenderer
    TileRenderer.renderBlock(ctx, 16, 16, 48, { texture: textureDef });

    // Subtle tile boundary outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(15.5, 15.5, 49, 49);
  }, [activeTab, hasBackground, backgroundColor, primaryColor, secondaryColor, pattern, emoji, emojiSize, imageData, svgCode]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImageData(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    const isIcon = activeTab === 'icon';
    const finalBg = isIcon ? (hasBackground ? backgroundColor : null) : primaryColor;
    onApply({
      mode: activeTab,
      hasBackground: isIcon ? hasBackground : true,
      backgroundColor: finalBg,
      background: finalBg ? { color: finalBg } : null,
      primaryColor: finalBg || undefined,
      secondaryColor,
      pattern,
      imageData,
      emoji,
      emojiSize,
      svgCode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="h-12 bg-zinc-850 border-b border-zinc-750 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold tracking-wide text-white uppercase">Block Texture</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-750 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Block Preview Banner */}
        <div className="p-3 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-xl border border-zinc-750 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
              <canvas
                ref={previewCanvasRef}
                width={80}
                height={80}
                className="w-20 h-20 [image-rendering:pixelated]"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wide">
                Pré-visualização do Bloco (Engine Real)
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {activeTab === 'icon' && !hasBackground
                  ? 'Fundo transparente: o emoji aparecerá sobre o chão ou bloco abaixo.'
                  : 'Renderizado exatamente como no mundo real do gameplay.'}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-amber-400">
                <span>Modo: {activeTab.toUpperCase()}</span>
                {activeTab === 'icon' && (
                  <>
                    <span>| Escala: {Math.round(emojiSize * 100)}%</span>
                    <span>| Fundo: {hasBackground ? 'Cor' : 'Transparente'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Texture Mode Tabs */}
        <div className="flex border-b border-zinc-850 bg-zinc-950/40 p-2 gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('icon')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'icon'
                ? 'bg-amber-500/10 border border-amber-400 text-amber-300'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emoji / Ícone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('color')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'color'
                ? 'bg-amber-500/10 border border-amber-400 text-amber-300'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Cor / Padrão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'image'
                ? 'bg-amber-500/10 border border-amber-400 text-amber-300'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Imagem</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('svg')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'svg'
                ? 'bg-amber-500/10 border border-amber-400 text-amber-300'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Código SVG</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* 1. Icon / Emoji Mode */}
          {activeTab === 'icon' && (
            <div className="space-y-4">
              {/* Emoji Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Emoji / Caractere do Bloco
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={emoji}
                    maxLength={4}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-14 h-14 text-center text-3xl bg-zinc-850 border border-zinc-700 rounded-xl focus:outline-none focus:border-amber-400 shadow-inner text-white"
                  />
                  <div className="flex-1 text-xs text-zinc-400">
                    Digite ou cole um emoji personalizado, ou selecione da grade rápida abaixo.
                  </div>
                </div>
              </div>

              {/* Quick Emojis Grid */}
              <div className="grid grid-cols-8 gap-1.5 p-2 bg-zinc-950/60 rounded-xl border border-zinc-800">
                {COMMON_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`h-9 text-lg rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      emoji === e
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                        : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Emoji Size Slider */}
              <div className="p-3 bg-zinc-850/60 border border-zinc-750 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Tamanho do Emoji no Tile
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {Math.round(emojiSize * 100)}%
                    <span className="text-zinc-500 font-normal ml-1">
                      ({emojiSize <= 0.35 ? 'pequeno' : emojiSize <= 0.6 ? 'médio' : emojiSize <= 0.85 ? 'grande' : 'total'})
                    </span>
                  </span>
                </div>

                <input
                  type="range"
                  min="0.20"
                  max="1.00"
                  step="0.05"
                  value={emojiSize}
                  onChange={(e) => setEmojiSize(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />

                <div className="flex justify-between gap-1 pt-1">
                  {[
                    { label: 'Pequeno', val: 0.25 },
                    { label: 'Médio', val: 0.5 },
                    { label: 'Padrão', val: 0.55 },
                    { label: 'Grande', val: 0.75 },
                    { label: 'Total', val: 1.0 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setEmojiSize(preset.val)}
                      className={`text-[10px] font-mono py-1 px-2 rounded border transition-colors cursor-pointer ${
                        Math.abs(emojiSize - preset.val) < 0.03
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Configurable Background (Transparent by default or Color) */}
              <div className="p-3 bg-zinc-850/60 border border-zinc-750 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-300">
                    Fundo do Bloco (Opcional)
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {hasBackground ? 'Cor Sólida' : 'Transparente'}
                  </span>
                </div>

                {/* Explicit selection buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHasBackground(false)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !hasBackground
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-zinc-900 border-zinc-750 text-zinc-400 hover:text-white hover:border-zinc-600'
                    }`}
                  >
                    {!hasBackground && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Sem Fundo / Transparente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasBackground(true)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      hasBackground
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-zinc-900 border-zinc-750 text-zinc-400 hover:text-white hover:border-zinc-600'
                    }`}
                  >
                    {hasBackground && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    <span>Cor</span>
                  </button>
                </div>

                {/* If Cor is chosen, show single background color picker */}
                {hasBackground ? (
                  <div className="pt-1 space-y-1.5 animate-in fade-in duration-100">
                    <span className="block text-[11px] text-zinc-400">Cor de Fundo da Superfície</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-9 h-9 rounded-lg bg-transparent cursor-pointer border border-zinc-700"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-white"
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 pt-0.5">
                    O Emoji aparecerá sozinho. O chão, blocos ou fundo atrás do tile serão visíveis através das áreas transparentes.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. Color / Pattern Mode */}
          {activeTab === 'color' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-xl bg-transparent cursor-pointer border border-zinc-700"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-zinc-850 border border-zinc-700 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-9 h-9 rounded-xl bg-transparent cursor-pointer border border-zinc-700"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-zinc-850 border border-zinc-700 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Padrão da Textura</label>
                <div className="grid grid-cols-4 gap-2">
                  {['solid', 'checker', 'brick', 'speckle'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPattern(p)}
                      className={`p-2.5 rounded-xl border text-xs font-mono capitalize transition-all cursor-pointer ${
                        pattern === p
                          ? 'bg-amber-500/10 border-amber-400 text-amber-300 font-bold'
                          : 'bg-zinc-850/70 border-zinc-750 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Image Mode */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-zinc-700 hover:border-amber-400/80 bg-zinc-850/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />

                {imageData ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={imageData}
                      alt="Preview"
                      className="w-20 h-20 object-contain rounded-xl border border-zinc-700 shadow-md mb-2 bg-zinc-950 [image-rendering:pixelated]"
                    />
                    <span className="text-xs text-amber-400 font-medium">Clique para trocar a imagem</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-xs font-bold text-white mb-0.5">Arraste uma imagem de textura</span>
                    <span className="text-[11px] text-zinc-400">PNG, JPG ou WEBP (pixel art)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. SVG Code Mode */}
          {activeTab === 'svg' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Código SVG Vetorial</label>
                <span className="text-[10px] font-mono text-zinc-500">Renderização ao vivo</span>
              </div>

              <textarea
                rows={5}
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 font-mono text-xs text-amber-300 border border-zinc-750 rounded-xl focus:outline-none focus:border-amber-400 leading-tight"
                placeholder="<svg ...>...</svg>"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-zinc-850 border-t border-zinc-750 px-4 flex items-center justify-end gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            className="text-xs px-4"
          >
            Aplicar Textura
          </Button>
        </div>
      </div>
    </div>
  );
};
