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
    summary: "체온조절중추가 열자극을 견디지 못해 체온조절기능이 상실되는 질환",
    symptoms: ["고열", "중추신경 기능장애(의식장애, 혼수상태)", "건조하고 뜨거운 피부", "두통, 오한, 빈맥, 빈호흡 동반 가능"],
    firstAid: [
      "시원한 장소로 환자 이동",
      "환자의 옷을 느슨하게 함",
      "부채나 선풍기 등으로 몸 식혀주기",
      "얼음팩을 목, 겨드랑이 밑, 서혜부(사타구니)에 대어 체온 낮추기",
    ],
    red: "의식 저하·경련 시 즉시 119",
  },
  {
    id: "heat-exhaustion",
    title: "열탈진",
    kind: "heat",
    summary: "땀을 많이 흘려 수분과 염분이 적절히 공급되지 못하는 경우 발생하는 질환",
    symptoms: ["땀을 많이 흘리는 등 탈수·전해질 소실", "극심한 무력감과 피로", "근육경련, 구토, 어지럼증 동반 가능"],
    firstAid: [
      "시원한 곳에서 안정·휴식",
      "물을 섭취하여 수분 보충",
      "증상이 1시간 이상 지속·악화되면 의료기관 내원",
    ],
  },
  {
    id: "heat-cramp",
    title: "열경련",
    kind: "heat",
    summary: "수분과 염분이 과도하게 손실되어 근육경련이 발생하는 질환",
    symptoms: ["어깨, 팔, 다리, 복부, 손가락 등 근육경련"],
    firstAid: ["시원한 곳에서 안정·휴식", "물을 섭취하여 수분 보충", "경련이 일어난 곳에 근육 마사지 시행", "1시간 넘게 경련 지속 시 응급실 방문"],
  },
  {
    id: "hypothermia",
    title: "저체온증",
    kind: "cold",
    summary: "심부체온이 35°C 미만으로 떨어진 상태",
    symptoms: ["몸떨림, 피로감, 졸림, 어눌한 말투", "(경증) 인지장애", "(중등도) 의식소실, 부정맥, 호흡저하", "(중증) 혼수, 심장정지"],
    firstAid: [
      "따뜻한 장소로 환자 이동",
      "젖은 옷을 벗기고 담요 등으로 감싸기",
      "의식이 있는 경우, 따뜻한 음료로 몸 녹이기",
    ],
    red: "의식이 없는 경우 신속히 119신고하여 의료기관 이송",
  },
  {
    id: "frostbite",
    title: "동상",
    kind: "cold",
    summary: "저온에 노출되어 피부·피하조직이 동결·손상된 상태",
    symptoms: ["피부색이 흰색이나 누런 회색으로 변함", "피부 촉감이 비정상적으로 단단해짐", "피부감각이 저하되어 무감각해짐"],
    firstAid: [
      "따뜻한 장소로 환자 이동",
      "동상 부위를 따뜻한 물에 20~40분간 담그기",
      "신속히 의료기관 방문하여 치료받기",
    ],
  },
  {
    id: "chilblains",
    title: "동창",
    kind: "cold",
    summary: "추위에 지속적으로 노출 시 나타나는 피부와 피부조직의 염증반응",
    symptoms: ["피부가 붉게 변하고 가려움", "심한 경우 울혈·물집·궤양 등 발생"],
    firstAid: [
      "언 부위를 따뜻한 물에 담가 따뜻하게 하기",
      "동창 부위 마사지하여 혈액순환 유도",
      "동창 부위 청결하게 유지·보습",
    ],
  },
];

export const EMERGENCY_CALL = "119";
