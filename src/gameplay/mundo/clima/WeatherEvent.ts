import { WeatherEventJSON, WeatherCondition } from './WeatherTypes';

export class WeatherEvent {
  public id: string;
  public name: string;
  public enabled: boolean;
  public intensity: number; // target intensity (0.0 to 1.0)
  public currentIntensity: number; // smoothed active intensity
  public durationMin: number;
  public durationMax: number;
  public chance: number;
  public transitionDuration: number;
  public conditions: WeatherCondition[];
  public active: boolean = false;
  public timeRemaining: number = 0;
  public customParams: Record<string, any>;

  constructor(config: WeatherEventJSON) {
    this.id = config.id;
    this.name = config.name;
    this.enabled = config.enabled ?? true;
    this.intensity = config.intensity ?? 0.5;
    this.currentIntensity = 0.0;
    this.durationMin = config.durationMin ?? 30;
    this.durationMax = config.durationMax ?? 120;
    this.chance = config.chance ?? 0.2;
    this.transitionDuration = config.transitionDuration ?? 6.0;
    this.conditions = config.conditions ? [...config.conditions] : [];
    this.customParams = config.customParams ? { ...config.customParams } : {};
  }

  start(durationSeconds?: number, targetIntensity?: number): void {
    this.active = true;
    if (targetIntensity !== undefined) {
      this.intensity = Math.max(0, Math.min(1, targetIntensity));
    }
    const dur =
      durationSeconds ??
      this.durationMin + Math.random() * Math.max(1, this.durationMax - this.durationMin);
    this.timeRemaining = dur;
  }

  stop(): void {
    this.active = false;
    this.timeRemaining = 0;
  }

  update(deltaTime: number): void {
    if (this.active) {
      this.timeRemaining -= deltaTime;
      if (this.timeRemaining <= 0) {
        this.active = false;
      }
      // Lerp intensity towards target
      const step = deltaTime / Math.max(0.1, this.transitionDuration);
      this.currentIntensity = Math.min(this.intensity, this.currentIntensity + step);
    } else {
      // Fade out smoothly
      const step = deltaTime / Math.max(0.1, this.transitionDuration);
      this.currentIntensity = Math.max(0, this.currentIntensity - step);
    }
  }

  toJSON(): WeatherEventJSON {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      intensity: this.intensity,
      durationMin: this.durationMin,
      durationMax: this.durationMax,
      chance: this.chance,
      transitionDuration: this.transitionDuration,
      conditions: [...this.conditions],
      customParams: { ...this.customParams },
    };
  }
}
