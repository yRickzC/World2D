import { BiomeComponentSerializedData, IBiomeComponent } from './BiomeComponent';

export interface ScatterEntry {
  id: string;
  name?: string;
  density: number; // e.g. 0.04 (4% of tiles)
  chance?: number;
  scale?: {
    min: number;
    max: number;
  };
  rotation?: {
    random: boolean;
  };
  allowedGroundTags?: string[];
  conditions?: Record<string, any>;
}

export interface ScatterComponentData {
  entries: ScatterEntry[];
}

export class ScatterComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Scatter';
  public data: ScatterComponentData;

  constructor(id: string = 'scatter', initialData?: Partial<ScatterComponentData>) {
    this.id = id;
    this.data = {
      entries: initialData?.entries ?? [
        {
          id: 'rock',
          name: 'Pequena Rocha',
          density: 0.04,
          scale: { min: 0.8, max: 1.2 },
          rotation: { random: true },
          allowedGroundTags: ['solid', 'ground'],
        },
        {
          id: 'flower',
          name: 'Flor Silvestre',
          density: 0.02,
          scale: { min: 0.9, max: 1.1 },
          rotation: { random: false },
          allowedGroundTags: ['ground'],
        },
      ],
    };
  }

  get entries(): ScatterEntry[] {
    return this.data.entries;
  }

  set entries(value: ScatterEntry[]) {
    this.data.entries = value;
  }

  addEntry(entry: ScatterEntry): void {
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

  clone(): ScatterComponent {
    return new ScatterComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
