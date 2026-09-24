import React, { useState } from 'react';
import { AlertCircle, Boxes, Check, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { globalModManager } from '../../mods';

export interface CreateModModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (modId: string) => void;
}

export const CreateModModal: React.FC<CreateModModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-suggest sanitized ID if ID wasn't manually customized
    if (!id || id === name.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
      setId(val.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_'));
    }
  };

  const handleCreate = () => {
    setError(null);
    const res = globalModManager.createMod({
      id,
      name,
      version,
      author,
      description,
      dependencies: {
        core: '>=1.0.0',
      },
    });

    if (!res.success) {
      setError(res.error || 'Falha ao criar mod.');
      return;
    }

    onCreated(res.pkg!.manifest.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Mod Package">
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
            Nome do Mod <span className="text-rose-400">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Magic Crystal Mod"
            className="w-full"
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
              ID Único / Namespace <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] font-mono text-zinc-400">
              Namespace: {id ? `${id}:` : '...'}
            </span>
          </div>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="ex: magic_crystal_mod"
            className="w-full font-mono text-amber-300"
          />
          <p className="text-[10px] text-zinc-400 mt-1">
            Apenas letras minúsculas, números e sublinhado (_). Usado como prefixo de todo o conteúdo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Versão (SemVer) <span className="text-rose-400">*</span>
            </label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="w-full font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Autor
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Seu nome ou equipe"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva as mecânicas, biomas e blocos adicionados por este pacote..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs"
          />
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            Dependência padrão incluída automaticamente: <strong className="text-zinc-200">core &gt;= 1.0.0</strong>
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCreate} icon={<Check className="w-4 h-4" />}>
            Criar Mod Package
          </Button>
        </div>
      </div>
    </Modal>
  );
};
