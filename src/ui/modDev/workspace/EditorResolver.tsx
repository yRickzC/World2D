import React, { useState } from 'react';
import { AlertCircle, Code, FileCode, Save } from 'lucide-react';
import { Button } from '../../components/Button';
import { VirtualFileNode } from './types';
import { BlockEditor } from './BlockEditor';

export interface EditorResolverProps {
  node: VirtualFileNode;
  onSave: (fileId: string, updatedData: any) => void;
}

export const EditorResolver: React.FC<EditorResolverProps> = ({ node, onSave }) => {
  // 1. Specialized Block Editor
  if (node.contentType === 'block' && node.data) {
    return (
      <BlockEditor
        key={node.id}
        initialData={node.data}
        isReadOnly={node.isReadOnly}
        onSave={(updatedData) => onSave(node.id, updatedData)}
      />
    );
  }

  // 2. Generic / Fallback Data Editor for other registered content types
  return <FallbackJsonEditor node={node} onSave={onSave} />;
};

const FallbackJsonEditor: React.FC<{
  node: VirtualFileNode;
  onSave: (fileId: string, updatedData: any) => void;
}> = ({ node, onSave }) => {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(node.data || {}, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setError(null);
      onSave(node.id, parsed);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      setError(`Erro de sintaxe JSON: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden text-zinc-100">
      <div className="h-11 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-white">{node.name}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {node.contentType || 'JSON'}
          </span>
        </div>

        {!node.isReadOnly && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            icon={<Save className="w-3.5 h-3.5" />}
            className="text-xs py-1"
          >
            {isSaved ? 'Salvo!' : 'Salvar Arquivo'}
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <textarea
          disabled={node.isReadOnly}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setError(null);
          }}
          className="flex-1 w-full p-4 bg-zinc-900/80 font-mono text-xs text-amber-300/90 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
        />

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
