/**
 * 위험 단계(stage) 판정 엔진.
 *
 * 위험도를 단계로 분류한다.
 * - 폭염(heat): 체감온도가 높을수록 위험 (KORAIL 운영값 + 중대경보 38°C).
 * - 한파(cold): 기온(최저기온)이 낮을수록 위험 (기상청 한파특보 최저기온 기준). 관심 단계 없음.
 */

export type HazardKind = "heat" | "cold";
export type StageLevel = "normal" | "interest" | "warning" | "danger" | "critical";

/** 폭염 단계 임계값 (체감온도 °C 이상). KORAIL 기존 운영값 + 중대경보(38°C). */
export const HEAT_THRESHOLDS = { interest: 31, warning: 33, danger: 35, critical: 38 } as const;

/**
 * 한파 단계 임계값 (기온 °C 이하). 기상청 한파특보 최저기온 기준.
 * 주의보 -12°C 이하, 경보 -15°C 이하. (관심 단계 없음)
 */
export const COLD_THRESHOLDS = { warning: -12, danger: -15 } as const;

/** 폭염: 체감온도 → 단계 */
export function classifyHeat(feelsLikeC: number): StageLevel {
  if (feelsLikeC >= HEAT_THRESHOLDS.critical) return "critical";
  if (feelsLikeC >= HEAT_THRESHOLDS.danger) return "danger";
  if (feelsLikeC >= HEAT_THRESHOLDS.warning) return "warning";
  if (feelsLikeC >= HEAT_THRESHOLDS.interest) return "interest";
  return "normal";
}

/** 한파: 기온(최저기온) → 단계. 관심 단계 없음(정상/주의보/경보). */
export function classifyCold(tempC: number): StageLevel {
  if (tempC <= COLD_THRESHOLDS.danger) return "danger";
  if (tempC <= COLD_THRESHOLDS.warning) return "warning";
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
