import React from 'react';
import { Code2, Database, Eye, Split } from 'lucide-react';

export type EditorTab = 'data' | 'preview' | 'split';

export interface TabNavProps {
  activeTab: EditorTab;
  onChangeTab: (tab: EditorTab) => void;
  dataLabel?: string;
  previewLabel?: string;
  componentCount?: number;
  hasErrors?: boolean;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onChangeTab,
  dataLabel = '@Data',
  previewLabel = '@Preview',
  componentCount,
  hasErrors,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/90 bg-zinc-900/60 px-4 py-2">
      <div className="flex items-center gap-1.5">
        {/* @Data Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('data')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'data'
              ? 'bg-amber-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{dataLabel}</span>
          {componentCount !== undefined && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'data'
                  ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {componentCount}
            </span>
          )}
          {hasErrors && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" title="Erros presentes" />
          )}
        </button>

        {/* @Preview Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('preview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-amber-500 text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{previewLabel}</span>
        </button>

        {/* Desktop Split View Tab */}
        <button
          type="button"
          onClick={() => onChangeTab('split')}
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'split'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
          title="Visualizar @Data e @Preview lado a lado"
        >
          <Split className="w-3.5 h-3.5" />
          <span className="text-[11px]">Lado a Lado</span>
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
        <Code2 className="w-3.5 h-3.5" />
        <span>Schema-driven Dev Editor</span>
      </div>
    </div>
  );
};
