import React from 'react';
import { AlertCircle, AlertTriangle, Layers, Settings } from 'lucide-react';

export interface DataPanelProps {
  title?: string;
  badge?: string;
  staticFieldsTitle?: string;
  staticFields: React.ReactNode;
  componentsTitle?: string;
  componentsCount?: number;
  componentsContent: React.ReactNode;
  validationReport?: {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
  } | null;
  children?: React.ReactNode;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  title,
  badge,
  staticFieldsTitle = 'Dados Básicos',
  staticFields,
  componentsTitle = 'Componentes',
  componentsCount,
  componentsContent,
  validationReport,
  children,
}) => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Validation Warnings / Errors */}
      {validationReport && (!validationReport.isValid || (validationReport.warnings && validationReport.warnings.length > 0)) && (
        <div className="space-y-2">
          {validationReport.errors.map((err, idx) => (
            <div
              key={`err_${idx}`}
              className="flex items-start gap-2.5 p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300 shadow-sm"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
          {validationReport.warnings?.map((warn, idx) => (
            <div
              key={`warn_${idx}`}
              className="flex items-start gap-2.5 p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl text-xs text-amber-300 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Static Identity Section */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              {staticFieldsTitle}
            </h3>
          </div>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
              {badge}
            </span>
          )}
        </div>

        <div>{staticFields}</div>
      </div>

      {/* Components Section */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              {componentsTitle}
            </h3>
          </div>
          {typeof componentsCount === 'number' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950/80 text-sky-300 border border-sky-800/60">
              {componentsCount} {componentsCount === 1 ? 'componente' : 'componentes'}
            </span>
          )}
        </div>

        <div>{componentsContent}</div>
      </div>

      {children}
    </div>
  );
};
