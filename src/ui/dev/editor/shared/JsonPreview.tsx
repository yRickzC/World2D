import React, { useState } from 'react';
import { Check, Copy, Download, FileCode } from 'lucide-react';

export interface JsonPreviewProps {
  data: any;
  title?: string;
  filePath?: string;
  onDownload?: () => void;
  canDownload?: boolean;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({
  data,
  title = 'JSON do Runtime',
  filePath,
  onDownload,
  canDownload = true,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const formattedJson = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-md flex flex-col flex-1 min-h-[340px]">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 truncate">
            {title}
          </h3>
          {filePath && (
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline truncate max-w-[200px]">
              ({filePath})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={!canDownload}
              className={`text-[11px] flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                canDownload
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-600 cursor-not-allowed opacity-50'
              }`}
              title="Baixar arquivo .json"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Baixar .json</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] text-zinc-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 cursor-pointer transition-colors"
            title="Copiar JSON para a área de transferência"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      <pre className="flex-1 p-3 bg-zinc-950/95 border border-zinc-800 rounded-lg text-[11px] font-mono text-emerald-400 overflow-auto leading-relaxed select-all">
        {formattedJson}
      </pre>
    </div>
  );
};
