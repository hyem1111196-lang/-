// Cloudflare Pages Function: GET /api/weather
// nx/ny(격자) 또는 lat/lon 으로 기상청 초단기실황(현재)·단기예보(hourly) 조회.
const NCST = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const VILAGE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
const UFCST = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export async function onRequest(context) {
  const { request, env } = context;
  const key = env.KMA_SERVICE_KEY;
  const url = new URL(request.url);
  const q = url.searchParams;
  const nx = Number(q.get("nx"));
  const ny = Number(q.get("ny"));
  const lat = Number(q.get("lat"));
  const lon = Number(q.get("lon"));
  const mode = q.get("mode");

  // 격자(nx,ny)가 오면 그대로 사용 → 같은 5km 셀의 요청이 동일 URL이 되어 캐시를 공유한다.
  let grid;
  if (Number.isFinite(nx) && Number.isFinite(ny)) {
    grid = { x: nx, y: ny };
  } else if (Number.isFinite(lat) && Number.isFinite(lon)) {
    grid = latLonToGrid(lat, lon);
  } else {
    return resp(400, { error: "nx/ny or lat/lon required" });
  }
  if (!key) {
    return resp(503, { error: "KMA_SERVICE_KEY not configured" });
  }

  // 엣지 캐시: 같은 격자+모드 요청은 저장된 응답을 재사용 → 기상청 API 호출(일일 한도)을 크게 절감.
  // 캐시 유효기간은 응답의 Cache-Control(현재 10분 / 예보 30분)을 따른다. 에러는 저장하지 않는다.
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    let response;
    if (mode === "ultra") {
      // 초단기예보(getUltraSrtFcst): 매시간 갱신, 앞으로 6시간까지. 예보 그래프용.
      const hourly = await fetchUltraForecast(key, grid);
      response = resp(200, { hourly, grid, source: "getUltraSrtFcst" }, 600);
    } else if (mode === "hourly") {
      const hourly = await fetchDailyForecast(key, grid);
      response = resp(200, { hourly, grid, source: "getVilageFcst" }, 1800);
    } else {
      const now = await fetchNow(key, grid);
      response = resp(200, { ...now, grid, source: "getUltraSrtNcst" }, 600);
    }
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return resp(502, { error: String(err && err.message ? err.message : err) });
  }
}

async function fetchNow(key, grid) {
  const candidates = ultraBaseCandidates(new Date(), 2);
  let lastErr;
  for (const base of candidates) {
    try {
      const items = await callKma(NCST, key, grid, base, 80);
      let temp = null;
      let humidity = null;
      let wind = null;
      let rn1 = 0;
      let pty = 0;
      for (const it of items) {
        const v = Number(it.obsrValue);
        if (it.category === "T1H") temp = v;
        else if (it.category === "REH") humidity = v;
        else if (it.category === "WSD") wind = v;
        else if (it.category === "RN1") rn1 = Number.isFinite(v) ? v : parsePrecip(it.obsrValue);
        else if (it.category === "PTY") pty = Number.isFinite(v) ? v : 0;
      }
      if (Number.isFinite(temp) && Number.isFinite(humidity)) {
        return { temp, humidity, wind: wind ?? 0, rn1, pty, base, dataType: "current-observation" };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("KMA current observation data not found");
}

async function fetchUltraForecast(key, grid) {
  const candidates = ultraFcstBaseCandidates(new Date(), 2);
  const byTime = new Map();
  let lastErr;
  for (const base of candidates) {
    try {
      const items = await callKma(UFCST, key, grid, base, 300);
      for (const it of items) {
        const t = `${it.fcstDate}${it.fcstTime}`;
        const cur = byTime.get(t) || {};
        const v = Number(it.fcstValue);
        if (it.category === "T1H") cur.temp = v;
        else if (it.category === "REH") cur.humidity = v;
        else if (it.category === "WSD") cur.wind = v;
        else if (it.category === "PTY") cur.pty = Number.isFinite(v) ? v : 0;
        else if (it.category === "SKY") cur.sky = Number.isFinite(v) ? v : undefined;
        else if (it.category === "RN1") cur.rn1 = parsePrecip(it.fcstValue);
        byTime.set(t, cur);
      }
      if ([...byTime.values()].filter((p) => Number.isFinite(p.temp)).length >= 6) break;
    } catch (e) {
      lastErr = e;
    }
  }
  const points = [...byTime.keys()].sort().map((t) => {
    const p = byTime.get(t);
    return {
      time: isoFromKma(t),
      temp: p.temp,
      humidity: p.humidity,
      wind: p.wind,
      pty: p.pty ?? 0,
      sky: p.sky,
      rn1: p.rn1 ?? 0,
      sno: 0,
    };
  }).filter((p) => Number.isFinite(p.temp));
  if (points.length) return points;
  throw lastErr || new Error("KMA ultra forecast data not found");
}

function ultraFcstBaseCandidates(now, hoursBack) {
  // 초단기예보 발표: 매시 30분 생성, 매시 45분 API 제공.
  const p = kstParts(now);
  let baseMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, 30, 0, 0);
  if (p.minute < 45) baseMs -= HOUR_MS;
  return Array.from({ length: hoursBack + 1 }, (_, i) => {
    const c = new Date(baseMs - i * HOUR_MS);
    return { date: ymd(c), time: `${p2(c.getUTCHours())}30` };
  });
}

async function fetchDailyForecast(key, grid) {
  const targets = todayHourKeys();
  const byTime = new Map();
  const candidates = vilageBaseCandidates(new Date(), 3);
  let lastErr;

  for (const base of candidates) {
    try {
      const items = await callKma(VILAGE, key, grid, base, 1000);
      for (const it of items) {
        const t = `${it.fcstDate}${it.fcstTime}`;
        if (!targets.has(t)) continue;
        const cur = byTime.get(t) || {};
        const v = Number(it.fcstValue);
        if (it.category === "TMP") setIfMissing(cur, "temp", v);
        else if (it.category === "TMX") setMax(cur, "temp", v);
        else if (it.category === "TMN") setIfMissing(cur, "temp", v);
        else if (it.category === "REH") setIfMissing(cur, "humidity", v);
        else if (it.category === "WSD") setIfMissing(cur, "wind", v);
        else if (it.category === "PTY") setIfMissing(cur, "pty", Number.isFinite(v) ? v : 0);
        else if (it.category === "SKY") setIfMissing(cur, "sky", Number.isFinite(v) ? v : undefined);
        else if (it.category === "PCP") setIfMissing(cur, "rn1", parsePrecip(it.fcstValue));
        else if (it.category === "SNO") setIfMissing(cur, "sno", parseSnow(it.fcstValue));
        byTime.set(t, cur);
      }
      // 오늘 전 시간대 기온이 채워졌으면 추가 조회 중단 (속도·타임아웃 방지)
      if ([...targets].every((k) => Number.isFinite(byTime.get(k)?.temp))) break;
    } catch (e) {
      lastErr = e;
    }
  }

  const raw = [...targets].sort().map((t) => ({ key: t, ...(byTime.get(t) || {}) }));
  const hourly = raw.map((p, idx) => fillPoint(raw, idx)).map((p) => ({
    time: isoFromKma(p.key),
    temp: p.temp,
    humidity: p.humidity,
    wind: p.wind,
    pty: p.pty ?? 0,
    sky: p.sky,
    rn1: p.rn1 ?? 0,
    sno: p.sno ?? 0,
  })).filter((p) => Number.isFinite(p.temp));

  if (hourly.length) return hourly;
  throw lastErr || new Error("KMA daily forecast data not found");
}

function fillPoint(points, idx) {
  const current = points[idx];
  const complete = { ...current };
  const fields = ["temp", "humidity", "wind", "sky"];
  for (const field of fields) {
    if (Number.isFinite(complete[field])) continue;
    const near = nearestWith(points, idx, field);
    if (near && Number.isFinite(near[field])) complete[field] = near[field];
  }
  return complete;
}

function setIfMissing(target, field, value) {
  if (Number.isFinite(target[field])) return;
  if (Number.isFinite(value)) target[field] = value;
}

function setMax(target, field, value) {
  if (!Number.isFinite(value)) return;
  if (!Number.isFinite(target[field]) || value > target[field]) target[field] = value;
}

function nearestWith(points, idx, field) {
  for (let dist = 1; dist < points.length; dist += 1) {
    const before = points[idx - dist];
    const after = points[idx + dist];
    if (before && Number.isFinite(before[field])) return before;
    if (after && Number.isFinite(after[field])) return after;
  }
  return null;
}

async function callKma(endpoint, key, grid, base, rows) {
  const params = new URLSearchParams({
    serviceKey: normalizeServiceKey(key),
    pageNo: "1",
    numOfRows: String(rows),
    dataType: "JSON",
    base_date: base.date,
    base_time: base.time,
    nx: String(grid.x),
    ny: String(grid.y),
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(`${endpoint}?${params}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`KMA ${res.status}`);
    const data = await res.json();
    const code = data?.response?.header?.resultCode;
    const items = data?.response?.body?.items?.item;
    if (code !== "00" || !Array.isArray(items)) {
      throw new Error(data?.response?.header?.resultMsg || `KMA code ${code}`);
    }
    return items;
  } finally {
    clearTimeout(timer);
  }
}

function todayHourKeys() {
  const p = kstParts(new Date());
  const start = Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0, 0);
  return new Set(Array.from({ length: 25 }, (_, h) => {
    const d = new Date(start + h * HOUR_MS);
    return `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}${p2(d.getUTCHours())}00`;
  }));
}

function ultraBaseCandidates(now, hoursBack) {
  const p = kstParts(now);
  let baseMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, 0, 0, 0);
  if (p.minute < 40) baseMs -= HOUR_MS;
  return Array.from({ length: hoursBack + 1 }, (_, i) => {
    const c = new Date(baseMs - i * HOUR_MS);
    return { date: ymd(c), time: `${p2(c.getUTCHours())}00` };
  });
}

function vilageBaseCandidates(now, count) {
  const p = kstParts(now);
  let baseMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, 0, 0, 0);
  if (p.minute < 15) baseMs -= HOUR_MS;
  const out = [];
  for (let i = 0; out.length < count && i < 72; i += 1) {
    const c = new Date(baseMs - i * HOUR_MS);
    const hh = c.getUTCHours();
    if ([2, 5, 8, 11, 14, 17, 20, 23].includes(hh)) {
      out.push({ date: ymd(c), time: `${p2(hh)}00` });
    }
  }
  return out;
}

function parsePrecip(v) {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s || s === "-" || s === "0" || s.includes("강수없음") || /no precipitation/i.test(s)) return 0;
  if (s.includes("미만")) return 0.5;
  const nums = [...s.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0])).filter(Number.isFinite);
  return nums.length ? Math.max(...nums) : 0;
}

function parseSnow(v) {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s || s === "-" || s === "0" || s.includes("적설없음")) return 0;
  if (s.includes("미만")) return 0.5;
  const nums = [...s.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0])).filter(Number.isFinite);
  return nums.length ? Math.max(...nums) : 0;
}

function resp(statusCode, body, maxAge = 300) {
  // 정상 응답만 캐시(격자 단위 공유 → 함수 호출 절감). 에러는 캐시하지 않는다.
  const headers =
    statusCode === 200
      ? { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${maxAge}` }
      : { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
  return new Response(JSON.stringify(body), { status: statusCode, headers });
}

function normalizeServiceKey(key) {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

function isoFromKma(t) {
  return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(8, 10)}:${t.slice(10, 12)}:00+09:00`;
}

function ymd(d) {
  return `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}`;
}

function kstParts(date) {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
  };
}

function p2(n) {
  return String(n).padStart(2, "0");
}

function latLonToGrid(lat, lon) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;
  return {
    x: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    y: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}
