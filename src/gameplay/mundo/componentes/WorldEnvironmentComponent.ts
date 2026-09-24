import { IWorldComponent, WorldComponentSerializedData } from './WorldComponent';

export interface WorldEnvironmentData {
  dayLengthMinutes: number;
  initialTimeHour: number;
  skyLightMax: number;
  skyLightMin: number;
  ambientColorDay: string;
  ambientColorNight: string;
  enablePvP: boolean;
  enableMobSpawning: boolean;
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
}

export class WorldEnvironmentComponent implements IWorldComponent {
  readonly id: string;
  readonly type = 'WorldEnvironmentComponent';
  public data: WorldEnvironmentData;

  constructor(id: string = 'world_env', data?: Partial<WorldEnvironmentData>) {
    this.id = id;
    this.data = {
      dayLengthMinutes: data?.dayLengthMinutes ?? 20,
      initialTimeHour: data?.initialTimeHour ?? 8.0,
      skyLightMax: data?.skyLightMax ?? 1.0,
      skyLightMin: data?.skyLightMin ?? 0.1,
      ambientColorDay: data?.ambientColorDay ?? '#ffffff',
      ambientColorNight: data?.ambientColorNight ?? '#080e1e',
      enablePvP: data?.enablePvP ?? false,
      enableMobSpawning: data?.enableMobSpawning ?? true,
      difficulty: data?.difficulty ?? 'normal',
    };
  }

  clone(): WorldEnvironmentComponent {
    return new WorldEnvironmentComponent(this.id, { ...this.data });
  }

  toJSON(): WorldComponentSerializedData {
    return {
      id: this.id,
      type: this.type,
      data: { ...this.data },
    };
  }
}
