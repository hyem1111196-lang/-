/**
 * 위치 측위 및 역지오코딩.
 * - getBestPosition: 짧은 시간 watchPosition 으로 가장 정확한 좌표를 고른다.
 * - reverseGeocode: 서버리스 /api/geocode(Kakao) → 실패 시 내장 시군구 중 최근접명으로 폴백.
 */
import { REGIONS } from "../data/regions";

export interface Coords {
  lat: number;
  lon: number;
}

export function getBestPosition(timeoutMs = 3500): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("위치 기능을 사용할 수 없습니다."));
      return;
    }
    let best: GeolocationPosition | null = null;
    let lastError: unknown = null;
    let done = false;
    let watchId: number | null = null;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (best) resolve({ lat: best.coords.latitude, lon: best.coords.longitude });
      else reject(lastError instanceof Error ? lastError : new Error("현재 위치를 확인하지 못했습니다."));
    };

    const timer = setTimeout(finish, timeoutMs);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
      },
      (err) => {
        lastError = err;
        if (!best) finish();
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 },
    );
  });
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
    const res = await fetch(`/api/geocode?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.name) return data.name as string;
    }
  } catch {
    /* fall through */
  }
  return nearestRegionName(lat, lon);
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 내장 시군구 중 최근접 지역명 (역지오코딩 폴백) */
export function nearestRegionName(lat: number, lon: number): string {
  let best: { sido: string; name: string; d: number } | null = null;
  for (const [sido, list] of Object.entries(REGIONS)) {
    for (const s of list) {
      const d = distanceKm(lat, lon, s.lat, s.lon);
      if (!best || d < best.d) best = { sido, name: s.name, d };
    }
  }
  return best ? `${best.sido} ${best.name} 인근` : "현재 위치";
}
