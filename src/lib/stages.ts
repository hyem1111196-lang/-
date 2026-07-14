/**
 * 위험 단계(stage) 판정 엔진.
 *
 * 체감온도를 4단계로 분류한다: 정상 → 관심 → 주의보 → 경보.
 * - 폭염(heat): 체감온도가 높을수록 위험 (기준은 KORAIL 기존 운영값과 동일).
 * - 한파(cold): 체감온도가 낮을수록 위험 (기상청 한파특보 체감온도 기준 기반 — 초안, 안전보건처 검토 대상).
 */

export type HazardKind = "heat" | "cold";
export type StageLevel = "normal" | "interest" | "warning" | "danger" | "critical";

/** 폭염 단계 임계값 (체감온도 °C 이상). KORAIL 기존 운영값 + 중대경보(38°C). */
export const HEAT_THRESHOLDS = { interest: 31, warning: 33, danger: 35, critical: 38 } as const;

/**
 * 한파 단계 임계값 (체감온도 °C 이하).
 * 기상청 한파주의보(-12)·경보(-15) 체감온도 기준에 선제 단계(관심 -10)를 더한 초안.
 * ※ 확정 전 KORAIL 안전보건처 검토 필요.
 */
export const COLD_THRESHOLDS = { interest: -10, warning: -12, danger: -15 } as const;

/** 폭염: 체감온도 → 단계 */
export function classifyHeat(feelsLikeC: number): StageLevel {
  if (feelsLikeC >= HEAT_THRESHOLDS.critical) return "critical";
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

/** 단계 순위(정렬·비교용). 숫자가 클수록 위험. */
export const STAGE_RANK: Record<StageLevel, number> = {
  normal: 0,
  interest: 1,
  warning: 2,
  danger: 3,
  critical: 4,
};

/** 두 단계 중 더 위험한 쪽을 반환 */
export function maxStage(a: StageLevel, b: StageLevel): StageLevel {
  return STAGE_RANK[a] >= STAGE_RANK[b] ? a : b;
}
