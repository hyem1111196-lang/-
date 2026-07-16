import type { HazardKind, StageLevel } from "../lib/stages";

export interface StageMeta {
  level: StageLevel;
  label: string;
  emoji: string;
  color: string;
  thresholdLabel: string;
  headline: string;
  actions: string[];
  draft?: boolean;
}

const SAFETY_COLORS = {
  normal: "#16a34a",
  interest: "#ca8a04",
  warning: "#eab308",
  danger: "#ea580c",
  critical: "#dc2626",
} as const;

const EMOJI = {
  normal: "✓",
  interest: "!",
  warning: "!!",
  danger: "!!!",
  critical: "!!!!",
} as const;

export const STAGE_CONTENT: Record<HazardKind, Record<StageLevel, StageMeta>> = {
  heat: {
    normal: { level: "normal", label: "정상", emoji: EMOJI.normal, color: SAFETY_COLORS.normal, thresholdLabel: "31°C 미만", headline: "폭염 위험 낮음", actions: ["현재 체감온도 양호(안전근무 가능 상태)", "정기적인 시원한 수분(음용수) 섭취 지도", "일상적인 현장 보건 예방 체계 상시 유지"] },
    interest: { level: "interest", label: "관심", emoji: EMOJI.interest, color: SAFETY_COLORS.interest, thresholdLabel: "31°C 이상", headline: "폭염 관심 단계", actions: ["휴게시간: 시간당 10~15분 이상 휴식 제공", "개인용 보냉장구 사전 준비 및 필요시 즉시 지급", "폭염 업무담당자 지정 및 근로자 건강상태 수시 확인"] },
    warning: { level: "warning", label: "주의보", emoji: EMOJI.warning, color: SAFETY_COLORS.warning, thresholdLabel: "33°C 이상", headline: "폭염주의보 단계", actions: ["휴게시간: 시간당 10~15분 이상 휴식 제공", "휴식 부여가 곤란한 경우 개인용 보냉장구 또는 냉방·통풍장치 지급 및 가동", "작업시간대 조정 또는 옥외작업 단축"] },
    danger: { level: "danger", label: "경보", emoji: EMOJI.danger, color: SAFETY_COLORS.danger, thresholdLabel: "35°C 이상", headline: "폭염경보 단계", actions: ["휴게시간: 매 시간당 15분 이상 의무 휴식 부여", "[권고]무더위 시간대(14~17시)에는 불가피한 경우 제외하고 옥외작업 중지", "온열질환 의심자 등 휴식시간 추가 배정"] },
    critical: { level: "critical", label: "중대경보", emoji: EMOJI.critical, color: SAFETY_COLORS.critical, thresholdLabel: "38°C 이상", headline: "폭염 중대경보 단계", actions: ["휴게시간: 매 시간당 15분 이상 의무 휴식 부여", "[권고]재난 및 안전관리 등 긴급조치 작업 외 옥외작업 중지", "온열질환 의심자 등 휴식시간 추가 배정"] },
  },
  cold: {
    normal: { level: "normal", label: "정상", emoji: EMOJI.normal, color: SAFETY_COLORS.normal, thresholdLabel: "-12°C 초과", headline: "한파 위험 낮음", actions: ["통상 작업이 가능한 범위", "개인용 방한장구 사전 준비 및 필요시 즉시 지급", "일상적인 현장 보건 체계 상시 유지"] },
    interest: { level: "interest", label: "관심", emoji: EMOJI.interest, color: SAFETY_COLORS.interest, thresholdLabel: "-10°C 이하", headline: "한파 관심 단계", actions: ["한랭질환 예방교육을 실시하고 작업 전 건강 상태를 확인합니다.", "따뜻한 휴게공간을 확보하고 정기적인 보온 휴식을 제공합니다.", "방한복, 방한장갑, 방한화 등 개인 보온장구를 지급·점검합니다.", "결빙 예상 구간과 계단, 승강장 가장자리의 미끄럼 위험을 확인합니다."] },
    warning: { level: "warning", label: "주의보", emoji: EMOJI.warning, color: SAFETY_COLORS.warning, thresholdLabel: "-12°C 이하", headline: "한파주의보 단계", actions: ["따뜻한 옷과 방한장구 착용, 따뜻한 물 및 쉼터 제공", "작업시간대 조정 또는 작업시간 단축", "적절한 휴식 부여"] },
    danger: { level: "danger", label: "경보", emoji: EMOJI.danger, color: SAFETY_COLORS.danger, thresholdLabel: "-15°C 이하", headline: "한파경보 단계", actions: ["따뜻한 옷과 방한장구 착용, 따뜻한 물 및 쉼터 제공", "[권고]추운시간대(새벽) 옥외 작업중지 또는 최소화", "적절한 휴식 부여"] },
    critical: { level: "critical", label: "중대경보", emoji: EMOJI.critical, color: SAFETY_COLORS.critical, thresholdLabel: "-15°C 이하", headline: "한파 중대경보 단계", actions: ["불가피한 경우를 제외하고 옥외 작업을 중지합니다.", "저체온증·동상 의심자는 즉시 작업을 중단시키고 보온 및 응급조치합니다.", "단독 작업을 금지하고 비상 연락체계를 상시 유지합니다."] },
  },
};

export const HAZARD_LABEL: Record<HazardKind, string> = {
  heat: "폭염",
  cold: "한파",
};

export function getStageMeta(hazard: HazardKind, level: StageLevel): StageMeta {
  return STAGE_CONTENT[hazard][level];
}

