/**
 * 조회 1건의 종합 판정 (순수 함수).
 * 표시 모드(ViewMode)에 따라 체감온도 모델과 표시 위험(폭염/한파)을 결정한다.
 *
 * - 자동(auto): 계절·온도 기준으로 폭염/한파를 결정.
 * - 폭염(heat)/한파(cold): 해당 위험으로 강제 표시.
 */
import { computeFeelsLike, type FeelsLikeModel } from "./feelsLike";
import { detectSeasonModel } from "./season";
import {
  classifyHeat,
  classifyCold,
  type HazardKind,
  type StageLevel,
} from "./stages";
import type { WeatherNow } from "../providers/types";

/** 헤더 토글 모드 */
export type ViewMode = "auto" | "heat" | "cold";

export interface Reading {
  location: string;
  observedAt: Date;
  source: "kma" | "mock";
  tempC: number;
  humidityPct: number;
  windMs: number;
  rn1mm: number;
  pty: number;
  model: FeelsLikeModel;
  feelsLikeC: number;
  /** 화면 대표 위험 (폭염/한파) */
  primaryHazard: HazardKind;
  primaryLevel: StageLevel;
}

export function computeReading(
  now: WeatherNow,
  location: string,
  mode: ViewMode = "auto",
): Reading {
  const month = now.observedAt.getMonth() + 1;

  // 체감온도 산식 모델: 폭염=여름, 한파=겨울, 그 외(자동)=계절 자동판별
  const model: FeelsLikeModel =
    mode === "heat"
      ? "summer"
      : mode === "cold"
        ? "winter"
        : detectSeasonModel(month, now.tempC);

  const feelsLikeC = computeFeelsLike(
    { tempC: now.tempC, humidityPct: now.humidityPct, windMs: now.windMs },
    model,
  );

  // 표시 위험 결정 (폭염/한파): 계절 모델 기준, 모드 지정 시 우선
  let primaryHazard: HazardKind;
  if (mode === "cold") primaryHazard = "cold";
  else if (mode === "heat") primaryHazard = "heat";
  else primaryHazard = model === "winter" ? "cold" : "heat";

  const primaryLevel: StageLevel =
    primaryHazard === "cold" ? classifyCold(now.tempC) : classifyHeat(feelsLikeC);

  return {
    location,
    observedAt: now.observedAt,
    source: now.source,
    tempC: now.tempC,
    humidityPct: now.humidityPct,
    windMs: now.windMs,
    rn1mm: now.rn1mm,
    pty: now.pty,
    model,
    feelsLikeC,
    primaryHazard,
    primaryLevel,
  };
}
