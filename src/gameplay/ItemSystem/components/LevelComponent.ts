import { BaseComponent } from './BaseComponent';

export interface LevelComponentConfig {
  id?: string;
  currentLevel?: number;
  maxLevel?: number;
  experience?: number;
}

export class LevelComponent extends BaseComponent {
  readonly type = 'LevelComponent';
  readonly priority = 80;
  readonly isDynamic = true;

  readonly currentLevel: number;
  readonly maxLevel: number;
  readonly experience: number;

  constructor(config: LevelComponentConfig) {
    super(config.id || 'level_01');
    this.currentLevel = Math.max(1, config.currentLevel ?? 1);
    this.maxLevel = Math.max(this.currentLevel, config.maxLevel ?? 10);
    this.experience = Math.max(0, config.experience ?? 0);
  }

  getInitialDynamicState(): Record<string, any> {
    return {
      level: this.currentLevel,
      experience: this.experience,
    };
  }

  toJSON(): Record<string, any> {
    return {
      currentLevel: this.currentLevel,
      maxLevel: this.maxLevel,
      experience: this.experience,
    };
  }
}
