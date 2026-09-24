import { BaseEntityComponent } from './BaseEntityComponent';

export type StyleMode = 'emoji' | 'svg' | 'color';

export interface StyleComponentData {
  mode: StyleMode;
  value: string;
  size?: number;
  scale?: number;
  tint?: string;
}

export class StyleComponent extends BaseEntityComponent {
  static readonly type = 'StyleComponent';
  readonly type = 'StyleComponent';

  mode: StyleMode;
  value: string;
  size: number;
  scale: number;
  tint?: string;

  constructor(data?: Partial<StyleComponentData>, id?: string) {
    super(id, 40, true);
    this.mode = data?.mode ?? 'emoji';
    this.value = data?.value ?? '👾';
    this.size = data?.size ?? 40;
    this.scale = data?.scale ?? 1.0;
    this.tint = data?.tint;
  }

  get data(): Record<string, any> {
    return {
      mode: this.mode,
      value: this.value,
      size: this.size,
      scale: this.scale,
      ...(this.tint ? { tint: this.tint } : {}),
    };
  }
}
