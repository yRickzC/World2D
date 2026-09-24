import React from 'react';
import { ModsPanel } from '../modDev/ModsPanel';

export interface DevelopmentPageProps {
  onExitToMainMenu: () => void;
}

export const DevelopmentPage: React.FC<DevelopmentPageProps> = ({ onExitToMainMenu }) => {
  return (
    <div className="w-screen h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden">
      {/* Background canvas ambiance */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Primary Mods Manager Panel */}
      <ModsPanel onClose={onExitToMainMenu} />
    </div>
  );
};
