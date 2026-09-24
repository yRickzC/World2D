import { Copy, FileJson } from 'lucide-react';
import React, { useState } from 'react';
import { globalSchemaRegistry } from '../../../gameplay/ItemSystem/schemas/SchemaRegistry';

export const SchemaViewer: React.FC = () => {
  const schemas = globalSchemaRegistry.getAllSchemas();
  const [selectedType, setSelectedType] = useState<string>(schemas[0]?.type || 'render');
  const [copied, setCopied] = useState(false);

  const selectedSchema = globalSchemaRegistry.getSchema(selectedType);

  const handleCopy = () => {
    if (!selectedSchema) return;
    navigator.clipboard.writeText(JSON.stringify(selectedSchema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
      {/* Schema selector */}
      <div className="md:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2 overflow-y-auto">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider px-1">
          Schemas ({schemas.length})
        </h3>
        {schemas.map((s) => (
          <button
            key={s.type}
            type="button"
            onClick={() => setSelectedType(s.type)}
            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedType === s.type
                ? 'bg-amber-500/15 border-amber-500/50 text-white'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
            }`}
          >
            <span className="text-xs font-semibold">{s.name}</span>
            <span className="text-[10px] font-mono text-zinc-500">{s.type}_schema.json</span>
          </button>
        ))}
      </div>

      {/* Raw Schema JSON View */}
      <div className="md:col-span-8 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white font-mono">
              data/components/{selectedType}_component_schema.json
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copiado!' : 'Copiar Schema'}</span>
          </button>
        </div>

        <pre className="flex-1 p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs font-mono text-emerald-400 overflow-auto leading-relaxed select-all">
          {selectedSchema ? JSON.stringify(selectedSchema, null, 2) : '// Nenhum schema selecionado'}
        </pre>
      </div>
    </div>
  );
};
