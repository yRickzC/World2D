import React, { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Info,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { globalModManager, ModPackage, ModValidationReport } from '../../mods';

export interface ValidateModModalProps {
  isOpen: boolean;
  onClose: () => void;
  modPackage: ModPackage | null;
}

export const ValidateModModal: React.FC<ValidateModModalProps> = ({
  isOpen,
  onClose,
  modPackage,
}) => {
  const report: ModValidationReport | null = useMemo(() => {
    if (!isOpen || !modPackage) return null;
    return globalModManager.validatePackage(modPackage.manifest.id);
  }, [isOpen, modPackage]);

  if (!modPackage || !report) return null;

  const errorCount = report.issues.filter((i) => i.severity === 'error').length;
  const warningCount = report.issues.filter((i) => i.severity === 'warning').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Validação do Mod: ${modPackage.manifest.name} (${modPackage.manifest.id})`}
    >
      <div className="space-y-4 text-xs max-h-[75vh] flex flex-col">
        {/* Status Header Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            report.valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {report.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-sm text-white">
                {report.valid ? 'Mod Validado com Sucesso!' : 'Erros de Validação Encontrados'}
              </h4>
              <p className="text-[11px] opacity-90">
                {report.valid
                  ? 'O pacote atende todos os requisitos de integridade, namespaces e referências.'
                  : `${errorCount} erro(s) crítico(s) e ${warningCount} aviso(s) detectados.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700 text-zinc-300">
              v{modPackage.manifest.version}
            </span>
          </div>
        </div>

        {/* Audit Checklist */}
        <div>
          <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Checklist de Conformidade
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.checks.map((c, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  c.passed
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <div className="font-semibold text-xs text-white truncate">{c.title}</div>
                    {c.details && <div className="text-[10px] text-zinc-400 truncate">{c.details}</div>}
                  </div>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ml-2 ${
                    c.passed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {c.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Issues List */}
        {report.issues.length > 0 && (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 border-t border-zinc-800 pt-3">
            <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Diagnósticos e Mensagens ({report.issues.length})
            </h5>
            <div className="space-y-1.5">
              {report.issues.map((issue, idx) => {
                const isError = issue.severity === 'error';
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      isError
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                        : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    }`}
                  >
                    {isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-900/80 border border-zinc-700">
                          {issue.category}
                        </span>
                        {issue.objectId && (
                          <span className="font-mono text-[10px] text-zinc-300 truncate">
                            {issue.objectId}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-zinc-100">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="mt-1 text-[11px] text-emerald-400">
                          💡 Sugestão: {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-zinc-800">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
