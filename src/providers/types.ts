export interface WeatherNow {
  tempC: number;
  humidityPct: number;
  windMs: number;
  rn1mm: number;
  pty: number;
  sky?: number;
  observedAt: Date;
  source: "kma" | "mock";
  grid?: { x: number; y: number };
  stale?: boolean;
}

export interface HourlyPoint {
  time: Date;
  tempC: number;
  humidityPct: number;
  windMs: number;
  pty: number;
  sky?: number;
  rn1mm: number;
}

export interface WeatherProvider {
  getNow(lat: number, lon: number): Promise<WeatherNow>;
  getHourly(lat: number, lon: number): Promise<HourlyPoint[]>;
}