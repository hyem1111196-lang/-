import type { HourlyPoint, WeatherNow, WeatherProvider } from "./types";

type DemoMode = "heat" | "cold" | "rain" | "snow" | "danger" | "warning" | "interest" | null;

function readDemoMode(): DemoMode {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem("demoMode");
  } catch {
    // ignore
  }
  const url = new URLSearchParams(window.location.search).get("demo");
  const valid = ["heat", "cold", "rain", "snow", "danger", "warning", "interest"];
  return valid.includes(url ?? "") ? (url as DemoMode) : null;
}

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

function applyDemo(now: WeatherNow, demo: DemoMode): WeatherNow {
  switch (demo) {
    case "heat":
    case "danger":
      return { ...now, tempC: 36, humidityPct: 65, windMs: 1.2, rn1mm: 0, pty: 0, sky: 1 };
    case "warning":
      return { ...now, tempC: 33, humidityPct: 60, windMs: 1.5, rn1mm: 0, pty: 0, sky: 1 };
    case "interest":
      return { ...now, tempC: 31, humidityPct: 70, windMs: 2, rn1mm: 0, pty: 0, sky: 3 };
    case "cold":
      return { ...now, tempC: -8, humidityPct: 45, windMs: 7, rn1mm: 0, pty: 0, sky: 3 };
    case "rain":
      return { ...now, tempC: 22, humidityPct: 92, windMs: 4, rn1mm: 25, pty: 1, sky: 4 };
    case "snow":
      return { ...now, tempC: -3, humidityPct: 85, windMs: 3, rn1mm: 2, pty: 3, sky: 4 };
    default:
      return now;
  }
}

export function createMockProvider(): WeatherProvider {
  const make = (lat: number, when: Date): WeatherNow => {
    const base = buildBase(lat, when) + diurnal(when.getHours());
    const tempC = Math.round(base * 10) / 10;
    const month = when.getMonth();
    const humidityPct = month >= 5 && month <= 8 ? 68 : 50;
    const now: WeatherNow = {
      tempC,
      humidityPct,
      windMs: 2.0,
      rn1mm: 0,
      pty: 0,
      sky: humidityPct >= 65 ? 3 : 1,
      observedAt: when,
      source: "mock",
    };
    return applyDemo(now, readDemoMode());
  };

  return {
    async getNow(lat) {
      return make(lat, new Date());
    },
    async getHourly(lat) {
      const demo = readDemoMode();
      const out: HourlyPoint[] = [];
      const start = new Date();
      for (let h = 1; h <= 12; h += 1) {
        const when = new Date(start.getTime() + h * 3600_000);
        const n = make(lat, when);
        let rn1mm = n.rn1mm;
        let pty = n.pty;
        let sky = n.sky;
        if (demo === "rain") {
          rn1mm = Math.round(28 * Math.exp(-((h - 4) ** 2) / 12) * 10) / 10;
          pty = rn1mm >= 0.1 ? 1 : 0;
          sky = pty ? 4 : 3;
        } else if (demo === "snow") {
          rn1mm = Math.round(3 * Math.exp(-((h - 4) ** 2) / 14) * 10) / 10;
          pty = rn1mm >= 0.1 ? 3 : 0;
          sky = pty ? 4 : 3;
        }
        out.push({
          time: when,
          tempC: n.tempC,
          humidityPct: n.humidityPct,
          windMs: n.windMs,
          pty,
          sky,
          rn1mm,
        });
      }
      return out;
    },
  };
}