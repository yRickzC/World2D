import React, { useState } from 'react';
import { Copy, Download, Save } from 'lucide-react';

export interface ExportActionsProps {
  onSaveToSystem: () => void;
  onDownloadJSON: () => void;
  onCopyJSON: () => void;
  isValid: boolean;
  validationErrorCount?: number;
  copied?: boolean;
  saveButtonLabel?: string;
  isSaving?: boolean;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  onSaveToSystem,
  onDownloadJSON,
  onCopyJSON,
  isValid,
  validationErrorCount = 0,
  copied = false,
  saveButtonLabel = 'Salvar no Sistema',
  isSaving = false,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 1. Salvar no Sistema */}
      <button
        type="button"
        id="btn-save-to-system"
        onClick={onSaveToSystem}
        disabled={!isValid || isSaving}
        title={
          !isValid
            ? `Corrija os ${validationErrorCount} erro(s) de validação antes de salvar.`
            : 'Registrar e disponibilizar no sistema imediatamente'
        }
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow transition-all cursor-pointer ${
          isValid && !isSaving
            ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 hover:scale-105 active:scale-95'
            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60'
        }`}
      >
        <Save className="w-3.5 h-3.5" />
        <span>{isSaving ? 'Salvando...' : saveButtonLabel}</span>
      </button>

      {/* 2. Salvar .JSON */}
      <button
        type="button"
        id="btn-download-json"
        onClick={onDownloadJSON}
        disabled={!isValid}
        title={
          !isValid
            ? 'Corrija os erros de validação antes de exportar'
            : 'Exportar arquivo .json formatado'
        }
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow transition-all cursor-pointer ${
          isValid
            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:text-white'
            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Salvar .JSON</span>
      </button>

      {/* 3. Copiar JSON */}
      <button
        type="button"
        id="btn-copy-json"
        onClick={onCopyJSON}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
        title="Copiar JSON completo para a área de transferência"
      >
        <Copy className="w-3.5 h-3.5 text-zinc-400" />
        <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
      </button>
    </div>
  );
};
