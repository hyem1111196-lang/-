import { useCallback, useRef, useState } from "react";
import { createWeatherProvider, type HourlyPoint } from "../providers";
import { computeReading, type Reading, type ViewMode } from "../lib/reading";
import { computeFeelsLike } from "../lib/feelsLike";
import {
  classifyCold,
  classifyHeat,
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
  sky?: number;
}

function sameHour(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours()
  );
}

/** 예보 지점(HourlyPoint) → 위험도가 계산된 HourlyReading 으로 변환 */
function toHourlyReading(p: HourlyPoint, r: Reading): HourlyReading {
  const humidityPct = Number.isFinite(p.humidityPct) && p.humidityPct > 0 ? p.humidityPct : r.humidityPct;
  const windMs = Number.isFinite(p.windMs) ? p.windMs : r.windMs;
  const input = { tempC: p.tempC, humidityPct, windMs };
  const feels = computeFeelsLike(input, r.model);
  const heatFeels = computeFeelsLike(input, "summer");
  const coldFeels = computeFeelsLike(input, "winter");
  const heatLevel = classifyHeat(heatFeels);
  const coldLevel = classifyCold(p.tempC);
  const level = r.model === "winter" ? coldLevel : heatLevel;
  return {
    time: p.time,
    tempC: p.tempC,
    feelsLikeC: feels,
    level,
    heatFeelsLikeC: heatFeels,
    heatLevel,
    coldFeelsLikeC: coldFeels,
    coldLevel,
    sky: p.sky,
  };
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
  const coldLevel = classifyCold(r.tempC);

  return {
    time: r.observedAt,
    tempC: r.tempC,
    feelsLikeC: r.feelsLikeC,
    level: r.model === "winter" ? coldLevel : heatLevel,
    heatFeelsLikeC: heatFeels,
    heatLevel,
    coldFeelsLikeC: coldFeels,
    coldLevel,
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

const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.978, label: "서울특별시 중구 (기본 위치)" };

export function useReading() {
  const providerRef = useRef(createWeatherProvider());
  const [reading, setReading] = useState<Reading | null>(null);
  const [hourly, setHourly] = useState<HourlyReading[]>([]);
  const [hourlyMock, setHourlyMock] = useState(false);
  const [ultraHourly, setUltraHourly] = useState<HourlyReading[]>([]);
  const [ultraMock, setUltraMock] = useState(false);
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
        // 단기예보(하루 전체, 오늘 최고용) + 초단기예보(앞 6시간, 그래프용) 병렬 조회
        const hourlyPromise = provider.getHourly(lat, lon).catch(() => []);
        const ultraPromise = provider.getUltraHourly(lat, lon).catch(() => []);
        const now = await provider.getNow(lat, lon);
        if (id !== reqId.current) return;
        const queriedNow = { ...now, observedAt: new Date() };
        const r = computeReading(queriedNow, label, mode);
        setReading(r);
        setHourly([]);
        setHourlyMock(false);
        setUltraHourly([]);
        setUltraMock(false);

        // 오늘 예상 최고(하루 전체) — 단기예보
        hourlyPromise.then((points) => {
          if (id !== reqId.current || points.length === 0) return;
          setHourlyMock(points[0]?.source === "mock");
          const mapped = points.map((p) => toHourlyReading(p, r));
          setHourly(mergeCurrentHour(mapped, currentHourReading(r)));
        });

        // 예보 그래프(앞 6시간, 1시간마다 갱신) — 초단기예보
        ultraPromise.then((points) => {
          if (id !== reqId.current || points.length === 0) return;
          setUltraMock(points[0]?.source === "mock");
          // 예보는 다음 시각부터 — 이미 지난 시각(현재 시 포함)은 제외해 항상 미래만 표시.
          const now = Date.now();
          const upcoming = points.filter((p) => p.time.getTime() > now);
          setUltraHourly((upcoming.length ? upcoming : points).map((p) => toHourlyReading(p, r)));
        });
      } catch {
        if (id === reqId.current) setError("날씨 조회에 실패했습니다. 잠시 후 다시 시도해주세요.");
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
        const label = await reverseGeocode(lat, lon).catch(() => "현재 위치");
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

  return { reading, hourly, hourlyMock, ultraHourly, ultraMock, loading, error, queryByCoords, queryByGps, refresh };
}
