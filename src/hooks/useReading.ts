import { useCallback, useRef, useState } from "react";
import { createWeatherProvider } from "../providers";
import { computeReading, type Reading, type ViewMode } from "../lib/reading";
import { computeFeelsLike } from "../lib/feelsLike";
import {
  classifyCold,
  classifyHeat,
  classifyRain,
  classifySnow,
  type StageLevel,
} from "../lib/stages";
import { getBestPosition, reverseGeocode } from "../lib/geolocation";

export type { ViewMode } from "../lib/reading";

export interface HourlyReading {
  time: Date;
  tempC: number;
  feelsLikeC: number;
  level: StageLevel;
  heatFeelsLikeC: number;
  heatLevel: StageLevel;
  coldFeelsLikeC: number;
  coldLevel: StageLevel;
  rn1mm: number;
  sky?: number;
  rainLevel: StageLevel;
  snowLevel: StageLevel;
}

function sameHour(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours()
  );
}

function currentHourReading(r: Reading): HourlyReading {
  const heatFeels = computeFeelsLike(
    { tempC: r.tempC, humidityPct: r.humidityPct, windMs: r.windMs },
    "summer",
  );
  const coldFeels = computeFeelsLike(
    { tempC: r.tempC, humidityPct: r.humidityPct, windMs: r.windMs },
    "winter",
  );
  const heatLevel = classifyHeat(heatFeels);
  const coldLevel = classifyCold(coldFeels);

  return {
    time: r.observedAt,
    tempC: r.tempC,
    feelsLikeC: r.feelsLikeC,
    level: r.model === "winter" ? coldLevel : heatLevel,
    heatFeelsLikeC: heatFeels,
    heatLevel,
    coldFeelsLikeC: coldFeels,
    coldLevel,
    rn1mm: r.rn1mm,
    rainLevel: classifyRain({ rn1mm: r.rn1mm, pty: r.pty }),
    snowLevel: classifySnow({ snoCm: r.rn1mm, pty: r.pty }),
  };
}

function mergeCurrentHour(items: HourlyReading[], current: HourlyReading) {
  return [...items.filter((item) => !sameHour(item.time, current.time)), current].sort(
    (a, b) => a.time.getTime() - b.time.getTime(),
  );
}

interface LastQuery {
  lat: number;
  lon: number;
  label: string;
}

const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.978, label: "\uC11C\uC6B8\uD2B9\uBCC4\uC2DC \uC911\uAD6C (\uAE30\uBCF8 \uC704\uCE58)" };

export function useReading() {
  const providerRef = useRef(createWeatherProvider());
  const [reading, setReading] = useState<Reading | null>(null);
  const [hourly, setHourly] = useState<HourlyReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);
  const last = useRef<LastQuery | null>(null);

  const queryByCoords = useCallback(
    async (lat: number, lon: number, label: string, mode: ViewMode = "auto") => {
      const id = ++reqId.current;
      last.current = { lat, lon, label };
      setLoading(true);
      setError(null);
      try {
        const provider = providerRef.current;
        const hourlyPromise = provider.getHourly(lat, lon).catch(() => []);
        const now = await provider.getNow(lat, lon);
        if (id !== reqId.current) return;
        const queriedNow = { ...now, observedAt: new Date() };
        const r = computeReading(queriedNow, label, mode);
        setReading(r);
        setHourly([]);

        hourlyPromise.then((points) => {
          if (id !== reqId.current || points.length === 0) return;
          const mapped = points.map<HourlyReading>((p) => {
            const humidityPct = Number.isFinite(p.humidityPct) && p.humidityPct > 0 ? p.humidityPct : r.humidityPct;
            const windMs = Number.isFinite(p.windMs) ? p.windMs : r.windMs;
            const input = { tempC: p.tempC, humidityPct, windMs };
            const feels = computeFeelsLike(input, r.model);
            const heatFeels = computeFeelsLike(input, "summer");
            const coldFeels = computeFeelsLike(input, "winter");
            const heatLevel = classifyHeat(heatFeels);
            const coldLevel = classifyCold(coldFeels);
            const level = r.model === "winter" ? coldLevel : heatLevel;
            const rainLevel = classifyRain({ rn1mm: p.rn1mm, pty: p.pty });
            const snowLevel = classifySnow({ snoCm: p.rn1mm, pty: p.pty });
            return {
              time: p.time,
              tempC: p.tempC,
              feelsLikeC: feels,
              level,
              heatFeelsLikeC: heatFeels,
              heatLevel,
              coldFeelsLikeC: coldFeels,
              coldLevel,
              rn1mm: p.rn1mm,
              sky: p.sky,
              rainLevel,
              snowLevel,
            };
          });
          setHourly(mergeCurrentHour(mapped, currentHourReading(r)));
        });
      } catch {
        if (id === reqId.current) setError("\uB0A0\uC528 \uC870\uD68C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.");
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [],
  );

  const queryByGps = useCallback(
    async (mode: ViewMode = "auto") => {
      setLoading(true);
      setError(null);
      try {
        const { lat, lon } = await getBestPosition();
        const label = await reverseGeocode(lat, lon).catch(() => "\uD604\uC7AC \uC704\uCE58");
        await queryByCoords(lat, lon, label, mode);
      } catch {
        await queryByCoords(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.label, mode);
      }
    },
    [queryByCoords],
  );

  const refresh = useCallback(
    (mode: ViewMode = "auto") => {
      if (last.current) {
        const { lat, lon, label } = last.current;
        return queryByCoords(lat, lon, label, mode);
      }
      return queryByGps(mode);
    },
    [queryByCoords, queryByGps],
  );

  return { reading, hourly, loading, error, queryByCoords, queryByGps, refresh };
}
