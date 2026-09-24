import { BiomeComponentSerializedData, IBiomeComponent } from './BiomeComponent';

export interface FogComponentData {
  enabled: boolean;
  density: number; // 0.0 to 1.0 (e.g. 0.35)
  color?: string; // hex color or rgba
  conditions?: Record<string, any>;
}

export class FogComponent implements IBiomeComponent {
  readonly id: string;
  readonly type = 'Fog';
  public data: FogComponentData;

  constructor(id: string = 'fog', initialData?: Partial<FogComponentData>) {
    this.id = id;
    this.data = {
      enabled: initialData?.enabled ?? true,
      density: initialData?.density ?? 0.25,
      color: initialData?.color ?? '#cbd5e1',
      conditions: initialData?.conditions ? { ...initialData.conditions } : undefined,
    };
  }

  get enabled(): boolean {
    return this.data.enabled;
  }
  set enabled(v: boolean) {
    this.data.enabled = v;
  }

  get density(): number {
    return this.data.density;
  }
  set density(v: number) {
    this.data.density = Math.max(0, Math.min(1, v));
  }

  get color(): string {
    return this.data.color || '#cbd5e1';
  }
  set color(v: string) {
    this.data.color = v;
  }

  clone(): FogComponent {
    return new FogComponent(this.id, JSON.parse(JSON.stringify(this.data)));
  }

  toJSON(): BiomeComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: JSON.parse(JSON.stringify(this.data)),
    };
  }
}
