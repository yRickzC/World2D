import React, { useState } from 'react';
import { AlertTriangle, Plus, Sparkles } from 'lucide-react';
import { WorldData, WorldStorage } from '../../gameplay/mundo/WorldStorage';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { WorldCard } from '../components/WorldCard';
import { MenuLayout } from '../layouts/MenuLayout';

export interface WorldsPageProps {
  onBackToMainMenu: () => void;
  onNavigateToCreateWorld: () => void;
  onPlayWorld: (world: WorldData) => void;
}

export const WorldsPage: React.FC<WorldsPageProps> = ({
  onBackToMainMenu,
  onNavigateToCreateWorld,
  onPlayWorld,
}) => {
  const [worlds, setWorlds] = useState<WorldData[]>(() => WorldStorage.getAll());
  const [worldToDelete, setWorldToDelete] = useState<WorldData | null>(null);

  const refreshWorlds = () => {
    setWorlds(WorldStorage.getAll());
  };

  const handleConfirmDelete = () => {
    if (!worldToDelete) return;
    WorldStorage.delete(worldToDelete.id);
    setWorldToDelete(null);
    refreshWorlds();
  };

  const handlePlay = (world: WorldData) => {
    WorldStorage.touch(world.id);
    onPlayWorld(world);
  };

  return (
    <MenuLayout
      title="Mundos Salvos"
      subtitle="Escolha um mundo existente ou crie uma nova aventura procedural"
      onBack={onBackToMainMenu}
      headerActions={
        <Button
          variant="primary"
          size="sm"
          onClick={onNavigateToCreateWorld}
          icon={<Plus className="w-4 h-4" />}
          className="font-bold shadow-md"
        >
          Criar Novo Mundo
        </Button>
      }
      maxWidth="4xl"
    >
      <div className="w-full space-y-6">
        {/* Worlds Grid */}
        {worlds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {worlds.map((world) => (
              <WorldCard
                key={world.id}
                world={world}
                onPlay={handlePlay}
                onDelete={(w) => setWorldToDelete(w)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center text-3xl mb-4">
              🌍
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum mundo encontrado</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-sm">
              Você ainda não possui nenhum mundo salvo. Crie o seu primeiro mundo procedural para começar a explorar!
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={onNavigateToCreateWorld}
                icon={<Plus className="w-4 h-4" />}
              >
                Criar Meu Primeiro Mundo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal to avoid accidental deletions */}
      <Modal
        isOpen={Boolean(worldToDelete)}
        onClose={() => setWorldToDelete(null)}
        title="Confirmar Exclusão de Mundo"
        description="Esta ação não pode ser revertida"
        icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setWorldToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              className="font-semibold"
            >
              Sim, Apagar Mundo
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-zinc-300">
          <p>
            Tem certeza de que deseja apagar o mundo{' '}
            <strong className="text-white font-bold">{worldToDelete?.name}</strong>?
          </p>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
            Seed:{' '}
            <span className="text-amber-400 font-bold">{worldToDelete?.seed}</span>
          </div>
          <p className="text-xs text-rose-400/90">
            Todos os chunks, dados de geração e progresso salvos para este mundo serão removidos permanentemente.
          </p>
        </div>
      </Modal>
    </MenuLayout>
  );
};
