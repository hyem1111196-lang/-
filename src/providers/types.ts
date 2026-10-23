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
  source: "kma" | "mock";
}

import type { WarningStatus } from "../lib/warnings";

export interface WeatherProvider {
  getNow(lat: number, lon: number): Promise<WeatherNow>;
  getHourly(lat: number, lon: number): Promise<HourlyPoint[]>;
  /** 초단기예보(앞으로 6시간, 1시간마다 갱신) — 예보 그래프용 */
  getUltraHourly(lat: number, lon: number): Promise<HourlyPoint[]>;
  /** 기상청 기상특보 발효 현황(전국) — 한파·폭염 특보 연동용. 위치 대조는 호출 측에서. */
  getWarnings(): Promise<WarningStatus>;
}