/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorldData, WorldStorage } from './gameplay/mundo/WorldStorage';
import { GameCanvas } from './ui/GameCanvas';
import { CreateWorldPage } from './ui/pages/CreateWorldPage';
import { DevelopmentPage } from './ui/pages/DevelopmentPage';
import { MainMenuPage } from './ui/pages/MainMenuPage';
import { WorldsPage } from './ui/pages/WorldsPage';

export type AppView = 'main_menu' | 'worlds' | 'create_world' | 'development' | 'game';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('main_menu');
  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);

  const handlePlayWorld = (world: WorldData) => {
    setActiveWorld(world);
    setCurrentView('game');
  };

  const handleWorldCreated = (world: WorldData) => {
    setActiveWorld(world);
    setCurrentView('game');
  };

  const handleExitToMainMenu = () => {
    setCurrentView('main_menu');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none">
      {/* 1. Root Main Menu */}
      {currentView === 'main_menu' && (
        <MainMenuPage
          onNavigateToWorlds={() => setCurrentView('worlds')}
          onNavigateToDev={() => setCurrentView('development')}
        />
      )}

      {/* 2. Worlds Management Page */}
      {currentView === 'worlds' && (
        <WorldsPage
          onBackToMainMenu={() => setCurrentView('main_menu')}
          onNavigateToCreateWorld={() => setCurrentView('create_world')}
          onPlayWorld={handlePlayWorld}
        />
      )}

      {/* 3. Create World Page */}
      {currentView === 'create_world' && (
        <CreateWorldPage
          onBackToWorlds={() => setCurrentView('worlds')}
          onWorldCreated={handleWorldCreated}
        />
      )}

      {/* 4. Development & Modding Studio */}
      {currentView === 'development' && (
        <DevelopmentPage onExitToMainMenu={handleExitToMainMenu} />
      )}

      {/* 5. In-Game 2D Procedural World Canvas */}
      {currentView === 'game' && (
        <GameCanvas
          key={activeWorld?.id || 'game-default'}
          activeWorld={activeWorld}
          onExitToMainMenu={handleExitToMainMenu}
        />
      )}
    </div>
  );
}
