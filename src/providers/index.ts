/**
 * 기상 제공자 합성 — 기상청 프록시를 우선 시도하고, 실패하면 Mock 으로 폴백한다.
 * 이렇게 하면 키가 없거나(데모) 네트워크가 끊겨도(현장) 앱이 항상 동작한다.
 */
import { createKmaProvider } from "./kmaProvider";
import { createMockProvider } from "./mockProvider";
import type { HourlyPoint, WeatherNow, WeatherProvider } from "./types";
import type { WarningStatus } from "../lib/warnings";

export type { WeatherNow, HourlyPoint, WeatherProvider } from "./types";

export function createWeatherProvider(): WeatherProvider {
  const kma = createKmaProvider();
  const mock = createMockProvider();

  return {
    async getNow(lat, lon): Promise<WeatherNow> {
      try {
        return await kma.getNow(lat, lon);
      } catch {
        return mock.getNow(lat, lon);
      }
    },
    async getHourly(lat, lon): Promise<HourlyPoint[]> {
      try {
        return await kma.getHourly(lat, lon);
      } catch {
        return mock.getHourly(lat, lon);
      }
    },
    async getUltraHourly(lat, lon): Promise<HourlyPoint[]> {
      try {
        return await kma.getUltraHourly(lat, lon);
      } catch {
        return mock.getUltraHourly(lat, lon);
      }
    },
    async getWarnings(): Promise<WarningStatus> {
      // 특보 조회 실패는 '특보 정보 없음'으로 처리 — 기온·체감온도 기준 판정은 그대로 동작한다.
      try {
        return await kma.getWarnings();
      } catch {
        return mock.getWarnings();
      }
    },
  };
}
