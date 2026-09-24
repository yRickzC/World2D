import React, { useState } from 'react';
import {
  Compass,
  Eye,
  EyeOff,
  Hammer,
  Home,
  Keyboard,
  MapPin,
  Moon,
  MousePointer,
  Pause,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GameSettings, Player, TileType } from '../../core/configuracao/types';
import { soundManager } from '../../sistemas/audio/SoundManager';
import { ItemEditor } from '../dev/editor/ItemEditor';
import { BlockEditor } from '../dev/editor/BlockEditor';
import { EntityEditor } from '../dev/editor/EntityEditor';

interface GameMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  groundTile: TileType;
  seed: number;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onNewSeed: () => void;
  onResetSpawn: () => void;
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
  initialTab?: MenuTab;
  initialAdminSection?: 'general' | 'item_creator' | 'block_creator' | 'entity_creator';
  onExitToMainMenu?: () => void;
}

type MenuTab = 'controls' | 'world' | 'admin';

export const GameMenuModal: React.FC<GameMenuModalProps> = ({
  isOpen,
  onClose,
  player,
  groundTile,
  seed,
  settings,
  onUpdateSettings,
  onNewSeed,
  onResetSpawn,
  showMiniMap,
  onToggleMiniMap,
  initialTab,
  initialAdminSection,
  onExitToMainMenu,
}) => {
  const [activeTab, setActiveTab] = useState<MenuTab>(initialTab ?? 'controls');
  const [adminSection, setAdminSection] = useState<
    'general' | 'item_creator' | 'block_creator' | 'entity_creator'
  >(initialAdminSection ?? 'general');

  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (initialAdminSection) setAdminSection(initialAdminSection);
    }
  }, [isOpen, initialTab, initialAdminSection]);

  if (!isOpen) return null;

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

  // Time format helper
  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getTimePhaseDetails = (hour: number) => {
    if (hour >= 4.5 && hour < 7.5) {
      return {
        name: 'Aurora (Amanhecer)',
        icon: <Sunrise className="w-4 h-4 text-amber-500" />,
        badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
      };
    } else if (hour >= 7.5 && hour < 17.0) {
      return {
        name: 'Dia Pleno',
        icon: <Sun className="w-4 h-4 text-yellow-500" />,
        badgeColor: 'bg-yellow-50 text-yellow-900 border-yellow-300',
      };
    } else if (hour >= 17.0 && hour < 20.5) {
      return {
        name: 'Ocaso (Entardecer)',
        icon: <Sunset className="w-4 h-4 text-orange-500" />,
        badgeColor: 'bg-orange-50 text-orange-900 border-orange-300',
      };
    } else {
      return {
        name: 'Noite Estrelada',
        icon: <Moon className="w-4 h-4 text-indigo-400" />,
        badgeColor: 'bg-slate-900 text-slate-100 border-slate-700',
      };
    }
  };

  const timePhase = getTimePhaseDetails(settings.timeHour);

  return (
    <div
      id="game-menu-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="game-menu-modal"
        className={`relative w-full bg-[#1e1e24] text-zinc-100 rounded-2xl shadow-2xl border border-zinc-700/80 overflow-hidden flex flex-col transition-all duration-150 ${
          activeTab === 'admin' && adminSection === 'item_creator'
            ? 'max-w-6xl h-[92vh]'
            : 'max-w-2xl max-h-[90vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/80 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Menu do Jogo</h2>
              <p className="text-xs text-zinc-400">Configurações, dados do mundo e controles de PC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onExitToMainMenu && (
              <button
                type="button"
                id="btn-exit-to-main-menu"
                onClick={() => {
                  onClose();
                  onExitToMainMenu();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-850 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer shadow-sm"
                title="Voltar ao Menu Principal"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>Menu Principal</span>
              </button>
            )}
            <button
              id="btn-close-menu"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700"
              title="Fechar Menu [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-700/80 bg-zinc-900/40 px-6 pt-2 gap-2">
          <button
            id="tab-menu-controls"
            onClick={() => {
              setActiveTab('controls');
              soundManager.playInventoryClick();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'controls'
                ? 'text-emerald-400 border-emerald-500 bg-zinc-800/60'
                : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Controles / Gameplay</span>
          </button>

          <button
            id="tab-menu-world"
            onClick={() => {
              setActiveTab('world');
              soundManager.playInventoryClick();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'world'
                ? 'text-emerald-400 border-emerald-500 bg-zinc-800/60'
                : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Dados do Mundo</span>
          </button>

          <button
            id="tab-menu-admin"
            onClick={() => {
              setActiveTab('admin');
              soundManager.playInventoryClick();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'admin'
                ? 'text-emerald-400 border-emerald-500 bg-zinc-800/60'
                : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Admin / Desenvolvedor</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* TAB 1: CONTROLES / GAMEPLAY */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                O jogo foi desenhado especificamente para teclado e mouse no PC. Abaixo estão todos os controles e atalhos disponíveis:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Movement */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-emerald-400">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Andar / Mover</span>
                      <div className="flex gap-1">
                        <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400">W</kbd>
                        <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400">A</kbd>
                        <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400">S</kbd>
                        <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400">D</kbd>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Ou use as setas do teclado para navegar pelo mapa com aceleração fluida.
                    </p>
                  </div>
                </div>

                {/* Sprint */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Correr (Sprint)</span>
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400">SHIFT</kbd>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Segure Shift enquanto se move para dobrar a velocidade e levantar poeira.
                    </p>
                  </div>
                </div>

                {/* Mouse Left Click: Primary Interaction */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-sky-400">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Ação Principal (Clique Esquerdo)</span>
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-sky-400">Botão Esq.</kbd>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Mire o cursor no alvo e clique: corte árvores, colha arbustos e flores dentro do alcance de interação (144px).
                    </p>
                  </div>
                </div>

                {/* Mouse Right Click: Secondary Action & Use */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-emerald-400">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Ação Secundária (Clique Direito)</span>
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400">Botão Dir.</kbd>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Consuma comida ativa (bagas/maçãs), ou plante sementes e flores diretamente no solo sob o cursor.
                    </p>
                  </div>
                </div>

                {/* Interaction key Space */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Coleta / Ação Rápida</span>
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-emerald-400">ESPAÇO</kbd>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Executa ação sobre o alvo sob o cursor do mouse ou sobre o recurso mais próximo do explorador.
                    </p>
                  </div>
                </div>

                {/* Inventory Modal */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-amber-400">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Inventário (Grade 36)</span>
                      <div className="flex gap-1">
                        <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-amber-400">E</kbd>
                        <span className="text-zinc-500 text-xs">/</span>
                        <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-amber-400">I</kbd>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Abre a grade completa de itens inspirada no Minecraft com 36 slots.
                    </p>
                  </div>
                </div>

                {/* Crafting Side Panel */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-amber-300">
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Lista de Crafting</span>
                      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-amber-400">C</kbd>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Abre ou recolhe a bancada lateral de criação de ferramentas, tábuas, tochas e itens.
                    </p>
                  </div>
                </div>

                {/* Hotbar Switching */}
                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 text-blue-400">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">Barra Rápida (Hotbar)</span>
                      <div className="flex gap-1 items-center">
                        <kbd className="px-1.5 py-0.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 rounded text-blue-400">1-9</kbd>
                        <span className="text-zinc-500 text-xs">ou</span>
                        <span className="text-xs text-blue-400 font-mono">Scroll</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Role a roda do mouse ou use as teclas numéricas de 1 a 9 para trocar o item ativo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Inventory Mouse Operations */}
              <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-700/40 space-y-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Mecânicas de Mouse no Inventário
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">• Clique Esquerdo:</span>
                    <span>Pega ou solta o stack inteiro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">• Clique Direito:</span>
                    <span>Divide metade / deposita 1 item</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">• Shift + Clique:</span>
                    <span>Move rápido entre Hotbar e Mochila</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">• Drag & Drop:</span>
                    <span>Arraste livremente entre quaisquer slots</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DADOS DO MUNDO */}
          {activeTab === 'world' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                Informações e telemetria do ambiente procedural e posição do explorador:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Biome Card */}
                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Bioma Atual</span>
                  <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{getBiomeName(groundTile)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Superfície sob o explorador: <span className="font-mono text-zinc-300">{groundTile}</span></p>
                </div>

                {/* Day Phase & Time Card */}
                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ciclo Solar & Horário</span>
                  <div className="text-base font-bold text-zinc-100 mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {timePhase.icon}
                      <span>{timePhase.name}</span>
                    </div>
                    <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-xs text-emerald-400">
                      {formatTime(settings.timeHour)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Passagem do tempo: {settings.isTimeAutoAdvancing ? 'Automática (ativa)' : 'Pausada'}
                  </p>
                </div>

                {/* Coordinates Card */}
                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Coordenadas do Jogador</span>
                  <div className="text-base font-mono font-bold text-zinc-200 mt-1 flex items-center gap-3">
                    <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">X: {Math.round(player.x)}</span>
                    <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-700">Y: {Math.round(player.y)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Direção voltada: <span className="capitalize text-zinc-300">{player.facing}</span>
                  </p>
                </div>

                {/* World Seed Card */}
                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Seed do Mapa</span>
                  <div className="text-base font-mono font-bold text-zinc-100 mt-1 flex items-center gap-2">
                    <span className="text-amber-400">#{seed}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Semente geradora do mundo procedural Simplex Noise.
                  </p>
                </div>
              </div>

              {/* Mini-Map Option */}
              <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    {showMiniMap ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
                    <span>Exibir Mini-mapa na Tela</span>
                  </span>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Por padrão fica oculto para manter a HUD limpa. Também pode ser alternado pela tecla <kbd className="px-1 bg-zinc-900 text-zinc-300 rounded font-mono">M</kbd>.
                  </p>
                </div>
                <button
                  id="btn-toggle-minimap-menu"
                  onClick={() => {
                    onToggleMiniMap();
                    soundManager.playInventoryClick();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    showMiniMap
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                  }`}
                >
                  {showMiniMap ? 'Ativado' : 'Oculto'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN / DESENVOLVEDOR */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              {/* Breadcrumb & Sub-navigation Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-700/60">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                  <span>Menu do Jogo</span>
                  <span>›</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminSection('general');
                      soundManager.playInventoryClick();
                    }}
                    className={`hover:underline cursor-pointer ${
                      adminSection === 'general' ? 'text-emerald-400 font-bold' : 'text-zinc-300'
                    }`}
                  >
                    Admin / Desenvolvedor
                  </button>
                  {adminSection === 'item_creator' && (
                    <>
                      <span>›</span>
                      <span className="text-amber-400 font-bold">Criação de Item</span>
                    </>
                  )}
                  {adminSection === 'block_creator' && (
                    <>
                      <span>›</span>
                      <span className="text-amber-400 font-bold">Editor de Blocos</span>
                    </>
                  )}
                  {adminSection === 'entity_creator' && (
                    <>
                      <span>›</span>
                      <span className="text-amber-400 font-bold">Editor de Entidades</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-admin-nav-general"
                    onClick={() => {
                      setAdminSection('general');
                      soundManager.playInventoryClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      adminSection === 'general'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Opções Gerais</span>
                  </button>

                  <button
                    type="button"
                    id="btn-admin-nav-item-creator"
                    onClick={() => {
                      setAdminSection('item_creator');
                      soundManager.playInventoryClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      adminSection === 'item_creator'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>🛠️ Itens</span>
                  </button>

                  <button
                    type="button"
                    id="btn-admin-nav-block-creator"
                    onClick={() => {
                      setAdminSection('block_creator');
                      soundManager.playInventoryClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      adminSection === 'block_creator'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <span>🧱 Blocos</span>
                  </button>

                  <button
                    type="button"
                    id="btn-admin-nav-entity-creator"
                    onClick={() => {
                      setAdminSection('entity_creator');
                      soundManager.playInventoryClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      adminSection === 'entity_creator'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    <span>👾 Entidades</span>
                  </button>
                </div>
              </div>

              {adminSection === 'item_creator' && (
                <div className="pt-1">
                  <ItemEditor />
                </div>
              )}

              {adminSection === 'block_creator' && (
                <div className="pt-1">
                  <BlockEditor />
                </div>
              )}

              {adminSection === 'entity_creator' && (
                <div className="pt-1">
                  <EntityEditor />
                </div>
              )}

              {adminSection === 'general' && (
                /* General Admin Options */
                <div className="space-y-4">
                  <div className="text-xs text-zinc-400">
                    Opções administrativas do mundo, comandos de geração e controle do ciclo:
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Generate New World */}
                    <button
                      id="btn-admin-new-world"
                      onClick={() => {
                        onNewSeed();
                        onClose();
                      }}
                      className="p-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-600/80 text-left transition-all cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-zinc-100 block">Gerar Novo Mundo</span>
                        <span className="text-xs text-zinc-400">Cria uma nova seed procedural aleatória</span>
                      </div>
                    </button>

                    {/* Teleport to Safe Spawn */}
                    <button
                      id="btn-admin-reset-spawn"
                      onClick={() => {
                        onResetSpawn();
                        onClose();
                      }}
                      className="p-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-600/80 text-left transition-all cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-zinc-100 block">Retornar ao Spawn</span>
                        <span className="text-xs text-zinc-400">Teleporta para a posição inicial (0, 0)</span>
                      </div>
                    </button>
                  </div>

                  {/* Time Cycle Administration */}
                  <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Controle do Ciclo Dia & Noite
                        </span>
                        <p className="text-xs text-zinc-400">
                          Horário atual: <span className="font-mono font-bold text-emerald-400">{formatTime(settings.timeHour)}</span>
                        </p>
                      </div>
                      <button
                        id="btn-admin-toggle-time"
                        onClick={() => {
                          onUpdateSettings({ isTimeAutoAdvancing: !settings.isTimeAutoAdvancing });
                          soundManager.playInventoryClick();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          settings.isTimeAutoAdvancing
                            ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                            : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                        }`}
                      >
                        {settings.isTimeAutoAdvancing ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pausar Tempo</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Avançar Tempo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Phase shortcuts */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          onUpdateSettings({ timeHour: 5.8 });
                          soundManager.playInventoryClick();
                        }}
                        className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-700 border border-zinc-700/60 flex flex-col items-center gap-1 text-xs cursor-pointer text-amber-300"
                      >
                        <Sunrise className="w-4 h-4 text-amber-400" />
                        <span>Aurora</span>
                      </button>

                      <button
                        onClick={() => {
                          onUpdateSettings({ timeHour: 12.0 });
                          soundManager.playInventoryClick();
                        }}
                        className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-700 border border-zinc-700/60 flex flex-col items-center gap-1 text-xs cursor-pointer text-yellow-300"
                      >
                        <Sun className="w-4 h-4 text-yellow-400" />
                        <span>Dia</span>
                      </button>

                      <button
                        onClick={() => {
                          onUpdateSettings({ timeHour: 18.2 });
                          soundManager.playInventoryClick();
                        }}
                        className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-700 border border-zinc-700/60 flex flex-col items-center gap-1 text-xs cursor-pointer text-orange-300"
                      >
                        <Sunset className="w-4 h-4 text-orange-400" />
                        <span>Ocaso</span>
                      </button>

                      <button
                        onClick={() => {
                          onUpdateSettings({ timeHour: 22.5 });
                          soundManager.playInventoryClick();
                        }}
                        className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-700 border border-zinc-700/60 flex flex-col items-center gap-1 text-xs cursor-pointer text-indigo-300"
                      >
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>Noite</span>
                      </button>
                    </div>

                    {/* Time range slider */}
                    <div className="pt-1">
                      <input
                        type="range"
                        min="0"
                        max="24"
                        step="0.1"
                        value={settings.timeHour}
                        onChange={(e) => onUpdateSettings({ timeHour: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Sound & Camera settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Audio */}
                    <div className="p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
                        <div>
                          <span className="font-semibold text-zinc-200 block text-xs">Efeitos Sonoros</span>
                          <span className="text-[11px] text-zinc-400">{settings.soundEnabled ? 'Ativados' : 'Desativados'}</span>
                        </div>
                      </div>
                      <button
                        id="btn-admin-toggle-sound"
                        onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          settings.soundEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                        }`}
                      >
                        {settings.soundEnabled ? 'Ligado' : 'Mudo'}
                      </button>
                    </div>

                    {/* Zoom */}
                    <div className="p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-zinc-200 block text-xs">Zoom da Câmera</span>
                        <span className="text-[11px] font-mono text-emerald-400">{Math.round(settings.zoom * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          id="btn-admin-zoom-out"
                          onClick={() => onUpdateSettings({ zoom: Math.max(0.8, Number((settings.zoom - 0.15).toFixed(2))) })}
                          className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
                          title="Diminuir Zoom"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          id="btn-admin-zoom-in"
                          onClick={() => onUpdateSettings({ zoom: Math.min(1.8, Number((settings.zoom + 0.15).toFixed(2))) })}
                          className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 cursor-pointer"
                          title="Aumentar Zoom"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Criação de Item Direct Card */}
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">Criação de Item</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ECS Editor
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          Criar novo item, compor componentes, validar regras e exportar JSON diretamente no menu do jogo.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-admin-open-item-creator"
                      onClick={() => {
                        setAdminSection('item_creator');
                        soundManager.playInventoryClick();
                      }}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer shrink-0"
                    >
                      Abrir Criação de Item →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-700/80 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Pressione <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded font-mono border border-zinc-700">ESC</kbd> para fechar e voltar ao jogo</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer"
          >
            Voltar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
