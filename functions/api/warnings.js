// Cloudflare Pages Function: GET /api/warnings
// 기상청 기상특보 현황(전국) 프록시 — 공공데이터포털 "기상청_기상특보 조회서비스" 특보현황조회(getPwnStatus).
//
// 응답(JSON): { tmFc, t6, t7, other, issuedAt, source, attempts }
//   t6: 발효 중인 특보 원문 ("o 한파주의보 : 서울, 경기도(가평, 포천) ..." / 없으면 "o 없 음")
//   t7: 예비특보 원문, other: 참고사항
// 위치별 판정(시도·시군구 대조)은 클라이언트(src/lib/warnings.ts)가 한다 → 전국 1개 URL이라 엣지 캐시 공유.
//
// 키: KMA_SERVICE_KEY(단기예보와 같은 공공데이터포털 키). 포털에서 '기상청_기상특보 조회서비스' 활용신청이 되어 있어야 한다.
// 디버그: /api/warnings?raw=1 → 기상청 원응답 포함(캐시 안 함).
const STATUS = "https://apis.data.go.kr/1360000/WthrWrnInfoService/getPwnStatus";
const STN_NATIONAL = "108"; // 전국(기상청 본청)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_SECONDS = 300; // 특보는 5분 캐시(기상청 호출 절감)

export async function onRequest(context) {
  const { request, env } = context;
  const key = env.KMA_WARNING_SERVICE_KEY || env.KMA_SERVICE_KEY;
  const url = new URL(request.url);
  const raw = url.searchParams.get("raw") === "1";
  if (!key) return resp(503, { error: "KMA_SERVICE_KEY not configured", t6: null });

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/warnings`, { method: "GET" });
  if (!raw) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const attempts = [];
  // 특보현황은 발표가 있을 때만 갱신되므로 조회 기간을 넓게(최대 허용 6일) 잡고 가장 최근 발표를 쓴다.
  const paramSets = [
    { stnId: STN_NATIONAL, fromTmFc: ymdKst(Date.now() - 6 * DAY_MS), toTmFc: ymdKst(Date.now()) },
    { stnId: STN_NATIONAL },
  ];
  let lastRaw = null;
  for (const extra of paramSets) {
    try {
      const { items, header, rawBody } = await callStatus(key, extra);
      lastRaw = rawBody;
      const latest = pickLatest(items);
      if (latest) {
        const body = {
          tmFc: latest.tmFc ?? null,
          issuedAt: isoFromKma(latest.tmFc),
          t6: textOf(latest.t6),
          t7: textOf(latest.t7),
          other: textOf(latest.other),
          source: "getPwnStatus",
          stnId: STN_NATIONAL,
          attempts: [...attempts, { params: extra, count: items.length }],
        };
        if (raw) return resp(200, { ...body, raw: rawBody }, 0);
        const response = resp(200, body, CACHE_SECONDS);
        context.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      }
      attempts.push({ params: extra, count: 0, code: header?.resultCode, msg: header?.resultMsg });
    } catch (err) {
      attempts.push({ params: extra, error: String(err && err.message ? err.message : err) });
    }
  }
  // 발표 자료가 없으면(NO_DATA) 발효 특보 없음으로 본다. 오류는 캐시하지 않는다.
  const noData = attempts.some((a) => a.code === "03" || /NO_DATA/i.test(String(a.msg || "")));
  const body = { tmFc: null, issuedAt: null, t6: noData ? "o 없 음" : null, t7: "", other: "", source: noData ? "getPwnStatus" : "none", attempts };
  if (raw) return resp(200, { ...body, raw: lastRaw }, 0);
  if (noData) {
    const response = resp(200, body, CACHE_SECONDS);
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  }
  return resp(502, { ...body, error: "KMA warning status unavailable" });
}

async function callStatus(key, extra) {
  const params = new URLSearchParams({
    serviceKey: normalizeServiceKey(key),
    pageNo: "1",
    numOfRows: "50",
    dataType: "JSON",
    ...extra,
  });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${STATUS}?${params}`, { signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`KMA ${res.status} ${text.slice(0, 120)}`);
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // 키 미등록·한도초과 등은 XML/HTML로 오는 경우가 있다.
      const m = text.match(/<returnAuthMsg>([^<]*)<\/returnAuthMsg>|<resultMsg>([^<]*)<\/resultMsg>/);
      throw new Error(m ? (m[1] || m[2]) : `KMA non-JSON response: ${text.slice(0, 120)}`);
    }
    const header = data?.response?.header;
    const code = header?.resultCode;
    let items = data?.response?.body?.items?.item;
    if (code && code !== "00" && code !== "03") throw new Error(header?.resultMsg || `KMA code ${code}`);
    if (!items) items = [];
    if (!Array.isArray(items)) items = [items];
    return { items, header, rawBody: data };
  } finally {
    clearTimeout(timer);
  }
}

/** 발표시각(tmFc)이 가장 최근인 항목 */
function pickLatest(items) {
  let best = null;
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const t = Number(String(it.tmFc ?? "").replace(/\D/g, "")) || 0;
    if (!best || t > best.t) best = { t, it };
  }
  return best ? best.it : null;
}

function textOf(v) {
  return v == null ? "" : String(v);
}

function resp(statusCode, body, maxAge = CACHE_SECONDS) {
  const headers =
    statusCode === 200 && maxAge > 0
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

function ymdKst(ms) {
  const d = new Date(ms + KST_OFFSET_MS);
  return `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}`;
}

function isoFromKma(v) {
  const digits = String(v ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const mi = digits.length >= 12 ? digits.slice(10, 12) : "00";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10)}:${mi}:00+09:00`;
}

function p2(n) {
  return String(n).padStart(2, "0");
}
