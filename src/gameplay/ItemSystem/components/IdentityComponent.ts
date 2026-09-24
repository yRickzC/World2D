import { BaseComponent } from './BaseComponent';

export interface IdentityComponentConfig {
  id?: string;
  displayName: string;
  description?: string;
  icon?: string;
}

export class IdentityComponent extends BaseComponent {
  readonly type = 'IdentityComponent';
  readonly priority = 90;
  readonly isDynamic = false;

  readonly displayName: string;
  readonly description: string;
  readonly icon: string;

  constructor(config: IdentityComponentConfig) {
    super(config.id || 'identity_01');
    this.displayName = config.displayName || 'Novo Item';
    this.description = config.description || '';
    this.icon = config.icon || '';
  }

  toJSON(): Record<string, any> {
    return {
      displayName: this.displayName,
      description: this.description,
      icon: this.icon,
    };
  }
}
