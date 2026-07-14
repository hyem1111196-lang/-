const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
};

const ENDPOINTS = [
  "https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnList",
  "https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnMsg",
];

export async function handler() {
  const key = process.env.KMA_WARNING_SERVICE_KEY || process.env.KMA_SERVICE_KEY;
  if (!key) return resp(503, { warnings: [], error: "KMA_SERVICE_KEY not configured" });

  const attempts = [];
  for (const endpoint of ENDPOINTS) {
    try {
      const items = await callKmaWarning(endpoint, key);
      const warnings = normalizeWarnings(items);
      if (warnings.length) return resp(200, { warnings, source: endpoint, range: queryRange() });
      attempts.push({ endpoint, count: 0 });
    } catch (err) {
      attempts.push({ endpoint, error: String(err && err.message ? err.message : err) });
    }
  }

  return resp(200, { warnings: [], attempts, range: queryRange() });
}

async function callKmaWarning(endpoint, key) {
  const { from, to } = queryRange();
  const params = new URLSearchParams({
    serviceKey: normalizeServiceKey(key),
    pageNo: "1",
    numOfRows: "300",
    dataType: "JSON",
    stnId: "108",
    fromTmFc: from,
    toTmFc: to,
  });

  const res = await fetch(`${endpoint}?${params}`);
  if (!res.ok) throw new Error(`KMA warning ${res.status}`);
  const data = await res.json();
  const header = data?.response?.header;
  const code = header?.resultCode;
  const items = data?.response?.body?.items?.item;

  if (code && code !== "00" && code !== "03") {
    throw new Error(header?.resultMsg || `KMA warning code ${code}`);
  }
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function normalizeWarnings(items) {
  const out = [];
  for (const item of items) {
    const text = objectText(item);
    const hazard = hazardFrom(text, item);
    if (!hazard) continue;
    const level = levelFrom(text, item);
    const regions = regionsFrom(text, item);
    const issuedAt = normalizeDate(item.tmFc || item.announceTime || item.tmIssue || item.tmf || null);
    const effectiveAt = normalizeDate(item.tmEf || item.effectiveTime || item.tmef || item.tmStart || null);
    const scheduledAt = effectiveAt || issuedAt;
    out.push({
      id: String(item.tmSeq || item.seq || item.tmef || item.tmFc || `${hazard}-${out.length}`),
      hazard,
      level,
      title: titleFrom(text, item, hazard, level),
      regions,
      issuedAt,
      effectiveAt,
      scheduledAt,
      text,
    });
  }
  return dedupe(out);
}

function hazardFrom(text, item) {
  const warnVar = String(item.warnVar || item.wrnVar || item.var || item.wrn || "");
  if (/\uD3ED\uC5FC|heat/i.test(text) || warnVar === "6" || warnVar === "33") return "heat";
  if (/\uD638\uC6B0|heavy rain|rainstorm/i.test(text) || warnVar === "3" || warnVar === "12") return "rain";
  if (/\uB300\uC124|\uAC15\uC124|snow/i.test(text) || warnVar === "8" || warnVar === "13") return "snow";
  if (/\uD55C\uD30C|cold wave/i.test(text) || warnVar === "4" || warnVar === "14") return "cold";
  return null;
}

function levelFrom(text, item) {
  const stress = String(item.warnStress || item.wrnStress || item.stress || "");
  if (/\uACBD\uBCF4|warning/i.test(text) || stress === "1") return "danger";
  return "warning";
}

function regionsFrom(text, item) {
  const direct = item.areaName || item.area || item.region || item.regName || item.zoneName || item.target || item.wrnArea || item.areaCodeName;
  const raw = String(direct || text || "");
  const cleaned = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/[.:;|]/g, " ");
  const tokens = cleaned
    .split(/[,\n\/]+|\s{2,}/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2 && x.length <= 40)
    .filter((x) => !/\d{8,}|\uD2B9\uBCF4|\uC8FC\uC758\uBCF4|\uACBD\uBCF4|\uD3ED\uC5FC|\uD638\uC6B0|\uB300\uC124|\uD55C\uD30C/.test(x));
  return [...new Set(tokens)].slice(0, 20);
}

function titleFrom(text, item, hazard, level) {
  const title = item.title || item.wrnTitle || item.headline;
  if (title) return String(title);
  const hazardLabel = { heat: "\uD3ED\uC5FC", rain: "\uD638\uC6B0", snow: "\uAC15\uC124", cold: "\uD55C\uD30C" }[hazard];
  return `${hazardLabel}${level === "danger" ? "\uACBD\uBCF4" : "\uC8FC\uC758\uBCF4"}`;
}
function queryRange() {
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return { from: formatKst(from), to: formatKst(to) };
}
function normalizeDate(value) {
  if (value == null) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(0, 12).padEnd(12, "0") : null;
}

function parseKmaDate(value) {
  const digits = normalizeDate(value);
  if (!digits) return null;
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  const h = digits.slice(8, 10);
  const min = digits.slice(10, 12);
  const parsed = new Date(`${y}-${m}-${d}T${h}:${min}:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function objectText(item) {
  return Object.values(item || {}).map((v) => String(v ?? "")).join(" ");
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.hazard}-${item.level}-${item.title}-${item.scheduledAt}-${item.regions.join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatKst(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}${p2(kst.getUTCMonth() + 1)}${p2(kst.getUTCDate())}${p2(kst.getUTCHours())}${p2(kst.getUTCMinutes())}`;
}

function p2(n) {
  return String(n).padStart(2, "0");
}

function normalizeServiceKey(key) {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

function resp(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}