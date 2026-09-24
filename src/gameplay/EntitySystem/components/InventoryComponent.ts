import { BaseEntityComponent } from './BaseEntityComponent';

export interface InventoryComponentData {
  capacity: number;
  dropOnDeath: boolean;
}

export class InventoryComponent extends BaseEntityComponent {
  static readonly type = 'InventoryComponent';
  readonly type = 'InventoryComponent';

  capacity: number;
  dropOnDeath: boolean;

  constructor(data?: Partial<InventoryComponentData>, id?: string) {
    super(id, 70, true);
    this.capacity = Math.max(1, data?.capacity ?? 16);
    this.dropOnDeath = data?.dropOnDeath !== undefined ? Boolean(data.dropOnDeath) : true;
  }

  get data(): Record<string, any> {
    return {
      capacity: this.capacity,
      dropOnDeath: this.dropOnDeath,
    };
  }
}
