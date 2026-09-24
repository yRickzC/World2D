import { BaseBlockComponent } from './BaseBlockComponent';
import { BlockInstance } from '../BlockInstance';
import { BlockComponentSchemaDefinition } from '../types';

export interface DynamicBlockConfig {
  id?: string;
  tickRate?: number; // Ticks per second (e.g. 1 = every 1s, 20 = every frame)
  maxState?: number;
  initialState?: Record<string, any>;
  interactable?: boolean;
}

export class DynamicBlockComponent extends BaseBlockComponent {
  static readonly type = 'DynamicBlockComponent';
  readonly type = 'DynamicBlockComponent';

  static readonly schema: BlockComponentSchemaDefinition = {
    type: 'DynamicBlockComponent',
    name: 'DynamicBlockComponent',
    version: '1.0.0',
    description: 'Permite atualização dinâmica em tempo de execução (ticks periódicos, crescimento, interação e estados mutáveis).',
    isDynamic: true,
    isSingleton: true,
    properties: {
      tickRate: {
        label: 'Taxa de Ticks (por segundo)',
        type: 'number',
        required: false,
        default: 1,
        min: 0.1,
        max: 60,
        step: 0.5,
        description: 'Frequência com que o bloco executa sua rotina de atualização lógica.',
        editor: { widget: 'number' },
      },
      maxState: {
        label: 'Estado Máximo',
        type: 'number',
        required: false,
        min: 1,
        max: 100,
        description: 'Número de estágios (ex: 4 estágios de crescimento para plantas).',
        editor: { widget: 'number' },
      },
      interactable: {
        label: 'Interativo com Jogador',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Permite que o jogador alterne ou interaja diretamente com o estado deste bloco.',
        editor: { widget: 'checkbox' },
      },
    },
    runtime: {
      priority: 25,
      hooks: ['onTick', 'onInteract'],
    },
    editor: {
      category: 'Lógica',
      icon: 'activity',
    },
  };

  override readonly isDynamic = true;
  readonly tickRate: number;
  readonly maxState?: number;
  readonly defaultInitialState: Record<string, any>;
  readonly interactable: boolean;

  constructor(config: DynamicBlockConfig) {
    super(config.id || 'dynamic_01');
    this.tickRate = config.tickRate ?? 1;
    this.maxState = config.maxState;
    this.defaultInitialState = config.initialState || {};
    this.interactable = config.interactable ?? true;
  }

  override getInitialDynamicState(): Record<string, any> {
    return {
      progress: 0,
      state: 0,
      lastTick: Date.now(),
      ...this.defaultInitialState,
    };
  }

  override onTick(instance: BlockInstance, dt: number): void {
    const state = instance.state;
    state.progress = (state.progress || 0) + dt;
  }

  override onInteract(instance: BlockInstance, _interactor: any): boolean {
    if (!this.interactable) return false;
    const state = instance.state;
    state.state = ((state.state || 0) + 1) % (this.maxState || 2);
    return true;
  }

  toJSON(): Record<string, any> {
    return {
      tickRate: this.tickRate,
      maxState: this.maxState,
      initialState: this.defaultInitialState,
      interactable: this.interactable,
    };
  }
}
