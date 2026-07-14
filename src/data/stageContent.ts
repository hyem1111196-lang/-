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
  warning: "#ea580c",
  danger: "#dc2626",
} as const;

const EMOJI = {
  normal: "✓",
  interest: "!",
  warning: "!!",
  danger: "!!!",
} as const;

export const STAGE_CONTENT: Record<HazardKind, Record<StageLevel, StageMeta>> = {
  heat: {
    normal: { level: "normal", label: "정상", emoji: EMOJI.normal, color: SAFETY_COLORS.normal, thresholdLabel: "31°C 미만", headline: "폭염 위험 낮음", actions: ["현재 체감온도는 통상 작업이 가능한 범위입니다.", "작업 전 식수, 그늘, 휴식 장소를 확인합니다.", "기상 변화와 근로자 건강 상태를 주기적으로 확인합니다."] },
    interest: { level: "interest", label: "관심", emoji: EMOJI.interest, color: SAFETY_COLORS.interest, thresholdLabel: "31°C 이상", headline: "폭염 관심 단계", actions: ["온열질환 예방교육을 실시하고 작업자별 건강 상태를 확인합니다.", "매시간 10~15분 이상 그늘 휴식을 제공합니다.", "식수, 냉방·통풍 장비, 개인 보냉용품 지급 상태를 점검합니다.", "고령자·기저질환자 등 취약 작업자는 작업 강도를 낮춥니다."] },
    warning: { level: "warning", label: "주의보", emoji: EMOJI.warning, color: SAFETY_COLORS.warning, thresholdLabel: "33°C 이상", headline: "폭염주의보 단계", actions: ["무더위 시간대 작업을 조정하고 옥외 작업은 단축 운영합니다.", "매시간 10~15분 이상 의무 휴식을 적용합니다.", "휴식 공간이 부족한 경우 이동식 그늘막·냉방 장비를 즉시 배치합니다.", "어지럼, 두통, 구토 등 이상 증상자는 즉시 작업에서 제외하고 응급조치합니다."] },
    danger: { level: "danger", label: "경보", emoji: EMOJI.danger, color: SAFETY_COLORS.danger, thresholdLabel: "35°C 이상", headline: "폭염경보 단계", actions: ["불가피한 경우를 제외하고 옥외 작업을 중지하거나 시간대를 변경합니다.", "매시간 15분 이상 의무 휴식과 추가 회복 시간을 부여합니다.", "온열질환 의심자는 즉시 작업을 중단시키고 119 또는 의료기관으로 연계합니다.", "14~17시 무더위 시간대에는 고강도 작업과 단독 작업을 금지합니다."] },
  },
  cold: {
    normal: { level: "normal", label: "정상", emoji: EMOJI.normal, color: SAFETY_COLORS.normal, thresholdLabel: "-10°C 초과", headline: "한파 위험 낮음", actions: ["현재 체감온도는 통상 작업이 가능한 범위입니다.", "따뜻한 물과 방한복 착용 상태를 확인합니다.", "노출 부위 동상 징후와 미끄럼 위험을 수시로 살핍니다."] },
    interest: { level: "interest", label: "관심", emoji: EMOJI.interest, color: SAFETY_COLORS.interest, thresholdLabel: "-10°C 이하", headline: "한파 관심 단계", actions: ["한랭질환 예방교육을 실시하고 작업 전 건강 상태를 확인합니다.", "따뜻한 휴게공간을 확보하고 정기적인 보온 휴식을 제공합니다.", "방한복, 방한장갑, 방한화 등 개인 보온장구를 지급·점검합니다.", "결빙 예상 구간과 계단, 승강장 가장자리의 미끄럼 위험을 확인합니다."] },
    warning: { level: "warning", label: "주의보", emoji: EMOJI.warning, color: SAFETY_COLORS.warning, thresholdLabel: "-12°C 이하", headline: "한파주의보 단계", actions: ["옥외 작업 시간을 단축하고 취약 작업자는 실내 또는 저강도 업무로 전환합니다.", "정기 휴식 주기를 강화하고 젖은 의복은 즉시 교체합니다.", "결빙·미끄럼 구간에는 제설제 살포와 접근 통제 등 예방 조치를 시행합니다.", "2인 1조 작업과 상호 건강 상태 확인을 원칙으로 합니다."] },
    danger: { level: "danger", label: "경보", emoji: EMOJI.danger, color: SAFETY_COLORS.danger, thresholdLabel: "-15°C 이하", headline: "한파경보 단계", actions: ["불가피한 경우를 제외하고 옥외 작업을 중지합니다.", "저체온증·동상 의심자는 즉시 작업을 중단시키고 보온 및 응급조치합니다.", "단독 작업을 금지하고 비상 연락체계를 상시 유지합니다.", "야간·새벽 시간대 옥외 작업은 최소 인원으로 제한합니다."] },
  },
  rain: {
    normal: { level: "normal", label: "정상", emoji: EMOJI.normal, color: SAFETY_COLORS.normal, thresholdLabel: "강수 없음", headline: "호우 위험 낮음", actions: ["강수가 없거나 영향이 낮은 상태입니다.", "배수로, 집수정, 사면 등 취약 지점의 이상 여부를 평시 점검합니다.", "기상특보와 강수량 변화를 계속 확인합니다."] },
    interest: { level: "interest", label: "관심", emoji: EMOJI.interest, color: SAFETY_COLORS.interest, thresholdLabel: "강수 있음", headline: "호우 관심 단계", actions: ["우의, 미끄럼 방지화, 시야 확보 장비를 착용합니다.", "노면·통로 미끄럼과 배수 불량 구간을 우선 점검합니다.", "전기·신호 설비 접근 시 감전 위험을 확인합니다.", "침수 우려 개소와 배수 설비 상태를 현장 책임자에게 공유합니다."] },
    warning: { level: "warning", label: "주의보", emoji: EMOJI.warning, color: SAFETY_COLORS.warning, thresholdLabel: "시간당 20mm 이상", headline: "호우주의보 단계", actions: ["사면, 하천변, 저지대, 침수 우려 구역 작업을 조정합니다.", "옥외 고소 작업과 중장비 작업은 일시 중지 여부를 검토합니다.", "배수·집수 설비를 점검하고 비상 대기 인원을 지정합니다.", "근로자 비상 연락망과 대피 경로를 사전에 공유합니다."] },
    danger: { level: "danger", label: "경보", emoji: EMOJI.danger, color: SAFETY_COLORS.danger, thresholdLabel: "시간당 30mm 이상", headline: "호우경보 단계", actions: ["침수·토사 유입 위험 구역의 옥외 작업을 중지합니다.", "현장 인원을 안전지대로 대피시키고 출입을 통제합니다.", "선로 침수, 사면 붕괴, 시설 피해는 즉시 보고합니다.", "기상 안정과 안전 확인 전까지 작업 재개를 금지합니다."] },
  },
  snow: {
    normal: { level: "normal", label: "정상", emoji: EMOJI.normal, color: SAFETY_COLORS.normal, thresholdLabel: "적설 없음", headline: "강설 위험 낮음", actions: ["적설이 없거나 영향이 낮은 상태입니다.", "제설 장비와 염화칼슘 등 제설 자재 보유 상태를 확인합니다.", "기상특보와 강설 예보 변화를 계속 확인합니다."] },
    interest: { level: "interest", label: "관심", emoji: EMOJI.interest, color: SAFETY_COLORS.interest, thresholdLabel: "눈 또는 눈날림", headline: "강설 관심 단계", actions: ["방한·미끄럼 방지 보호구를 착용합니다.", "계단, 승강장, 선로 접근 통로의 결빙 위험을 점검합니다.", "제설 인력과 장비 투입 준비 상태를 확인합니다.", "열차 접근 구간 작업자는 시야 저하와 소음 차단에 유의합니다."] },
    warning: { level: "warning", label: "주의보", emoji: EMOJI.warning, color: SAFETY_COLORS.warning, thresholdLabel: "시간당 1cm 이상", headline: "대설주의보 단계", actions: ["제설·제빙 작업을 우선 시행하고 미끄럼 방지 조치를 강화합니다.", "옥외 고소 작업과 중장비 작업은 기상 상황에 따라 조정합니다.", "선로 전환기, 분기기, 건널목 등 결빙 취약 설비를 집중 점검합니다.", "근로자 보온 휴식과 2인 1조 작업을 적용합니다."] },
    danger: { level: "danger", label: "경보", emoji: EMOJI.danger, color: SAFETY_COLORS.danger, thresholdLabel: "시간당 3cm 이상", headline: "대설경보 단계", actions: ["불가피한 경우를 제외하고 옥외 작업을 중지합니다.", "열차 운행과 선로 적설 상황을 즉시 공유하고 위험 구역 출입을 통제합니다.", "고립·저체온 상황에 대비해 비상 연락체계와 대피 장소를 운영합니다.", "제설 인력과 장비는 안전 확보 후 단계적으로 투입합니다."] },
  },
};

export const HAZARD_LABEL: Record<HazardKind, string> = {
  heat: "폭염",
  cold: "한파",
  rain: "호우",
  snow: "폭설",
};

export function getStageMeta(hazard: HazardKind, level: StageLevel): StageMeta {
  return STAGE_CONTENT[hazard][level];
}

