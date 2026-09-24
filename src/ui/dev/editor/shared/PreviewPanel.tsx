import React from 'react';
import { Eye, FileCode } from 'lucide-react';

export interface PreviewPanelProps {
  title?: string;
  visualTitle?: string;
  visualPreview?: React.ReactNode;
  jsonTitle?: string;
  jsonPreview?: React.ReactNode;
  extraControls?: React.ReactNode;
  children?: React.ReactNode;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  title,
  visualTitle,
  visualPreview,
  jsonTitle = 'Definição JSON (Oficial)',
  jsonPreview,
  extraControls,
  children,
}) => {
  const displayTitle = title || visualTitle || 'Preview Visual';

  // If children is provided directly, render it inside the panel
  if (children) {
    return (
      <div className="flex flex-col space-y-4 h-full">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col space-y-3 flex-1 min-h-0">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                {displayTitle}
              </h3>
            </div>
            {extraControls}
          </div>
          <div className="flex-1 min-h-0">{children}</div>
        </div>

        {jsonPreview && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col space-y-3 min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                  {jsonTitle}
                </h3>
              </div>
            </div>
            <div className="flex-1 min-h-0">{jsonPreview}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Visual Render Preview */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              {displayTitle}
            </h3>
          </div>
          {extraControls}
        </div>
        <div>{visualPreview}</div>
      </div>

      {/* Official JSON Preview */}
      {jsonPreview && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm flex-1 flex flex-col space-y-3 min-h-[300px]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                {jsonTitle}
              </h3>
            </div>
          </div>
          <div className="flex-1 min-h-0">{jsonPreview}</div>
        </div>
      )}
    </div>
  );
};
