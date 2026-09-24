import { BaseComponent } from './BaseComponent';

export type ToolType = 'pickaxe' | 'axe' | 'shovel' | 'hoe' | string;

export interface ToolComponentConfig {
  id?: string;
  toolType?: ToolType;
  miningLevel?: number;
  harvestSpeed?: number;
  strength?: number;
  damage?: number;
  speed?: number;
  effectiveTags?: string[];
}

export class ToolComponent extends BaseComponent {
  readonly type = 'ToolComponent';
  readonly priority = 50;
  readonly isDynamic = false;

  readonly toolType: ToolType;
  readonly miningLevel: number;
  readonly harvestSpeed: number;
  readonly strength: number;
  readonly damage: number;
  readonly speed: number;
  readonly effectiveTags: string[];

  constructor(config: ToolComponentConfig) {
    super(config.id || 'tool_01');
    this.toolType = config.toolType || 'pickaxe';
    this.miningLevel = Math.max(1, config.miningLevel ?? config.strength ?? 1);
    this.harvestSpeed = Math.max(0.1, config.harvestSpeed ?? config.speed ?? 1.0);
    this.strength = this.miningLevel;
    this.damage = config.damage ?? 1;
    this.speed = this.harvestSpeed;
    this.effectiveTags = config.effectiveTags ?? [];
  }

  toJSON(): Record<string, any> {
    return {
      toolType: this.toolType,
      miningLevel: this.miningLevel,
      harvestSpeed: this.harvestSpeed,
      strength: this.strength,
      damage: this.damage,
      speed: this.speed,
      effectiveTags: this.effectiveTags,
    };
  }
}
