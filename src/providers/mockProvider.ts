import type { HourlyPoint, WeatherNow, WeatherProvider } from "./types";

// 실시간 연결 실패 시 폴백용 근사값 제공자.
// (체험/데모 시나리오 모드는 전사배포 안전을 위해 제거됨 — 어떤 URL로도 조작된 고정값이 나오지 않음)

const MONTHLY_BASE_TEMP = [1, 3, 8, 15, 20, 24, 27, 28, 23, 16, 9, 2];

function latAdjust(lat: number): number {
  return (36.5 - lat) * 0.6;
}

function diurnal(hour: number): number {
  return Math.sin(((hour - 9) / 24) * Math.PI * 2) * 4.5;
}

function buildBase(lat: number, date: Date) {
  const month = date.getMonth();
  return MONTHLY_BASE_TEMP[month] + latAdjust(lat);
}

export function createMockProvider(): WeatherProvider {
  const make = (lat: number, when: Date): WeatherNow => {
    const base = buildBase(lat, when) + diurnal(when.getHours());
    const tempC = Math.round(base * 10) / 10;
    const month = when.getMonth();
    const humidityPct = month >= 5 && month <= 8 ? 68 : 50;
    return {
      tempC,
      humidityPct,
      windMs: 2.0,
      rn1mm: 0,
      pty: 0,
      sky: humidityPct >= 65 ? 3 : 1,
      observedAt: when,
      source: "mock",
    };
  };

  const hoursAhead = (lat: number, count: number): HourlyPoint[] => {
    const out: HourlyPoint[] = [];
    const start = new Date();
    for (let h = 1; h <= count; h += 1) {
      const when = new Date(start.getTime() + h * 3600_000);
      const n = make(lat, when);
      out.push({
        time: when,
        tempC: n.tempC,
        humidityPct: n.humidityPct,
        windMs: n.windMs,
        pty: n.pty,
        sky: n.sky,
        rn1mm: n.rn1mm,
        source: "mock",
      });
    }
    return out;
  };

  return {
    async getNow(lat) {
      return make(lat, new Date());
    },
    async getHourly(lat) {
      return hoursAhead(lat, 12);
    },
    async getUltraHourly(lat) {
      return hoursAhead(lat, 6);
    },
  };
}
