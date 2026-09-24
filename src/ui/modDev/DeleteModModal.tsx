import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { globalModManager, ModPackage } from '../../mods';

export interface DeleteModModalProps {
  isOpen: boolean;
  onClose: () => void;
  modPackage: ModPackage | null;
  onDeleted: () => void;
}

export const DeleteModModal: React.FC<DeleteModModalProps> = ({
  isOpen,
  onClose,
  modPackage,
  onDeleted,
}) => {
  if (!modPackage) return null;

  const isCore = modPackage.isCore || modPackage.manifest.id === 'core';

  const handleDelete = () => {
    if (isCore) return;
    globalModManager.deleteMod(modPackage.manifest.id);
    onDeleted();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Mod?">
      <div className="space-y-4 text-xs">
        {isCore ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <strong>Proteção do Core:</strong> O Core é a fundação do jogo e seus sistemas não podem ser excluídos.
          </div>
        ) : (
          <>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">
                  {modPackage.manifest.name} ({modPackage.manifest.id})
                </h4>
                <p className="text-zinc-300 mt-1">
                  This will remove the entire mod package and its contents permanently.
                </p>
                <div className="mt-2 text-[11px] font-mono text-zinc-400">
                  {modPackage.content.blocks?.length || 0} blocos • {modPackage.content.items?.length || 0} itens • {modPackage.content.entities?.length || 0} entidades
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Mod
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
