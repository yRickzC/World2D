import {
  Activity,
  Box,
  CheckCircle,
  Code2,
  FileCode,
  FileJson,
  Globe,
  Layers,
  Package,
  Wrench,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ENABLE_DEV_MENU } from '../../dev/config';
import { ItemEditor } from './editor/ItemEditor';
import { BlockEditor } from './editor/BlockEditor';
import { EntityEditor } from './editor/EntityEditor';
import { WorldEditor } from './editor/WorldEditor';
import { ComponentBrowser } from './tools/ComponentBrowser';
import { EventViewer } from './tools/EventViewer';
import { JsonValidator } from './tools/JsonValidator';
import { SchemaViewer } from './tools/SchemaViewer';
import { ModGeneratorView } from './tools/ModGeneratorView';

interface DevMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DevMenuTab = 'editor' | 'block_editor' | 'entity_editor' | 'world_editor' | 'browser' | 'schemas' | 'validator' | 'events' | 'mods';

export const DevMenuModal: React.FC<DevMenuModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<DevMenuTab>('editor');

  // Listen to ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!ENABLE_DEV_MENU || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-text">
      <div
        className="w-full max-w-6xl h-[92vh] max-h-[900px] bg-zinc-950 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">
                  Developer Menu — ItemSystem
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEV TOOL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Editor de Itens, Composição de Componentes e Exportador JSON
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 rounded text-zinc-400 border border-zinc-700">
              ESC para fechar
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar Menu de Desenvolvimento"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-2.5 pb-2 bg-zinc-900/60 border-b border-zinc-800/80 overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Item Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('block_editor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'block_editor'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Block Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('entity_editor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'entity_editor'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Entity Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('world_editor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'world_editor'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>World Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'browser'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Component Browser</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schemas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'schemas'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Schema Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'validator'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>JSON Validator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Event Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mods')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mods'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Mod Generator</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto min-h-0 bg-[#0d0f12]">
          {activeTab === 'editor' && <ItemEditor />}
          {activeTab === 'block_editor' && <BlockEditor />}
          {activeTab === 'entity_editor' && <EntityEditor />}
          {activeTab === 'world_editor' && <WorldEditor />}
          {activeTab === 'browser' && <ComponentBrowser />}
          {activeTab === 'schemas' && <SchemaViewer />}
          {activeTab === 'validator' && <JsonValidator />}
          {activeTab === 'events' && <EventViewer />}
          {activeTab === 'mods' && <ModGeneratorView />}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>ItemSystem v2.0 • Component-Based ECS</span>
            <span>•</span>
            <span className="text-zinc-400">Arquivos exportados prontos para data/items/</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Atalho rápido:</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 rounded text-zinc-400 border border-zinc-700">
              F8
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
