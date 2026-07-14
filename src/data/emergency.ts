/**
 * 온열·한랭질환 응급조치 가이드 (현장 빠른 참조).
 * 출처: 질병관리청·고용노동부 온열/한랭질환 예방 가이드 기반 요약.
 * 일반 응급처치 안내이며, 중증 의심 시 즉시 119.
 */
import type { HazardKind } from "../lib/stages";

export interface EmergencyGuide {
  id: string;
  /** 질환명 */
  title: string;
  kind: Extract<HazardKind, "heat" | "cold">;
  /** 한 줄 설명 */
  summary: string;
  /** 주요 증상 */
  symptoms: string[];
  /** 응급조치 */
  firstAid: string[];
  /** 위급 신호(즉시 119) */
  red?: string;
}

export const EMERGENCY_GUIDES: EmergencyGuide[] = [
  {
    id: "heatstroke",
    title: "열사병",
    kind: "heat",
    summary: "체온조절 실패로 체온이 급격히 상승하는 응급상황(치명적).",
    symptoms: ["체온 40°C 이상", "의식 저하·혼수", "땀이 나지 않고 피부가 뜨겁고 건조", "두통·어지러움·구역"],
    firstAid: [
      "즉시 119 신고",
      "시원한 곳으로 옮기고 옷을 느슨하게",
      "찬물 분무·얼음팩(목·겨드랑이·사타구니)으로 적극 냉각",
      "의식 없으면 음료 억지로 먹이지 말 것",
    ],
    red: "의식 저하·경련 시 즉시 119",
  },
  {
    id: "heat-exhaustion",
    title: "열탈진",
    kind: "heat",
    summary: "땀을 많이 흘려 수분·염분이 부족해진 상태.",
    symptoms: ["많은 땀·창백", "어지러움·무력감", "두통·구역·빠른 맥박", "체온은 정상~약간 상승"],
    firstAid: [
      "시원한 곳에서 안정·휴식",
      "물 또는 이온음료로 수분·염분 보충",
      "증상이 1시간 이상 지속·악화되면 병원 이송",
    ],
  },
  {
    id: "heat-cramp",
    title: "열경련",
    kind: "heat",
    summary: "땀으로 염분이 빠져 근육에 경련이 오는 상태.",
    symptoms: ["팔·다리·복부 근육 경련·통증", "많은 땀"],
    firstAid: ["시원한 곳에서 휴식", "이온음료·소금물로 염분 보충", "경련 부위 가볍게 마사지·스트레칭", "1시간 이상 지속 시 병원"],
  },
  {
    id: "hypothermia",
    title: "저체온증",
    kind: "cold",
    summary: "체온이 35°C 미만으로 떨어진 상태(중증 시 생명 위협).",
    symptoms: ["심한 떨림", "말이 어눌·발음 곤란", "기억·판단력 저하", "졸음·의식 저하"],
    firstAid: [
      "즉시 119 신고",
      "따뜻한 실내로 이동, 젖은 옷 제거 후 담요로 보온",
      "의식 있으면 따뜻한 단 음료 제공",
      "겨드랑이·배 등 몸통 중심부터 데우기",
    ],
    red: "의식 저하·떨림이 멈춘 무기력 상태는 즉시 119",
  },
  {
    id: "frostbite",
    title: "동상",
    kind: "cold",
    summary: "피부·조직이 어는 손상(귀·코·손·발 등 말단).",
    symptoms: ["피부가 창백·누렇거나 붉음", "감각 둔화·따끔거림", "심하면 물집·피부 단단해짐"],
    firstAid: [
      "따뜻한 곳으로 이동",
      "37~39°C 따뜻한 물에 20~30분 담그기(직접 불·비비기 금지)",
      "손가락·발가락 사이 거즈로 분리",
      "심하면 병원 이송",
    ],
  },
];

export const EMERGENCY_CALL = "119";
