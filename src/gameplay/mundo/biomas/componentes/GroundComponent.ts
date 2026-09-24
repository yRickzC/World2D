import { BiomeComponentSerializedData, IBiomeComponent } from './BiomeComponent';

export interface LayerComponent {
  type: string;
  enabled?: boolean;
  [key: string]: any;
}

export interface GroundLayer {
  block: string;
  depth: number;
  components?: LayerComponent[];
}

export interface GroundCondition {
  humidity?: { min?: number; max?: number };
  temperature?: { min?: number; max?: number };
  elevation?: { min?: number; max?: number };
  terrain?: string;
}

export interface GroundDefinition {
  id: string;
  name: string;
  weight: number; // e.g. 70, 20, 10
  layers: GroundLayer[];
  conditions?: GroundCondition;
}

export interface GroundComponentData {
  grounds: GroundDefinition[];
}

export class GroundComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Ground';
  public data: GroundComponentData;

  constructor(id: string = 'ground', initialData?: Partial<GroundComponentData>) {
    this.id = id;
    this.data = {
      grounds: initialData?.grounds ?? [
        {
          id: 'grass_ground',
          name: 'Grass Ground',
          weight: 70,
          layers: [
            {
              block: 'grass',
              depth: 1,
              components: [{ type: 'SolidLayer', enabled: true }],
            },
            {
              block: 'dirt',
              depth: 3,
              components: [{ type: 'SolidLayer', enabled: true }],
            },
            {
              block: 'stone',
              depth: 20,
              components: [{ type: 'SolidLayer', enabled: true }],
            },
          ],
        },
      ],
    };
  }

  get grounds(): GroundDefinition[] {
    return this.data.grounds;
  }

  set grounds(value: GroundDefinition[]) {
    this.data.grounds = value;
  }

  addGround(ground: GroundDefinition): void {
    this.data.grounds.push(ground);
  }

  removeGround(id: string): boolean {
    const idx = this.data.grounds.findIndex((g) => g.id === id);
    if (idx !== -1) {
      this.data.grounds.splice(idx, 1);
      return true;
    }
    return false;
  }

  getPrimaryGround(): GroundDefinition | undefined {
    return this.data.grounds[0];
  }

  clone(): GroundComponent {
    return new GroundComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
