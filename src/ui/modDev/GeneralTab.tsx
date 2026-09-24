import React, { useState } from 'react';
import {
  AlertCircle,
  Boxes,
  Check,
  Code2,
  FileCode,
  GitFork,
  Layers,
  Plus,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { globalModManager, ModPackage, ModPatch } from '../../mods';

export interface GeneralTabProps {
  pkg: ModPackage;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ pkg }) => {
  const [name, setName] = useState(pkg.manifest.name);
  const [version, setVersion] = useState(pkg.manifest.version);
  const [author, setAuthor] = useState(pkg.manifest.author);
  const [description, setDescription] = useState(pkg.manifest.description);
  const [dependencies, setDependencies] = useState<Record<string, string>>(
    pkg.manifest.dependencies || {}
  );
  const [newDepId, setNewDepId] = useState('');
  const [newDepVer, setNewDepVer] = useState('>=1.0.0');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setName(pkg.manifest.name);
    setVersion(pkg.manifest.version);
    setAuthor(pkg.manifest.author);
    setDescription(pkg.manifest.description);
    setDependencies(pkg.manifest.dependencies || {});
    setSaveSuccess(false);
    setError(null);
  }, [pkg]);

  const isCore = pkg.isCore || pkg.manifest.id === 'core';

  const handleSave = () => {
    setError(null);
    const res = globalModManager.updateModManifest(pkg.manifest.id, {
      name,
      version,
      author,
      description,
      dependencies,
    });

    if (!res.success) {
      setError(res.error || 'Falha ao salvar manifest.');
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddDependency = () => {
    if (!newDepId.trim()) return;
    const cleanDep = newDepId.trim().toLowerCase();
    setDependencies((prev) => ({
      ...prev,
      [cleanDep]: newDepVer.trim() || '>=1.0.0',
    }));
    setNewDepId('');
    setNewDepVer('>=1.0.0');
  };

  const handleRemoveDependency = (depKey: string) => {
    setDependencies((prev) => {
      const copy = { ...prev };
      delete copy[depKey];
      return copy;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
              isCore
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                : 'bg-sky-500/20 border border-sky-500/40 text-sky-400'
            }`}
          >
            {isCore ? <Shield className="w-6 h-6" /> : <Boxes className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
                {isCore ? 'CORE SYSTEM' : `mod: ${pkg.manifest.id}`}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Namespace padrão de conteúdo: <code className="text-zinc-200 font-mono font-semibold">{pkg.manifest.id}:</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
              <Check className="w-4 h-4" /> Salvo com sucesso!
            </span>
          )}
          <Button variant="primary" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Salvar Mod Manifest
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Manifest Configuration Grid */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <FileCode className="w-4 h-4 text-amber-400" />
          Metadados do Pacote (mod.json)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Nome de Exibição
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome legível do mod"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              ID / Namespace (Imutável)
            </label>
            <Input
              value={pkg.manifest.id}
              disabled
              className="w-full font-mono bg-zinc-950 text-zinc-400 cursor-not-allowed border-zinc-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Versão (SemVer)
            </label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="w-full font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Autor / Desenvolvedor
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome ou equipe"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Descrição Geral
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-xs"
            placeholder="Descreva o propósito deste pacote e suas adições..."
          />
        </div>
      </div>

      {/* Dependencies Section */}
      {!isCore && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <GitFork className="w-4 h-4 text-sky-400" />
              Dependências do Pacote
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              {Object.keys(dependencies).length} dependência(s)
            </span>
          </div>

          <div className="space-y-2">
            {Object.entries(dependencies).map(([depId, depVer]) => (
              <div
                key={depId}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-300">{depId}</span>
                  <span className="font-mono text-zinc-400 text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {depVer}
                  </span>
                  {depId === 'core' && (
                    <span className="text-[10px] text-zinc-500">(Obrigatório)</span>
                  )}
                </div>

                {depId !== 'core' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveDependency(depId)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}

            {/* Add Dependency row */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Input
                value={newDepId}
                onChange={(e) => setNewDepId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="ID do mod (ex: nature_mod)"
                className="flex-1 font-mono text-xs"
              />
              <Input
                value={newDepVer}
                onChange={(e) => setNewDepVer(e.target.value)}
                placeholder=">=1.0.0"
                className="w-32 font-mono text-xs"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddDependency}
                icon={<Plus className="w-4 h-4" />}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Package Content Statistics */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Conteúdo Registrado no Pacote
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <span className="text-xl font-bold text-amber-400 font-mono">
              {pkg.content.blocks?.length || 0}
            </span>
            <div className="text-[11px] text-zinc-400 mt-1">Blocos</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <span className="text-xl font-bold text-sky-400 font-mono">
              {pkg.content.items?.length || 0}
            </span>
            <div className="text-[11px] text-zinc-400 mt-1">Itens</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {pkg.content.entities?.length || 0}
            </span>
            <div className="text-[11px] text-zinc-400 mt-1">Entidades</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <span className="text-xl font-bold text-purple-400 font-mono">
              {pkg.content.biomes?.length || 0}
            </span>
            <div className="text-[11px] text-zinc-400 mt-1">Biomas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
