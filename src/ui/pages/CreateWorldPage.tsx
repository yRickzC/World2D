import React, { useState } from 'react';
import { Compass, Dices, Sparkles } from 'lucide-react';
import { WorldData, WorldStorage } from '../../gameplay/mundo/WorldStorage';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MenuLayout } from '../layouts/MenuLayout';

export interface CreateWorldPageProps {
  onBackToWorlds: () => void;
  onWorldCreated: (world: WorldData) => void;
}

export const CreateWorldPage: React.FC<CreateWorldPageProps> = ({
  onBackToWorlds,
  onWorldCreated,
}) => {
  const [name, setName] = useState<string>('Meu Mundo');
  const [seedInput, setSeedInput] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');

  const handleGenerateRandomSeed = () => {
    const random = WorldStorage.generateRandomSeed();
    setSeedInput(random.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('O nome do mundo não pode ficar vazio.');
      return;
    }
    setNameError('');

    // If seedInput is empty, WorldStorage.create automatically generates a valid seed!
    const created = WorldStorage.create(trimmedName, seedInput || undefined);
    onWorldCreated(created);
  };

  return (
    <MenuLayout
      title="Criar Novo Mundo"
      subtitle="Defina os parâmetros de criação do mapa procedural"
      onBack={onBackToWorlds}
      maxWidth="md"
    >
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header icon */}
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl">
              🌲
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Configurar Mundo</h2>
              <p className="text-xs text-zinc-400">Personalize seu ambiente de sobrevivência</p>
            </div>
          </div>

          {/* Nome do Mundo */}
          <div className="space-y-1.5">
            <Input
              label="Nome do Mundo"
              placeholder="Ex: Meu Mundo, Planície Dourada..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              error={nameError}
              helper="O nome que identificará este mundo na sua lista de mundos."
              autoFocus
              required
            />
          </div>

          {/* Seed */}
          <div className="space-y-1.5">
            <Input
              label="Seed (Semente Procedural)"
              placeholder="Ex: 123456 ou deixe vazio para gerar"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              helper="A seed define o relevo, lagos, árvores e recursos. Deixe em branco para gerar aleatoriamente."
              actionButton={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateRandomSeed}
                  icon={<Dices className="w-3.5 h-3.5 text-amber-400" />}
                  className="py-1 px-2 text-xs"
                  title="Gerar Seed Aleatória"
                >
                  Aleatória
                </Button>
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="ghost" size="md" onClick={onBackToWorlds} type="button">
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              icon={<Compass className="w-4 h-4 fill-current" />}
              className="px-6 font-bold shadow-lg"
            >
              Criar Mundo
            </Button>
          </div>
        </form>
      </div>
    </MenuLayout>
  );
};
