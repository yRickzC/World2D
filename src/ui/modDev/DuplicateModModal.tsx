import React, { useState } from 'react';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { globalModManager, ModPackage } from '../../mods';

export interface DuplicateModModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePackage: ModPackage | null;
  onDuplicated: (newModId: string) => void;
}

export const DuplicateModModal: React.FC<DuplicateModModalProps> = ({
  isOpen,
  onClose,
  sourcePackage,
  onDuplicated,
}) => {
  const [newId, setNewId] = useState(() => (sourcePackage ? `${sourcePackage.manifest.id}_copy` : ''));
  const [newName, setNewName] = useState(() => (sourcePackage ? `${sourcePackage.manifest.name} (Cópia)` : ''));
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (sourcePackage) {
      setNewId(`${sourcePackage.manifest.id}_copy`);
      setNewName(`${sourcePackage.manifest.name} (Cópia)`);
      setError(null);
    }
  }, [sourcePackage]);

  const handleDuplicate = () => {
    if (!sourcePackage) return;
    setError(null);

    const res = globalModManager.duplicateMod(sourcePackage.manifest.id, newId, newName);
    if (!res.success) {
      setError(res.error || 'Falha ao duplicar mod.');
      return;
    }

    onDuplicated(res.pkg!.manifest.id);
    onClose();
  };

  if (!sourcePackage) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Duplicar Pacote: ${sourcePackage.manifest.name}`}>
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-zinc-400">
          Uma cópia independente será criada com todos os blocos, itens, entidades e biomas. Todos os IDs receberão o novo namespace automaticamente.
        </p>

        <div>
          <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
            Novo Nome
          </label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Meu Mod Teste"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
            Novo ID / Namespace
          </label>
          <Input
            value={newId}
            onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="ex: meu_mod_test"
            className="w-full font-mono text-amber-300"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleDuplicate} icon={<Copy className="w-4 h-4" />}>
            Duplicar Pacote
          </Button>
        </div>
      </div>
    </Modal>
  );
};
