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
  maxStage,
  STAGE_RANK,
  type HazardKind,
  type StageLevel,
} from "./stages";
import type { WeatherNow } from "../providers/types";
import {
  locationFromLabel,
  matchWarnings,
  warningStageFor,
  type MatchedWarning,
  type WarningStatus,
} from "./warnings";

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
  /** 측정값(기온·체감온도)만으로 판정한 단계 */
  measuredLevel: StageLevel;
  /** 기상청 특보(현 위치 발효분)로 판정한 대표 위험의 단계 — 없으면 normal */
  warningLevel: StageLevel;
  /** 대표 단계가 특보에서 왔는지(특보가 측정값보다 높거나 같을 때) */
  levelSource: "warning" | "measure";
  /** 현 위치에 해당하는 기상청 특보(한파·폭염·대설·호우 등). full=발효, partial=시도 내 다른 구역 */
  warnings: MatchedWarning[];
  /** 특보 현황 조회 상태 — none이면 조회 실패(측정값 기준으로만 판정) */
  warningSource: "kma" | "none";
  warningIssuedAt: Date | null;
}

export function computeReading(
  now: WeatherNow,
  location: string,
  mode: ViewMode = "auto",
  warningStatus: WarningStatus | null = null,
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

  const measuredLevel: StageLevel =
    primaryHazard === "cold" ? classifyCold(now.tempC) : classifyHeat(feelsLikeC);

  // 기상청 특보 대조: 한파는 특보 조건(전날 대비 하강폭·평년값·2일 지속 등)을 기온만으로 판정할 수 없으므로
  // 발효 중인 한파특보를 단계에 반영한다(측정값과 특보 중 더 위험한 쪽).
  // 폭염은 작업장 조치 기준이 '현재 체감온도'(고용노동부 가이드)라 특보는 참고 표시만 하고 단계는 체감온도로 판정한다.
  const warnings = matchWarnings(warningStatus, locationFromLabel(location));
  const warningLevel = warningStageFor(warnings, primaryHazard);
  const primaryLevel = primaryHazard === "cold" ? maxStage(measuredLevel, warningLevel) : measuredLevel;
  const levelSource: Reading["levelSource"] =
    primaryHazard === "cold" && warningLevel !== "normal" && STAGE_RANK[warningLevel] >= STAGE_RANK[measuredLevel]
      ? "warning"
      : "measure";

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
    measuredLevel,
    warningLevel,
    levelSource,
    warnings,
    warningSource: warningStatus?.source ?? "none",
    warningIssuedAt: warningStatus?.issuedAt ?? null,
  };
}
