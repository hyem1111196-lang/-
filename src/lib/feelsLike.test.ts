import { describe, it, expect } from "vitest";
import {
  summerFeelsLike,
  winterFeelsLike,
  wetBulbStull,
  computeFeelsLike,
} from "./feelsLike";

/**
 * 기상청 공식 여름철 체감온도 표(MATRIX_DB) 일부 — 원본 서비스에서 확보.
 * [기온, 습도, 표값(°C)]. 공식 산식과 ±1.5°C 이내로 일치해야 한다.
 */
const KMA_TABLE: Array<[number, number, number]> = [
  [25, 50, 24.6],
  [30, 50, 29.5],
  [33, 55, 33.0],
  [35, 60, 35.5],
  [38, 70, 39.5],
  [40, 100, 44.1],
];

describe("summerFeelsLike — 기상청 여름 공식", () => {
  it("KMA 공식 표와 ±1.5°C 이내로 일치", () => {
    for (const [t, rh, expected] of KMA_TABLE) {
      const got = summerFeelsLike(t, rh);
      expect(Math.abs(got - expected)).toBeLessThan(1.5);
    }
  });

  it("습도가 높을수록 체감온도가 올라간다 (단조성)", () => {
    const low = summerFeelsLike(33, 40);
    const high = summerFeelsLike(33, 80);
    expect(high).toBeGreaterThan(low);
  });

  it("습도 경계값을 클램프한다 (음수/100 초과 무발산)", () => {
    expect(Number.isFinite(summerFeelsLike(30, -5))).toBe(true);
    expect(Number.isFinite(summerFeelsLike(30, 130))).toBe(true);
  });
});

describe("wetBulbStull — 습구온도", () => {
  it("습구온도는 기온보다 높지 않다 (포화 제외)", () => {
    expect(wetBulbStull(30, 50)).toBeLessThanOrEqual(30 + 0.5);
  });
});

describe("winterFeelsLike — 겨울 풍속 체감온도", () => {
  it("T=-10°C, 풍속 8.33m/s(≈30km/h) → 약 -19.5°C", () => {
    const got = winterFeelsLike(-10, 8.333);
    expect(Math.abs(got - -19.5)).toBeLessThan(1.0);
  });

  it("바람이 강할수록 더 춥게 느껴진다", () => {
    const calm = winterFeelsLike(-5, 2);
    const windy = winterFeelsLike(-5, 10);
    expect(windy).toBeLessThan(calm);
  });

  it("약풍/따뜻한 조건에서는 기온을 그대로 반환", () => {
    expect(winterFeelsLike(-3, 0.5)).toBe(-3); // 풍속 임계 미만
    expect(winterFeelsLike(15, 10)).toBe(15); // 기온 10°C 초과
  });
});

describe("computeFeelsLike — 모델 선택", () => {
  it("summer 모델은 습도, winter 모델은 풍속을 사용", () => {
    const summer = computeFeelsLike({ tempC: 33, humidityPct: 70 }, "summer");
    const winter = computeFeelsLike({ tempC: -8, humidityPct: 50, windMs: 9 }, "winter");
    expect(summer).toBeGreaterThan(33);
    expect(winter).toBeLessThan(-8);
  });
});
