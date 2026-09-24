import React from 'react';
import { Compass, Hash, Sparkles, Tag, X } from 'lucide-react';
import { Surface } from '../../../../gameplay/mundo/superficie/Surface';

export interface SurfaceGeneralTabProps {
  surface: Surface;
  onChange: () => void;
}

export const SurfaceGeneralTab: React.FC<SurfaceGeneralTabProps> = ({ surface, onChange }) => {
  const [newTagInput, setNewTagInput] = React.useState('');

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().toLowerCase();
    if (!surface.tags.includes(tag)) {
      surface.tags.push(tag);
      onChange();
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    surface.tags = surface.tags.filter((t) => t !== tag);
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400" />
          Configurações Gerais da Superfície
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">ID da Superfície</label>
            <input
              type="text"
              value={surface.id}
              onChange={(e) => {
                surface.id = e.target.value;
                onChange();
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Superfície</label>
            <input
              type="text"
              value={surface.name}
              onChange={(e) => {
                surface.name = e.target.value;
                onChange();
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-500" /> Seed da Superfície
            </label>
            <input
              type="number"
              value={surface.seed}
              onChange={(e) => {
                surface.seed = parseInt(e.target.value, 10) || 0;
                onChange();
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Bioma Padrão</label>
            <select
              value={surface.defaultBiomeId}
              onChange={(e) => {
                surface.defaultBiomeId = e.target.value;
                onChange();
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              {surface.getAllBiomes().map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.id})
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-full">
            <label className="block text-xs font-medium text-slate-400 mb-1">Descrição</label>
            <textarea
              rows={2}
              value={surface.description || ''}
              onChange={(e) => {
                surface.description = e.target.value;
                onChange();
              }}
              placeholder="Descreva as características ambientais desta superfície..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-500" /> Tags da Superfície
          </label>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {surface.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Adicionar nova tag (ex: extraterrestrial, underground)..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
