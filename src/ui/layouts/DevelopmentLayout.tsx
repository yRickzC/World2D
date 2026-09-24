import React from 'react';
import {
  Activity,
  ArrowLeft,
  Boxes,
  Code2,
  Globe,
  Layers,
  Package,
  Terminal,
  Users,
  Wrench,
} from 'lucide-react';
import { Button } from '../components/Button';

export type DevSection = 'items' | 'blocks' | 'entities' | 'world' | 'debug';

export interface DevelopmentLayoutProps {
  activeSection: DevSection;
  onSelectSection: (section: DevSection) => void;
  onExitToMenu: () => void;
  children: React.ReactNode;
}

export const DevelopmentLayout: React.FC<DevelopmentLayoutProps> = ({
  activeSection,
  onSelectSection,
  onExitToMenu,
  children,
}) => {
  const navItems: { id: DevSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'items',
      label: 'Items',
      icon: <Package className="w-4 h-4" />,
      badge: 'Ativo',
    },
    {
      id: 'blocks',
      label: 'Blocos',
      icon: <Layers className="w-4 h-4" />,
      badge: '10 Core',
    },
    {
      id: 'entities',
      label: 'Entidades',
      icon: <Users className="w-4 h-4" />,
      badge: 'Ativo',
    },
    {
      id: 'world',
      label: 'Mundo & Clima',
      icon: <Globe className="w-4 h-4" />,
      badge: 'Ativo',
    },
    {
      id: 'debug',
      label: 'Debug & Logs',
      icon: <Terminal className="w-4 h-4" />,
      badge: 'Em breve',
    },
  ];

  return (
    <div
      id="dev-layout"
      className="relative w-screen h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none"
    >
      {/* Dev Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExitToMenu}
            icon={<ArrowLeft className="w-4 h-4 text-zinc-300" />}
            title="Voltar ao Menu Principal"
          >
            Menu Principal
          </Button>

          <div className="border-l border-zinc-800 pl-4 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">
                  Desenvolvimento & Ferramentas
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEV MODE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Arquitetura desacoplada de Items, Blocos e Conteúdo Modular
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>ItemSystem v2.0 • Online</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Body with Sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          id="dev-sidebar"
          className="w-56 sm:w-64 bg-zinc-900/90 border-r border-zinc-800 flex flex-col justify-between flex-shrink-0"
        >
          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Módulos do Sistema
            </div>

            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-zinc-950' : 'text-zinc-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 bg-zinc-950/40 space-y-1 font-mono">
            <div className="flex items-center justify-between">
              <span>Arquitetura:</span>
              <span className="text-zinc-300">ECS Componentizado</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Database:</span>
              <span className="text-zinc-300">ItemSystem_db</span>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main id="dev-content-pane" className="flex-1 min-w-0 flex flex-col bg-zinc-950 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
