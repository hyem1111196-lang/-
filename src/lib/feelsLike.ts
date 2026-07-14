/**
 * 체감온도(體感溫度, apparent temperature) 계산 엔진.
 *
 * 체감온도 = 실제 기온에 습도(여름)·바람(겨울)을 반영해 "사람이 실제로 느끼는 온도".
 * 본 모듈은 기상청(KMA) 공식 산식을 그대로 구현한다. 안전 판정의 근거가 되므로
 * 임의 근사 없이 공식 계수를 사용하고, feelsLike.test.ts 에서 KMA 공식 표와 교차검증한다.
 */

/** 입력 기상값 */
export interface WeatherInput {
  /** 기온 (°C) */
  tempC: number;
  /** 상대습도 (%) — 여름 체감온도에 사용 */
  humidityPct: number;
  /** 풍속 (m/s) — 겨울 체감온도에 사용. 없으면 0 으로 간주 */
  windMs?: number;
}

/**
 * 습구온도(濕球溫度, wet-bulb temperature) — Stull(2011) 근사식.
 * 습구온도는 "공기를 물로 적셔 증발로 식혔을 때 도달하는 온도"로, 습할수록 기온에 가깝다.
 * 기상청 여름철 체감온도가 이 습구온도를 입력으로 쓴다.
 *
 * @param tempC 기온 °C
 * @param humidityPct 상대습도 % (0~100)
 */
export function wetBulbStull(tempC: number, humidityPct: number): number {
  const t = tempC;
  const rh = clampHumidity(humidityPct);
  return (
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.67633) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  );
}

/**
 * 여름철 체감온도 (기상청 2022 개정 공식).
 * Tw(습구온도)와 기온의 다항식. 일반적으로 5~9월, 기온이 높은 조건에서 사용한다.
 *
 * @returns 체감온도 °C (소수 그대로; 표시 시 반올림)
 */
export function summerFeelsLike(tempC: number, humidityPct: number): number {
  const tw = wetBulbStull(tempC, humidityPct);
  const t = tempC;
  return (
    -0.2442 +
    0.55399 * tw +
    0.45535 * t -
    0.0022 * tw * tw +
    0.00278 * tw * t +
    3.0
  );
}

/** 겨울 체감온도 적용 최소 풍속 (m/s). 약 4.8km/h 미만 바람에서는 풍속 효과를 무시한다. */
export const WIND_CHILL_MIN_MS = 1.34; // ≈ 4.8 km/h

/**
 * 겨울철 체감온도 (기상청 풍속 기반 wind chill 공식).
 * 체감온도 = 13.12 + 0.6215·T − 11.37·V^0.16 + 0.3965·V^0.16·T  (V = 풍속 km/h)
 * 기온 10°C 이하 + 유효 풍속에서 의미가 있으며, 그 외에는 기온을 그대로 돌려준다.
 *
 * @param tempC 기온 °C
 * @param windMs 풍속 m/s
 */
export function winterFeelsLike(tempC: number, windMs: number): number {
  const t = tempC;
  if (!Number.isFinite(windMs) || windMs < WIND_CHILL_MIN_MS || t > 10) {
    return t;
  }
  const v = windMs * 3.6; // m/s → km/h
  const vp = Math.pow(v, 0.16);
  return 13.12 + 0.6215 * t - 11.37 * vp + 0.3965 * vp * t;
}

/** 계산에 사용할 모델 종류 */
export type FeelsLikeModel = "summer" | "winter";

/**
 * 계절 모델에 맞춰 체감온도를 계산한다.
 * - summer: 습도 기반 (더위)
 * - winter: 풍속 기반 (추위)
 */
export function computeFeelsLike(input: WeatherInput, model: FeelsLikeModel): number {
  if (model === "winter") {
    return winterFeelsLike(input.tempC, input.windMs ?? 0);
  }
  return summerFeelsLike(input.tempC, input.humidityPct);
}

function clampHumidity(rh: number): number {
  if (!Number.isFinite(rh)) return 0;
  if (rh < 0) return 0;
  if (rh > 100) return 100;
  return rh;
}
