export interface BiomeComponentSerializedData {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface IBiomeComponent {
  readonly id: string;
  readonly type: string;
  clone(): IBiomeComponent;
  toJSON(): BiomeComponentSerializedData;
}
