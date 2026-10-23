/**
 * 기상청 기상특보(한파·폭염·대설·호우 등) 발효 현황 — 파싱·지역 매칭 엔진 (순수 함수).
 *
 * 데이터 출처: 공공데이터포털 "기상청_기상특보 조회서비스" 특보현황조회(getPwnStatus).
 * 서버리스 프록시(/api/warnings)가 전국 현황 원문(t6: 발효 특보, t7: 예비특보)을 돌려주고,
 * 클라이언트가 원문을 파싱해 현재 위치(시도·시군구)에 해당하는 특보만 골라낸다.
 *
 * 원문 형식(예):
 *   o 한파주의보 : 서울, 인천(옹진군 제외), 경기도(가평, 포천, 연천), 강원도(철원, 양구평지, 강원북부산지)
 *   o 대설주의보 : 충청북도(제천, 단양)
 *   o 없 음                      ← 발효 중인 특보가 없을 때
 *
 * 왜 특보를 쓰는가: 한파특보는 '전날 대비 하강폭·평년값·2일 지속' 같은 조건이 있어
 * 현재 기온만으로는 판정할 수 없다. 기상청이 판정한 결과(특보)를 그대로 받아
 * 기온 기준 단계와 합쳐(더 위험한 쪽) 표시한다.
 */
import type { StageLevel } from "./stages";

export type WarningHazard =
  | "cold" // 한파
  | "heat" // 폭염
  | "snow" // 대설
  | "rain" // 호우
  | "wind" // 강풍
  | "dry" // 건조
  | "typhoon" // 태풍
  | "dust" // 황사
  | "sea" // 풍랑·폭풍해일 등 해상
  | "tropical" // 열대야(2026.6 신설)
  | "other";

/** 특보 수준: 주의보(warning) / 경보(danger) — 앱 단계(StageLevel)와 같은 이름을 쓴다 */
export type WarningLevel = "warning" | "danger";

export interface WarningArea {
  /** 시도 표기 원문 (서울, 경기도, 강원도, 충청북도 …) */
  sido: string;
  /** 괄호 안 하위 구역 (없으면 시도 전체) */
  subs: string[];
  /** "(옹진군 제외)" 처럼 제외 목록이면 true */
  exclude: boolean;
  raw: string;
}

export interface WarningEntry {
  /** 특보명 원문 (한파주의보, 폭염경보 …) */
  name: string;
  hazard: WarningHazard;
  level: WarningLevel;
  areas: WarningArea[];
  raw: string;
}

export interface WarningStatus {
  /** 기상청 발표 시각 (알 수 없으면 null) */
  issuedAt: Date | null;
  /** 발효 중인 특보 목록 (없으면 빈 배열) */
  entries: WarningEntry[];
  /** 예비특보 원문 (표시·참고용) */
  preliminaryText: string;
  /** 참고사항 원문 */
  note: string;
  source: "kma" | "none";
}

export type WarningMatchKind =
  /** 현 위치 시군구가 특보 구역에 포함 */
  | "full"
  /** 같은 시도 안의 다른(또는 세부 확인 불가) 구역에 발효 — 참고 표시만 */
  | "partial";

export interface MatchedWarning {
  entry: WarningEntry;
  match: WarningMatchKind;
}

export interface LocationParts {
  sido: string;
  sigungu: string;
}

/** 특보 없음 상태 */
export const EMPTY_WARNING_STATUS: WarningStatus = {
  issuedAt: null,
  entries: [],
  preliminaryText: "",
  note: "",
  source: "none",
};

export const WARNING_HAZARD_LABEL: Record<WarningHazard, string> = {
  cold: "한파",
  heat: "폭염",
  snow: "대설",
  rain: "호우",
  wind: "강풍",
  dry: "건조",
  typhoon: "태풍",
  dust: "황사",
  sea: "해상",
  tropical: "열대야",
  other: "기타",
};

/** 특보명 → 위험 종류 */
export function hazardFromName(name: string): WarningHazard {
  if (name.includes("한파")) return "cold";
  if (name.includes("폭염")) return "heat";
  if (name.includes("대설")) return "snow";
  if (name.includes("호우")) return "rain";
  if (name.includes("강풍")) return "wind";
  if (name.includes("건조")) return "dry";
  if (name.includes("태풍")) return "typhoon";
  if (name.includes("황사")) return "dust";
  if (name.includes("열대야")) return "tropical";
  if (name.includes("풍랑") || name.includes("해일")) return "sea";
  return "other";
}

/** 특보명 → 수준 (경보 > 주의보). 경보가 아니면 주의보로 본다. */
export function levelFromName(name: string): WarningLevel {
  return name.includes("경보") ? "danger" : "warning";
}

/** 괄호 깊이를 고려해 최상위 구분자(기본 쉼표)로 분리 */
export function splitTopLevel(text: string, sep = ","): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === sep && depth === 0) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** "경기도(가평, 포천)" / "인천(옹진군 제외)" / "서울" → WarningArea */
export function parseArea(token: string): WarningArea {
  const raw = token.trim();
  const m = raw.match(/^([^(]+?)\s*\((.*)\)\s*$/s);
  if (!m) return { sido: raw, subs: [], exclude: false, raw };
  const sido = m[1].trim();
  let inner = m[2].trim();
  const exclude = /제외\s*$/.test(inner);
  if (exclude) inner = inner.replace(/\s*제외\s*$/, "");
  const subs = splitTopLevel(inner, ",")
    .map((s) => s.replace(/\s*제외\s*$/, "").trim())
    .filter(Boolean);
  return { sido, subs, exclude, raw };
}

/**
 * 특보현황 원문(t6) → 특보 목록.
 * 줄마다 "o 특보명 : 구역, 구역(세부, 세부)" 형식. "o 없 음"은 빈 배열.
 */
export function parseStatusText(text: string | null | undefined): WarningEntry[] {
  if (!text) return [];
  const entries: WarningEntry[] = [];
  // 줄바꿈이 없는 원문(공백으로 이어짐)도 처리: "o " 앞에서 자른다.
  const lines = text
    .replace(/\r/g, "")
    .split(/\n|(?=(?:^|\s)[oO○●]\s)/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^[oO○●]\s*(.+)$/);
    if (!m) continue;
    const body = m[1].trim();
    if (/^없\s*음/.test(body)) continue;
    const idx = body.indexOf(":");
    if (idx < 0) continue;
    const name = body.slice(0, idx).replace(/\s+/g, "").trim();
    const areaText = body.slice(idx + 1).trim();
    if (!name) continue;
    const areas = splitTopLevel(areaText, ",").map(parseArea);
    entries.push({ name, hazard: hazardFromName(name), level: levelFromName(name), areas, raw: line });
  }
  return entries;
}

/** "202610230400" → Date (KST) */
export function parseKmaTime(value: string | number | null | undefined): Date | null {
  if (value == null) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 10) return null;
  const y = digits.slice(0, 4);
  const mo = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  const h = digits.slice(8, 10);
  const mi = digits.length >= 12 ? digits.slice(10, 12) : "00";
  const parsed = new Date(`${y}-${mo}-${d}T${h}:${mi}:00+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** 프록시(/api/warnings) 응답 → WarningStatus */
export function statusFromResponse(data: { tmFc?: string | number | null; t6?: string | null; t7?: string | null; other?: string | null } | null | undefined): WarningStatus {
  if (!data) return EMPTY_WARNING_STATUS;
  return {
    issuedAt: parseKmaTime(data.tmFc),
    entries: parseStatusText(data.t6),
    preliminaryText: String(data.t7 ?? "").trim(),
    note: String(data.other ?? "").trim(),
    source: "kma",
  };
}

// ---------------------------------------------------------------------------
// 지역 매칭
// ---------------------------------------------------------------------------

const SIDO_SUFFIXES = ["특별자치도", "특별자치시", "특별시", "광역시", "자치도", "도"];
const SIDO_ALIAS: Record<string, string> = {
  충청북: "충북",
  충청남: "충남",
  전라북: "전북",
  전라남: "전남",
  경상북: "경북",
  경상남: "경남",
};

/** 시도 표기를 짧은 표준키로 (서울특별시→서울, 충청북도→충북, 강원특별자치도→강원, 제주도→제주) */
export function normalizeSido(name: string): string {
  let s = name.replace(/\s+/g, "");
  for (const suf of SIDO_SUFFIXES) {
    if (s.length > suf.length && s.endsWith(suf)) {
      s = s.slice(0, -suf.length);
      break;
    }
  }
  return SIDO_ALIAS[s] ?? s;
}

/** 끝의 시/군/구는 3글자 이상일 때만 뗀다 ("양구"·"중구"·"동구"는 그대로, "양구군"→"양구", "구로구"→"구로") */
function stripCityUnit(s: string): string {
  return s.length >= 3 ? s.replace(/(시|군|구)$/, "") : s;
}

/** 시군구 표기 → 비교용 (뒤의 시/군/구 제거, 공백 제거). "세종특별자치시"→"세종" */
export function normalizeSigungu(name: string): string {
  return stripCityUnit(normalizeSido(name.replace(/\s+/g, "")));
}

/**
 * 기상청 특보구역 세부 명칭 → 비교용 핵심어.
 * "양구평지"→"양구", "홍천군평지"→"홍천", "강릉시평지"→"강릉". (산지·권역 등 시군구가 아닌 이름은 그대로 남는다)
 */
export function normalizeSubArea(name: string): string {
  return stripCityUnit(
    name.replace(/\s+/g, "").replace(/(평지|산지|내륙|해안|북부|남부|중부|동부|서부)+$/, ""),
  );
}

/**
 * 서울 특보구역(4개 권역, 2024년부터 분리 운영) → 자치구.
 * 기상청 통보문에 "서울(동북권, 동남권)" 형태로 나올 때 자치구와 대조하기 위한 표.
 * ※ 기상청 특보구역 정보(공공데이터포털 '기상청_기상특보구역정보')와 다르면 여기를 고친다.
 */
export const SEOUL_ZONES: Record<string, string[]> = {
  동북권: ["성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구"],
  동남권: ["서초구", "강남구", "송파구", "강동구"],
  서북권: ["종로구", "중구", "용산구", "은평구", "서대문구", "마포구"],
  서남권: ["양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구"],
};

function subMatches(sub: string, loc: LocationParts): boolean {
  const target = normalizeSigungu(loc.sigungu);
  if (!target) return false;
  // 핵심어 완전일치만 인정 ("동구"↔"동래구" 같은 접두어 오판 방지)
  const core = normalizeSubArea(sub);
  if (core && core === target) return true;
  // 서울 권역명 → 자치구
  if (normalizeSido(loc.sido) === "서울") {
    const zone = sub.replace(/\s+/g, "").replace(/^서울/, "");
    const gus = SEOUL_ZONES[zone];
    if (gus && gus.some((g) => normalizeSigungu(g) === target)) return true;
  }
  return false;
}

/** 특보 구역 하나가 현 위치에 해당하는지 */
export function matchArea(area: WarningArea, loc: LocationParts): WarningMatchKind | null {
  if (normalizeSido(area.sido) !== normalizeSido(loc.sido)) return null;
  if (area.subs.length === 0) return "full";
  const hit = area.subs.some((s) => subMatches(s, loc));
  if (area.exclude) return hit ? null : "full";
  return hit ? "full" : "partial";
}

/** 전국 특보 현황에서 현 위치에 해당하는 특보만 추린다 (full 우선, 종류별 1건) */
export function matchWarnings(status: WarningStatus | null | undefined, loc: LocationParts | null | undefined): MatchedWarning[] {
  if (!status || !loc) return [];
  const best = new Map<string, MatchedWarning>();
  for (const entry of status.entries) {
    let kind: WarningMatchKind | null = null;
    for (const area of entry.areas) {
      const k = matchArea(area, loc);
      if (k === "full") {
        kind = "full";
        break;
      }
      if (k === "partial") kind = "partial";
    }
    if (!kind) continue;
    const key = `${entry.hazard}:${entry.level}`;
    const prev = best.get(key);
    if (!prev || (prev.match === "partial" && kind === "full")) best.set(key, { entry, match: kind });
  }
  // 같은 종류에 주의보·경보가 모두 있으면 경보를 앞에
  return [...best.values()].sort((a, b) => rank(b) - rank(a));
}

function rank(m: MatchedWarning): number {
  return (m.match === "full" ? 10 : 0) + (m.entry.level === "danger" ? 2 : 1);
}

/** 현 위치에 실제 발효(full) 중인 특보의 앱 단계. 없으면 normal. */
export function warningStageFor(matches: MatchedWarning[], hazard: WarningHazard): StageLevel {
  let out: StageLevel = "normal";
  for (const m of matches) {
    if (m.match !== "full" || m.entry.hazard !== hazard) continue;
    if (m.entry.level === "danger") return "danger";
    out = "warning";
  }
  return out;
}

/**
 * 표시용 지역명 → 시도·시군구.
 * "서울특별시 구로구 고척동", "경기도 가평군 인근", "세종특별자치시 조치원읍", "서울특별시 중구 (기본 위치)"
 */
export function locationFromLabel(label: string | null | undefined): LocationParts | null {
  if (!label) return null;
  const parts = label
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => p && p !== "인근" && p !== "현재" && p !== "위치");
  if (!parts.length) return null;
  const sido = parts[0];
  if (normalizeSido(sido) === "세종") return { sido, sigungu: "세종" };
  const sigungu = parts.length > 1 ? parts[1] : "";
  return { sido, sigungu };
}

/** 특보 배지 문구: "한파주의보" + 발표시각 */
export function formatIssuedAt(d: Date | null): string {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}.${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())} 발표`;
}
