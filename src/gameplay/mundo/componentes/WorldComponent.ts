export interface WorldComponentSerializedData {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface IWorldComponent {
  readonly id: string;
  readonly type: string;
  clone(): IWorldComponent;
  toJSON(): WorldComponentSerializedData;
}
