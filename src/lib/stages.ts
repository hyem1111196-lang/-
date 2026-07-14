/**
 * 위험 단계(stage) 판정 엔진.
 *
 * 체감온도(또는 강수)를 4단계로 분류한다: 정상 → 관심 → 주의보 → 경보.
 * - 폭염(heat): 체감온도가 높을수록 위험 (기준은 KORAIL 기존 운영값과 동일).
 * - 한파(cold): 체감온도가 낮을수록 위험 (기상청 한파특보 체감온도 기준 기반 — 초안, 안전보건처 검토 대상).
 * - 호우(rain): 1시간 강수량/특보로 분류.
 */

export type HazardKind = "heat" | "cold" | "rain" | "snow";
export type StageLevel = "normal" | "interest" | "warning" | "danger";

/** 폭염 단계 임계값 (체감온도 °C 이상). KORAIL 기존 운영값. */
export const HEAT_THRESHOLDS = { interest: 31, warning: 33, danger: 35 } as const;

/**
 * 한파 단계 임계값 (체감온도 °C 이하).
 * 기상청 한파주의보(-12)·경보(-15) 체감온도 기준에 선제 단계(관심 -10)를 더한 초안.
 * ※ 확정 전 KORAIL 안전보건처 검토 필요.
 */
export const COLD_THRESHOLDS = { interest: -10, warning: -12, danger: -15 } as const;

/** 폭염: 체감온도 → 단계 */
export function classifyHeat(feelsLikeC: number): StageLevel {
  if (feelsLikeC >= HEAT_THRESHOLDS.danger) return "danger";
  if (feelsLikeC >= HEAT_THRESHOLDS.warning) return "warning";
  if (feelsLikeC >= HEAT_THRESHOLDS.interest) return "interest";
  return "normal";
}

/** 한파: 체감온도 → 단계 */
export function classifyCold(feelsLikeC: number): StageLevel {
  if (feelsLikeC <= COLD_THRESHOLDS.danger) return "danger";
  if (feelsLikeC <= COLD_THRESHOLDS.warning) return "warning";
  if (feelsLikeC <= COLD_THRESHOLDS.interest) return "interest";
  return "normal";
}

/** 기상청 강수형태(PTY) 코드: 0 없음, 1 비, 2 비/눈, 3 눈, 5 빗방울, 6 빗방울/눈날림, 7 눈날림 */
export type Pty = 0 | 1 | 2 | 3 | 5 | 6 | 7;

export interface RainInput {
  /** 1시간 강수량 mm (기상청 RN1) */
  rn1mm: number;
  /** 강수형태 코드 (기상청 PTY) */
  pty?: number;
  /** 기상청 특보(있으면 우선): 'advisory'=호우주의보, 'warning'=호우경보 */
  advisory?: "advisory" | "warning";
}

/**
 * 호우: 강수량/특보 → 단계.
 * 특보가 있으면 특보를 따르고, 없으면 1시간 강수량으로 근사.
 * (호우주의보 기준 3h 60mm ≈ 시간당 20mm, 경보 3h 90mm ≈ 시간당 30mm 를 근사 임계로 사용 — 초안.)
 */
export function classifyRain(input: RainInput): StageLevel {
  if (input.advisory === "warning") return "danger";
  if (input.advisory === "advisory") return "warning";
  const mm = Number.isFinite(input.rn1mm) ? input.rn1mm : 0;
  if (mm >= 30) return "danger";
  if (mm >= 20) return "warning";
  if (mm > 0 || (input.pty ?? 0) > 0) return "interest";
  return "normal";
}

/** 눈 강수형태 코드 (눈/진눈깨비/눈날림 포함) */
const SNOW_PTY = new Set([2, 3, 6, 7]);

/** 적설 단계 임계값 (1시간 적설 cm 이상). 기상청 대설특보(24h 5/20cm) 기반 시간당 근사 — 초안. */
export const SNOW_THRESHOLDS = { warning: 1, danger: 3 } as const;

export interface SnowInput {
  /** 1시간 적설 cm (적설 자료 없으면 강수량 수상당량을 cm로 근사) */
  snoCm: number;
  /** 강수형태 코드 */
  pty?: number;
}

/** 폭설: 적설량/강수형태 → 단계 (초안) */
export function classifySnow(input: SnowInput): StageLevel {
  const cm = Number.isFinite(input.snoCm) ? input.snoCm : 0;
  const snowing = SNOW_PTY.has(input.pty ?? 0);
  if (cm >= SNOW_THRESHOLDS.danger) return "danger";
  if (cm >= SNOW_THRESHOLDS.warning) return "warning";
  if (cm > 0 || snowing) return "interest";
  return "normal";
}

/** 눈이 오는 중인지 (강수형태 기준) */
export function isSnowPty(pty: number): boolean {
  return SNOW_PTY.has(pty);
}

/** 단계 순위(정렬·비교용). 숫자가 클수록 위험. */
export const STAGE_RANK: Record<StageLevel, number> = {
  normal: 0,
  interest: 1,
  warning: 2,
  danger: 3,
};

/** 두 단계 중 더 위험한 쪽을 반환 */
export function maxStage(a: StageLevel, b: StageLevel): StageLevel {
  return STAGE_RANK[a] >= STAGE_RANK[b] ? a : b;
}
