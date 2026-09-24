import { BaseEntityComponent } from './BaseEntityComponent';

export interface NameComponentData {
  name: string;
}

export class NameComponent extends BaseEntityComponent {
  static readonly type = 'NameComponent';
  readonly type = 'NameComponent';

  name: string;

  constructor(data?: Partial<NameComponentData>, id?: string) {
    super(id, 10, true);
    this.name = data?.name ?? 'Entidade';
  }

  get data(): Record<string, any> {
    return {
      name: this.name,
    };
  }
}
