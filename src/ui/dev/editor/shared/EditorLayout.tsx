import React from 'react';
import { ArrowLeft, FilePlus } from 'lucide-react';
import { EditorTab, TabNav } from './TabNav';

export interface EditorLayoutProps {
  title?: string;
  onBackToList?: () => void;
  backButtonLabel?: string;
  onNew?: () => void;
  newButtonLabel?: string;
  loadSelector?: React.ReactNode;
  exportActions: React.ReactNode;
  activeTab: EditorTab;
  onChangeTab: (tab: EditorTab) => void;
  componentCount?: number;
  hasErrors?: boolean;
  saveMessage?: { type: 'success' | 'error'; text: string } | null;
  onDismissSaveMessage?: () => void;
  dataPanel: React.ReactNode;
  previewPanel: React.ReactNode;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  title,
  onBackToList,
  backButtonLabel = 'Voltar para Lista',
  onNew,
  newButtonLabel = 'Novo',
  loadSelector,
  exportActions,
  activeTab,
  onChangeTab,
  componentCount,
  hasErrors,
  saveMessage,
  onDismissSaveMessage,
  dataPanel,
  previewPanel,
}) => {
  return (
    <div className="flex flex-col h-full space-y-3.5">
      {/* Save Notification Banner */}
      {saveMessage && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md transition-all animate-in fade-in duration-150 ${
            saveMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
              : 'bg-rose-950/90 text-rose-300 border border-rose-700/60'
          }`}
        >
          <span>{saveMessage.text}</span>
          {onDismissSaveMessage && (
            <button
              type="button"
              onClick={onDismissSaveMessage}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer px-1"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 shadow-sm transition-colors cursor-pointer mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backButtonLabel}</span>
            </button>
          )}

          {onNew && (
            <button
              type="button"
              onClick={onNew}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>{newButtonLabel}</span>
            </button>
          )}

          {/* Load Selector */}
          {loadSelector}
        </div>

        {/* Export Actions ([Salvar no Sistema], [Salvar .JSON], [Copiar JSON]) */}
        <div>{exportActions}</div>
      </div>

      {/* Tab Navigation: @Data | @Preview | Split */}
      <TabNav
        activeTab={activeTab}
        onChangeTab={onChangeTab}
        componentCount={componentCount}
        hasErrors={hasErrors}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {/* Case 1: Split View (Side-by-Side: @Data on left, @Preview on right) */}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            <div className="lg:col-span-7 flex flex-col space-y-4">{dataPanel}</div>
            <div className="lg:col-span-5 flex flex-col space-y-4">{previewPanel}</div>
          </div>
        )}

        {/* Case 2: Only @Data Tab */}
        {activeTab === 'data' && (
          <div className="max-w-4xl mx-auto flex flex-col space-y-4">{dataPanel}</div>
        )}

        {/* Case 3: Only @Preview Tab */}
        {activeTab === 'preview' && (
          <div className="max-w-4xl mx-auto flex flex-col space-y-4">{previewPanel}</div>
        )}
      </div>
    </div>
  );
};
