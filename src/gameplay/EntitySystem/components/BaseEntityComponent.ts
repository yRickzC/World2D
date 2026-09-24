import { EntityComponentSerializedData } from '../types';

export abstract class BaseEntityComponent {
  abstract readonly type: string;
  readonly id: string;
  readonly priority: number;
  readonly isSingleton: boolean;

  constructor(id?: string, priority: number = 50, isSingleton: boolean = true) {
    this.id = id || `${this.constructor.name}_${Math.random().toString(36).substring(2, 9)}`;
    this.priority = priority;
    this.isSingleton = isSingleton;
  }

  abstract get data(): Record<string, any>;

  toJSON(): EntityComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: { ...this.data },
    };
  }
}
