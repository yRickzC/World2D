import React, { useState } from 'react';
import {
  Boxes,
  Check,
  Code2,
  Copy,
  FileCode,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ModPackage } from '../../mods';

export interface ComponentsTabProps {
  pkg: ModPackage;
}

interface ComponentDoc {
  id: string;
  name: string;
  domain: 'block' | 'item' | 'entity' | 'biome' | 'world';
  description: string;
  schemaExample: any;
}

const CORE_COMPONENT_CATALOG: ComponentDoc[] = [
  {
    id: 'ColorTextureComponent',
    name: 'Color Texture',
    domain: 'block',
    description: 'Renderiza cor sólida ou paleta procedural (pixels, borders, noise) na face do bloco.',
    schemaExample: {
      type: 'ColorTextureComponent',
      data: { primaryColor: '#3b82f6', secondaryColor: '#1d4ed8', pattern: 'noise' },
    },
  },
  {
    id: 'TopTextureComponent',
    name: 'Top Texture',
    domain: 'block',
    description: 'Textura e cor da face superior para visão isométrica/top-down 2D.',
    schemaExample: {
      type: 'TopTextureComponent',
      data: { color: '#60a5fa', bevel: true },
    },
  },
  {
    id: 'EmojiIconComponent',
    name: 'Emoji Icon',
    domain: 'block',
    description: 'Exibição de glifo/emoji centralizado quando em miniatura ou fallback visual.',
    schemaExample: {
      type: 'EmojiIconComponent',
      data: { emoji: '💎' },
    },
  },
  {
    id: 'SolidComponent',
    name: 'Solid Physics',
    domain: 'block',
    description: 'Habilita colisão sólida contra entidades e projéteis.',
    schemaExample: {
      type: 'SolidComponent',
      data: { solid: true },
    },
  },
  {
    id: 'BreakableComponent',
    name: 'Breakable & Drops',
    domain: 'block',
    description: 'Resistência de mineração, ferramenta necessária e itens soltos (drops) ao quebrar.',
    schemaExample: {
      type: 'BreakableComponent',
      data: {
        hardness: 3,
        requiredTool: 'pickaxe',
        dropItems: [{ type: 'core:stone', count: 1 }],
      },
    },
  },
  {
    id: 'LightEmitterComponent',
    name: 'Light Emitter',
    domain: 'block',
    description: 'Emite iluminação dinâmica radial no mundo e afeta o ciclo noite/dia.',
    schemaExample: {
      type: 'LightEmitterComponent',
      data: { radius: 5, color: '#f59e0b', intensity: 0.8 },
    },
  },
  {
    id: 'ToolComponent',
    name: 'Tool Power',
    domain: 'item',
    description: 'Capacidade e velocidade de mineração de blocos por categoria (pickaxe, axe, shovel).',
    schemaExample: {
      tipo: 'tool',
      dados: { tipoFerramenta: 'pickaxe', forca: 25, velocidadeQuebra: 2.0 },
    },
  },
  {
    id: 'WeaponComponent',
    name: 'Weapon Combat',
    domain: 'item',
    description: 'Dano físico/mágico em combate corpo a corpo, knockback e alcance.',
    schemaExample: {
      tipo: 'weapon',
      dados: { dano: 30, tipoDano: 'magico', alcance: 2.5, velocidadeAtaque: 1.2 },
    },
  },
  {
    id: 'FoodComponent',
    name: 'Food & Nutrition',
    domain: 'item',
    description: 'Consumível para recuperar vida e pontos de energia.',
    schemaExample: {
      tipo: 'food',
      dados: { nutricao: 20, vidaRestaurada: 15, tempoConsumo: 1.5 },
    },
  },
  {
    id: 'HealthComponent',
    name: 'Entity Health',
    domain: 'entity',
    description: 'Pontos de vida máximos e atuais, invulnerabilidade temporária e regeneração.',
    schemaExample: {
      id: 'health',
      type: 'HealthComponent',
      data: { maxHealth: 100, currentHealth: 100, invulnerable: false },
    },
  },
  {
    id: 'MovementComponent',
    name: 'Entity Movement',
    domain: 'entity',
    description: 'Velocidade de locomoção, voo, gravidade e natação.',
    schemaExample: {
      id: 'movement',
      type: 'MovementComponent',
      data: { speed: 3.8, canFly: false, canSwim: true },
    },
  },
  {
    id: 'StyleComponent',
    name: 'Entity Style',
    domain: 'entity',
    description: 'Representação visual da entidade (emoji, sprite, dimensões e escala).',
    schemaExample: {
      id: 'style',
      type: 'StyleComponent',
      data: { mode: 'emoji', value: '🧚', size: 40, scale: 1.0 },
    },
  },
  {
    id: 'BiomeBlocksComponent',
    name: 'Biome Ground Layers',
    domain: 'biome',
    description: 'Estruturação geológica: bloco de superfície, solo intermediário e rocha profunda.',
    schemaExample: {
      type: 'BiomeBlocksComponent',
      data: {
        surface: { block: 'core:grass', depth: 1 },
        soil: { block: 'core:dirt', depth: 3 },
        underground: { block: 'core:stone' },
      },
    },
  },
  {
    id: 'BiomeVegetationComponent',
    name: 'Biome Vegetation & Scatter',
    domain: 'biome',
    description: 'Spawners procedurais de árvores, arbustos, flores e formações minerais.',
    schemaExample: {
      type: 'BiomeVegetationComponent',
      data: {
        density: 0.15,
        elements: [{ block: 'core:wood', frequency: 0.8 }],
      },
    },
  },
  {
    id: 'BiomeClimateOverrideComponent',
    name: 'Climate Override',
    domain: 'biome',
    description: 'Override meteorológico regional: chuva intensa, neblina, calor árido ou neve.',
    schemaExample: {
      type: 'BiomeClimateOverrideComponent',
      data: { rainIntensity: 0.8, fogDensity: 0.4, temperatureModifier: -5 },
    },
  },
];

export const ComponentsTab: React.FC<ComponentsTabProps> = ({ pkg }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = CORE_COMPONENT_CATALOG.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDomain = selectedDomain === 'all' || c.domain === selectedDomain;
    return matchSearch && matchDomain;
  });

  const handleCopyJSON = (comp: ComponentDoc) => {
    navigator.clipboard.writeText(JSON.stringify(comp.schemaExample, null, 2));
    setCopiedId(comp.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Catálogo de Componentes Core & Mod</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ECS Arquitetura Aberta
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Componentes são blocos de construção reutilizáveis. Qualquer mod pode utilizar, combinar e configurar estes componentes.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar componentes por nome, domínio ou palavra-chave..."
            className="w-full pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'block', 'item', 'entity', 'biome'].map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => setSelectedDomain(domain)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                selectedDomain === domain
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {domain === 'all' ? 'Todos' : domain}
            </button>
          ))}
        </div>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((comp) => (
          <div
            key={comp.id}
            className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white">{comp.name}</h4>
                  <code className="text-[11px] font-mono text-amber-400">{comp.id}</code>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-sky-400 border border-zinc-700">
                  {comp.domain}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{comp.description}</p>
            </div>

            {/* Schema Preview & Copy */}
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> Exemplo JSON
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyJSON(comp)}
                  icon={
                    copiedId === comp.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedId === comp.id ? 'Copiado!' : 'Copiar JSON'}
                </Button>
              </div>

              <pre className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-28">
                {JSON.stringify(comp.schemaExample, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
