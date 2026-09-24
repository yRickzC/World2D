import { BiomeComponentSerializedData, IBiomeComponent } from './BiomeComponent';

export type PatchShape = 'noise' | 'circular' | 'irregular' | 'blob';

export interface PatchEntry {
  id: string;
  name?: string;
  target: string; // block id or object id (e.g. 'mud', 'sand', 'flowers', 'moss')
  targetType: 'block' | 'object';
  chance: number; // probability of a patch occurring (e.g. 0.15)
  size: {
    min: number; // e.g. 3
    max: number; // e.g. 8
  };
  shape: PatchShape;
  conditions?: Record<string, any>;
}

export interface PatchComponentData {
  entries: PatchEntry[];
}

export class PatchComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Patch';
  public data: PatchComponentData;

  constructor(id: string = 'patch', initialData?: Partial<PatchComponentData>) {
    this.id = id;
    this.data = {
      entries: initialData?.entries ?? [
        {
          id: 'mud_patch',
          name: 'Mancha de Lama',
          target: 'mud',
          targetType: 'block',
          chance: 0.12,
          size: { min: 3, max: 7 },
          shape: 'noise',
        },
      ],
    };
  }

  get entries(): PatchEntry[] {
    return this.data.entries;
  }

  set entries(value: PatchEntry[]) {
    this.data.entries = value;
  }

  addEntry(entry: PatchEntry): void {
    this.data.entries.push(entry);
  }

  removeEntry(id: string): boolean {
    const idx = this.data.entries.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.data.entries.splice(idx, 1);
      return true;
    }
    return false;
  }

  clone(): PatchComponent {
    return new PatchComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
