/**
 * 조회 1건의 종합 판정 (순수 함수).
 * 표시 모드(ViewMode)에 따라 체감온도 모델과 표시 위험(폭염/한파/호우)을 결정한다.
 *
 * - 자동(auto): 비가 오는 중이면 호우, 아니면 계절·온도 기준 폭염/한파.
 * - 폭염(heat)/한파(cold)/호우(rain): 해당 위험으로 강제 표시.
 */
import { computeFeelsLike, type FeelsLikeModel } from "./feelsLike";
import { detectSeasonModel } from "./season";
import {
  classifyHeat,
  classifyCold,
  classifyRain,
  classifySnow,
  isSnowPty,
  type HazardKind,
  type StageLevel,
} from "./stages";
import type { WeatherNow } from "../providers/types";

/** 헤더 토글 모드 */
export type ViewMode = "auto" | "heat" | "rain" | "snow" | "cold";

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
  /** 비가 오는 중인지 (강수형태/강수량 기준) */
  isRaining: boolean;
  /** 화면 대표 위험 (폭염/한파/호우) */
  primaryHazard: HazardKind;
  primaryLevel: StageLevel;
}

function isRainingNow(now: WeatherNow): boolean {
  return (now.pty ?? 0) > 0 || (now.rn1mm ?? 0) > 0;
}

export function computeReading(
  now: WeatherNow,
  location: string,
  mode: ViewMode = "auto",
): Reading {
  const month = now.observedAt.getMonth() + 1;

  // 체감온도 산식 모델: 폭염=여름, 한파·폭설=겨울, 그 외(자동/호우)=계절 자동판별
  const model: FeelsLikeModel =
    mode === "heat"
      ? "summer"
      : mode === "cold" || mode === "snow"
        ? "winter"
        : detectSeasonModel(month, now.tempC);

  const feelsLikeC = computeFeelsLike(
    { tempC: now.tempC, humidityPct: now.humidityPct, windMs: now.windMs },
    model,
  );

  const raining = isRainingNow(now);
  const snowing = isSnowPty(now.pty ?? 0);

  // 표시 위험 결정 (자동 우선순위: 폭설 > 호우 > 온도)
  let primaryHazard: HazardKind;
  if (mode === "heat") primaryHazard = "heat";
  else if (mode === "cold") primaryHazard = "cold";
  else if (mode === "rain") primaryHazard = "rain";
  else if (mode === "snow") primaryHazard = "snow";
  else primaryHazard = snowing ? "snow" : raining ? "rain" : model === "winter" ? "cold" : "heat";

  const primaryLevel: StageLevel =
    primaryHazard === "snow"
      ? classifySnow({ snoCm: now.rn1mm, pty: now.pty })
      : primaryHazard === "rain"
        ? classifyRain({ rn1mm: now.rn1mm, pty: now.pty })
        : primaryHazard === "cold"
          ? classifyCold(feelsLikeC)
          : classifyHeat(feelsLikeC);

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
    isRaining: raining,
    primaryHazard,
    primaryLevel,
  };
}
