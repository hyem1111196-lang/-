/**
 * 계절(체감온도 모델) 자동 판별.
 *
 * 여름철 체감온도(습도 기반)와 겨울철 체감온도(풍속 기반)는 산식이 다르므로,
 * 어떤 모델을 쓸지 결정해야 한다. 월(月)을 1차 기준으로 하고, 기온이 있으면 보정한다.
 * 사용자는 UI에서 수동으로 모델을 바꿀 수 있다(이 함수는 기본값 추천용).
 */
import type { FeelsLikeModel } from "./feelsLike";

/**
 * @param month 1~12 (Date.getMonth()+1)
 * @param tempC 현재 기온(있으면 보정에 사용)
 */
export function detectSeasonModel(month: number, tempC?: number): FeelsLikeModel {
  // 기온이 확실하면 우선 적용 (10°C 이하 추위 / 22°C 이상 더위)
  if (typeof tempC === "number" && Number.isFinite(tempC)) {
    if (tempC <= 10) return "winter";
    if (tempC >= 22) return "summer";
  }
  // 월 기준: 11~3월 겨울, 4~10월 여름(더위) 모델
  return month >= 11 || month <= 3 ? "winter" : "summer";
}
