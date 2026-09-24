import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';

export interface NavigationProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Voltar',
  badge,
  actions,
  id = 'view-navigation',
}) => {
  return (
    <header
      id={id}
      className="flex items-center justify-between gap-4 px-6 py-4 bg-zinc-950/80 backdrop-blur border-b border-zinc-800/80 select-none"
    >
      <div className="flex items-center gap-4 min-w-0">
        {onBack && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            icon={<ArrowLeft className="w-4 h-4 text-zinc-300" />}
            title="Voltar para a tela anterior"
            className="flex-shrink-0"
          >
            {backLabel}
          </Button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-white tracking-wide truncate">{title}</h1>
            {badge && <span className="flex-shrink-0">{badge}</span>}
          </div>
          {subtitle && <p className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
};
