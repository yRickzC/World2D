import React, { useRef, useState } from 'react';
import { AlertCircle, Check, FileUp, Upload } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { globalModManager } from '../../mods';

export interface ImportModModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (modId: string) => void;
}

export const ImportModModal: React.FC<ImportModModalProps> = ({
  isOpen,
  onClose,
  onImported,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      setError(null);
    };
    reader.onerror = () => {
      setError('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setError(null);
    if (!jsonText.trim()) {
      setError('Insira o JSON do pacote de mod ou selecione um arquivo .json.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const res = globalModManager.importMod(parsed);
      if (!res.success) {
        setError(res.error || 'Falha ao validar ou importar o mod.');
        return;
      }

      onImported(parsed.manifest.id);
      onClose();
    } catch (e: any) {
      setError(`Sintaxe JSON inválida: ${e.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar Mod Package">
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
            Arquivo do Mod (.json)
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<FileUp className="w-3.5 h-3.5" />}
          >
            Escolher Arquivo...
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
            Ou cole o código JSON do pacote:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            placeholder='{ "manifest": { "id": "my_mod", "name": "My Mod", "version": "1.0.0" }, "content": { ... } }'
            rows={8}
            className="w-full font-mono text-[11px] px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleImport} icon={<Upload className="w-4 h-4" />}>
            Validar & Importar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
