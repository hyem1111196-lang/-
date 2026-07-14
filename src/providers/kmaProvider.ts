import type { HourlyPoint, WeatherNow, WeatherProvider } from "./types";

const ENDPOINT = "/api/weather";

interface NowResponse {
  temp: number;
  humidity: number;
  wind?: number;
  rn1?: number;
  pty?: number;
  sky?: number;
  base?: { date: string; time: string };
  grid?: { x: number; y: number };
}

interface HourlyResponse {
  hourly: Array<{
    time: string;
    temp: number;
    humidity?: number;
    wind?: number;
    pty?: number;
    sky?: number;
    rn1?: number;
    sno?: number;
  }>;
}

function parseBaseDate(base?: { date: string; time: string }): Date {
  if (!base) return new Date();
  const y = base.date.slice(0, 4);
  const mo = base.date.slice(4, 6);
  const d = base.date.slice(6, 8);
  const h = base.time.slice(0, 2);
  const mi = base.time.slice(2, 4);
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:00+09:00`);
}

export function createKmaProvider(): WeatherProvider {
  return {
    async getNow(lat, lon): Promise<WeatherNow> {
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
      const res = await fetch(`${ENDPOINT}?${params}`);
      if (!res.ok) throw new Error(`weather proxy ${res.status}`);
      const data: NowResponse = await res.json();
      if (!Number.isFinite(data.temp) || !Number.isFinite(data.humidity)) {
        throw new Error("weather proxy: invalid payload");
      }
      return {
        tempC: data.temp,
        humidityPct: data.humidity,
        windMs: Number.isFinite(data.wind) ? (data.wind as number) : 0,
        rn1mm: Number.isFinite(data.rn1) ? (data.rn1 as number) : 0,
        pty: Number.isFinite(data.pty) ? (data.pty as number) : 0,
        sky: Number.isFinite(data.sky) ? (data.sky as number) : undefined,
        observedAt: parseBaseDate(data.base),
        source: "kma",
        grid: data.grid,
      };
    },

    async getHourly(lat, lon): Promise<HourlyPoint[]> {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        mode: "hourly",
      });
      const res = await fetch(`${ENDPOINT}?${params}`);
      if (!res.ok) throw new Error(`weather proxy hourly ${res.status}`);
      const data: HourlyResponse = await res.json();
      if (!Array.isArray(data.hourly)) throw new Error("weather proxy: no hourly");
      return data.hourly.map((p) => ({
        time: new Date(p.time),
        tempC: p.temp,
        humidityPct: Number.isFinite(p.humidity) ? (p.humidity as number) : Number.NaN,
        windMs: Number.isFinite(p.wind) ? (p.wind as number) : Number.NaN,
        pty: Number.isFinite(p.pty) ? (p.pty as number) : 0,
        sky: Number.isFinite(p.sky) ? (p.sky as number) : undefined,
        rn1mm: [2, 3, 6, 7].includes(Number(p.pty)) && Number.isFinite(p.sno) ? (p.sno as number) : Number.isFinite(p.rn1) ? (p.rn1 as number) : 0,
      }));
    },
  };
}