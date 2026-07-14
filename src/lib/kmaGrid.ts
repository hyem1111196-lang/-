/**
 * 기상청(KMA) 격자 좌표 변환 및 발표시각 산정.
 *
 * 기상청 동네예보/초단기실황 API는 위경도가 아니라 자체 "격자(nx, ny)"를 입력으로 받는다.
 * 격자는 Lambert Conformal Conic(람베르트 정각원추도법) 투영으로 만든 5km 간격 좌표계다.
 * 아래 dfsXyConv 는 기상청이 공식 배포한 변환식(DFS)을 그대로 옮긴 것이다.
 */

export interface Grid {
  x: number;
  y: number;
}

/** 위경도 → 기상청 격자(nx, ny) 변환 (기상청 공식 DFS 알고리즘) */
export function latLonToGrid(lat: number, lon: number): Grid {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 표준위도 1
  const SLAT2 = 60.0; // 표준위도 2
  const OLON = 126.0; // 기준점 경도
  const OLAT = 38.0; // 기준점 위도
  const XO = 43; // 기준점 X좌표
  const YO = 136; // 기준점 Y좌표
  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    x: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    y: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

export interface KmaBaseDateTime {
  /** YYYYMMDD */
  date: string;
  /** HHmm (정시) */
  time: string;
}

function formatBase(date: Date): KmaBaseDateTime {
  return {
    date: `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`,
    time: `${pad2(date.getHours())}00`,
  };
}

/**
 * 초단기실황 발표시각 후보 목록.
 * 초단기실황은 매시 정시 관측분이 약 40분 뒤 제공된다. 현재 분이 45분 미만이면
 * 직전 시각을 기준으로 잡고, 자료 누락에 대비해 최대 hoursBack 시간 전까지 후보를 만든다.
 */
export function getBaseDateTimeCandidates(
  now: Date = new Date(),
  hoursBack = 6,
): KmaBaseDateTime[] {
  const base = new Date(now);
  if (base.getMinutes() < 45) base.setHours(base.getHours() - 1);

  return Array.from({ length: hoursBack + 1 }, (_, index) => {
    const candidate = new Date(base);
    candidate.setHours(base.getHours() - index);
    return formatBase(candidate);
  });
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
