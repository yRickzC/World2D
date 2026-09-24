import { AlertCircle, CheckCircle2, Play, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import {
  globalSchemaRegistry,
  ItemValidationReport,
} from '../../../gameplay/ItemSystem/schemas/SchemaRegistry';

const SAMPLE_JSON = `{
  "id": "emerald_sword",
  "nome": "Espada de Esmeralda",
  "categoria": "weapon",
  "components": [
    {
      "id": "render_01",
      "type": "render",
      "data": {
        "renderer": "emoji",
        "value": "🗡️",
        "accentColor": "#10b981"
      }
    },
    {
      "id": "desc_01",
      "type": "description",
      "data": {
        "text": "Lâmina cristalina afiada esculpida em pura esmeralda.",
        "categoryName": "Arma Rara",
        "lore": "Forjada no coração de cavernas esquecidas."
      }
    },
    {
      "id": "durability_01",
      "type": "durability",
      "data": {
        "maxDurability": 350
      }
    },
    {
      "id": "weapon_01",
      "type": "weapon",
      "data": {
        "attackDamage": 14,
        "attackSpeed": 1.4,
        "range": 52
      }
    },
    {
      "id": "stack_01",
      "type": "stack",
      "data": {
        "maxStack": 1
      }
    }
  ]
}`;

export const JsonValidator: React.FC = () => {
  const [jsonText, setJsonText] = useState<string>(SAMPLE_JSON);
  const [report, setReport] = useState<ItemValidationReport | null>(null);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const handleValidate = () => {
    setSyntaxError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const res = globalSchemaRegistry.validateItem(parsed);
      setReport(res);
    } catch (err: any) {
      setSyntaxError(`Erro de sintaxe JSON: ${err.message}`);
      setReport(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
        <div>
          <h3 className="text-xs font-bold text-white">Validador de Definições JSON</h3>
          <p className="text-[11px] text-zinc-400">
            Cole um JSON de item ou mod para verificar conformidade com as regras do core e dependências de componentes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleValidate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold shadow transition-all hover:scale-105 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Validar Definição</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Input Textarea */}
        <div className="md:col-span-7 flex flex-col min-h-0">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Cole seu JSON de item aqui..."
            className="w-full flex-1 p-3.5 bg-zinc-950 font-mono text-xs text-zinc-100 border border-zinc-800 rounded-xl resize-none focus:outline-none focus:border-amber-400/80 leading-relaxed"
          />
        </div>

        {/* Validation Output */}
        <div className="md:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 overflow-y-auto flex flex-col gap-3">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Resultado da Análise
          </h4>

          {syntaxError && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{syntaxError}</span>
            </div>
          )}

          {report && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                report.valid
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/20 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {report.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Definição Válida</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Definição Inválida ({report.errors.length} erro(s))</span>
                  </>
                )}
              </div>

              {report.errors.map((err, i) => (
                <div key={i} className="pl-4 text-[11px] text-red-400 leading-tight">
                  • {err}
                </div>
              ))}

              {report.warnings.map((warn, i) => (
                <div key={i} className="pl-4 text-[11px] text-amber-400 leading-tight">
                  ⚠️ {warn}
                </div>
              ))}
            </div>
          )}

          {!syntaxError && !report && (
            <div className="text-xs text-zinc-500 italic p-4 text-center">
              Clique em &ldquo;Validar Definição&rdquo; para executar a checagem.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
