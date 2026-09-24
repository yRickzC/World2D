import React from 'react';
import { ArrowLeft, Compass, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';

export interface MenuLayoutProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | 'full';
  showBrandingHeader?: boolean;
}

export const MenuLayout: React.FC<MenuLayoutProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Voltar',
  headerActions,
  children,
  maxWidth = '4xl',
  showBrandingHeader = true,
}) => {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div
      id="menu-layout"
      className="relative w-screen h-screen overflow-hidden bg-[#0e1015] text-zinc-100 flex flex-col font-sans select-none"
    >
      {/* Ambient background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-40 right-10 w-[400px] h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-zinc-950/75 backdrop-blur-md border-b border-zinc-800/80">
        <div className="flex items-center gap-4">
          {onBack ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
              icon={<ArrowLeft className="w-4 h-4 text-zinc-300" />}
              title="Voltar"
            >
              {backLabel}
            </Button>
          ) : (
            showBrandingHeader && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-md">
                  <Compass className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white tracking-wide">Mundo Aberto 2D</h1>
                  <p className="text-[11px] text-zinc-400">Sobrevivência, Construção & Modding</p>
                </div>
              </div>
            )
          )}

          {title && (
            <div className={onBack ? 'border-l border-zinc-800 pl-4' : ''}>
              <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
              {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {headerActions}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>v1.2.0 • Online</span>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <div className={`w-full ${maxWidthClass} flex-1 flex flex-col`}>{children}</div>
      </main>
    </div>
  );
};
