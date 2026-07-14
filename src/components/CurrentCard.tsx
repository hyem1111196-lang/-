import { useState, type CSSProperties } from "react";
import { ShareSheet } from "./ShareSheet";
import { getStageMeta } from "../data/stageContent";
import { formatObservedAt, formatTemp } from "../lib/format";
import type { HourlyReading } from "../hooks/useReading";
import type { Reading } from "../lib/reading";
import { STAGE_RANK, type HazardKind, type StageLevel } from "../lib/stages";

interface Props {
  reading: Reading | null;
  hourly: HourlyReading[];
  loading: boolean;
  error: string | null;
  onGps: () => void;
  onToggleFav: () => void;
  onOpenSafety: () => void;
  onOpenForecast: (hazard: HazardKind) => void;
  isFav: boolean;
}

const HAZARD_LABEL: Record<HazardKind, string> = {
  heat: "\uD3ED\uC5FC",
  rain: "\uD638\uC6B0",
  snow: "\uAC15\uC124",
  cold: "\uD55C\uD30C",
};

const LEVEL_LABEL: Record<StageLevel, string> = {
  normal: "\uC548\uC804",
  interest: "\uAD00\uC2EC",
  warning: "\uC8FC\uC758\uBCF4",
  danger: "\uACBD\uBCF4",
};

const SUMMER_HAZARDS: HazardKind[] = ["heat", "rain"];
const WINTER_HAZARDS: HazardKind[] = ["snow", "cold"];

const HAZARD_STAGE_KEY: Record<HazardKind, keyof Pick<HourlyReading, "heatLevel" | "rainLevel" | "snowLevel" | "coldLevel">> = {
  heat: "heatLevel",
  rain: "rainLevel",
  snow: "snowLevel",
  cold: "coldLevel",
};

function maxLevel(levels: StageLevel[]): StageLevel {
  return levels.reduce<StageLevel>((max, level) => (STAGE_RANK[level] > STAGE_RANK[max] ? level : max), "normal");
}

function dateShort(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function levelText(hazard: HazardKind, level: StageLevel, date: Date) {
  if (level === "normal") return `${dateShort(date)} ${LEVEL_LABEL.normal}`;
  if (level === "interest") return `${dateShort(date)} ${LEVEL_LABEL.interest}`;
  return `${dateShort(date)} ${HAZARD_LABEL[hazard]}${LEVEL_LABEL[level]}`;
}

function valueText(hazard: HazardKind, reading: Reading, hourly: HourlyReading[]) {
  if (hazard === "heat") {
    const values = [reading.feelsLikeC, ...hourly.map((h) => h.heatFeelsLikeC)].filter(Number.isFinite);
    return `\uCD5C\uACE0 \uCCB4\uAC10\uC628\uB3C4 ${formatTemp(Math.max(...values))}`;
  }
  if (hazard === "cold") {
    const values = [reading.feelsLikeC, ...hourly.map((h) => h.coldFeelsLikeC)].filter(Number.isFinite);
    return `\uCD5C\uC800 \uCCB4\uAC10\uC628\uB3C4 ${formatTemp(Math.min(...values))}`;
  }
  if (hazard === "rain") {
    const values = [reading.rn1mm, ...hourly.map((h) => h.rn1mm)].filter(Number.isFinite);
    const max = Math.max(...values);
    return `\uCD5C\uACE0 \uAC15\uC218\uB7C9 ${max < 10 ? max.toFixed(1) : Math.round(max)}mm`;
  }
  const values = [reading.primaryHazard === "snow" ? reading.rn1mm : 0, ...hourly.map((h) => h.rn1mm)].filter(Number.isFinite);
  const max = Math.max(...values);
  return `\uCD5C\uACE0 \uC801\uC124\uB7C9 ${max < 10 ? max.toFixed(1) : Math.round(max)}cm`;
}

function getOperationalSeason(date: Date) {
  const month = date.getMonth() + 1;
  return month >= 11 || month <= 3 ? "winter" : "summer";
}

function WeatherFocus({ reading, hourly, onOpenSafety, onOpenForecast }: { reading: Reading; hourly: HourlyReading[]; onOpenSafety: () => void; onOpenForecast: (hazard: HazardKind) => void }) {
  const season = getOperationalSeason(reading.observedAt);
  const focusHazards = season === "winter" ? WINTER_HAZARDS : SUMMER_HAZARDS;

  const summaryFor = (hazard: HazardKind) => {
    const currentLevel = reading.primaryHazard === hazard ? reading.primaryLevel : "normal";
    const forecastItems = hourly.map((h) => ({ time: h.time, level: h[HAZARD_STAGE_KEY[hazard]] as StageLevel }));
    const level = maxLevel([currentLevel, ...forecastItems.map((item) => item.level)]);
    const date = level !== "normal" ? forecastItems.find((item) => item.level === level)?.time ?? reading.observedAt : reading.observedAt;
    return { level, date };
  };

  return (
    <div className="weather-focus">
      <div className="weather-focus__main">
        <strong>{"\uC624\uB298 \uC911\uC810 \uD655\uC778 \uC704\uD5D8"}</strong>
        <span>{"\uD604\uD669\uC740 \uAE30\uC0C1\uCCAD \uCD08\uB2E8\uAE30\uC2E4\uD669, \uC608\uBCF4\uB294 \uB2E8\uAE30\uC608\uBCF4 0\uC2DC~24\uC2DC \uAE30\uC900\uC785\uB2C8\uB2E4."}</span>
      </div>
      <div className="weather-focus__chips" aria-label="forecast hazard status">
        {focusHazards.map((hazard) => {
          const { level, date } = summaryFor(hazard);
          const meta = getStageMeta(hazard, level);
          return (
            <button key={hazard} className={`weather-focus__chip level-${level}`} style={{ "--stage": meta.color } as CSSProperties} onClick={() => onOpenForecast(hazard)}>
              <b>{HAZARD_LABEL[hazard]}</b>
              <span>{levelText(hazard, level, date)}</span>
              <em>{valueText(hazard, reading, hourly)}</em>
              <small>{LEVEL_LABEL[level]}</small>
            </button>
          );
        })}
      </div>
      <button className="weather-focus__guide" onClick={onOpenSafety}>
        {"\uC704\uD5D8\uBCC4 \uC870\uCE58\uC0AC\uD56D\uC740 \uC548\uC804\uAC00\uC774\uB4DC\uC5D0\uC11C \uBCF4\uAE30"}
      </button>
    </div>
  );
}

export function CurrentCard({ reading, hourly, loading, error, onGps, onToggleFav, onOpenSafety, onOpenForecast, isFav }: Props) {
  const [share, setShare] = useState(false);
  const meta = reading ? getStageMeta(reading.primaryHazard, reading.primaryLevel) : null;
  const isRain = reading?.primaryHazard === "rain";
  const isSnow = reading?.primaryHazard === "snow";
  const isPrecip = isRain || isSnow;
  const amountText = reading ? (reading.rn1mm < 10 ? reading.rn1mm.toFixed(1) : String(Math.round(reading.rn1mm))) : "0";
  const amountUnit = isSnow ? "cm" : "mm";
  const amountCap = isSnow ? "\uC2DC\uAC04\uB2F9 \uC801\uC124\uB7C9" : "\uC2DC\uAC04\uB2F9 \uAC15\uC218\uB7C9";

  return (
    <section className="current" style={meta ? ({ "--stage": meta.color } as CSSProperties) : undefined}>
      <button className="btn btn--gps" onClick={onGps} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
        {loading ? "\uC704\uCE58\u00B7\uB0A0\uC528 \uBD84\uC11D \uC911..." : "\uB0B4 \uC704\uCE58 \uC2E4\uC2DC\uAC04 \uC870\uD68C"}
      </button>
      <p className="privacy-note">{"\uC704\uCE58 \uC870\uD68C\uB9CC \uC0AC\uC6A9\uD558\uBA70 \uB530\uB85C \uC815\uBCF4\uB97C \uAC00\uC838\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."}</p>

      {error && <p className="current__error">{error}</p>}

      {!reading && !error && (
        <div className="current__skeleton" aria-hidden="true">
          <div className="sk sk--num" />
          <div className="sk sk--row" />
          <div className="sk sk--row" />
        </div>
      )}

      {reading && meta && (
        <>
          <div className="current__hero current__hero--plain">
            <div className="current__big">
              <div className="current__feel">
                {isPrecip ? (
                  <>{amountText}<span className="current__unit">{amountUnit}</span></>
                ) : (
                  formatTemp(reading.feelsLikeC)
                )}
              </div>
              <div className="current__feel-cap">{isPrecip ? amountCap : "\uCCB4\uAC10\uC628\uB3C4"}</div>
            </div>
          </div>

          <div className="stagechip" data-level={reading.primaryLevel}>
            <span className="stagechip__emoji">{meta.emoji}</span>
            <b>{LEVEL_LABEL[reading.primaryLevel]}</b>
            <span className="stagechip__th">{meta.thresholdLabel}</span>
          </div>

          <WeatherFocus reading={reading} hourly={hourly} onOpenSafety={onOpenSafety} onOpenForecast={onOpenForecast} />

          <dl className="current__grid">
            <div><dt>{"\uAE30\uC628"}</dt><dd>{formatTemp(reading.tempC)}</dd></div>
            <div><dt>{"\uC2B5\uB3C4"}</dt><dd>{Math.round(reading.humidityPct)}%</dd></div>
            <div>
              <dt>{isPrecip ? "\uCCB4\uAC10\uC628\uB3C4" : "\uBC14\uB78C"}</dt>
              <dd>{isPrecip ? formatTemp(reading.feelsLikeC) : `${reading.windMs.toFixed(1)} m/s`}</dd>
            </div>
            <div className="current__grid-wide"><dt>{"\uD604\uC7AC \uC9C0\uC5ED"}</dt><dd>{reading.location}</dd></div>
            <div className="current__grid-wide"><dt>{"\uC870\uD68C \uC2DC\uAC01"}</dt><dd className="current__time">{formatObservedAt(reading.observedAt)}</dd></div>
          </dl>

          <div className="current__actions">
            <button className={`btn btn--ghost ${isFav ? "is-fav" : ""}`} onClick={onToggleFav}>{isFav ? "\u2605 \uC990\uACA8\uCC3E\uAE30\uB428" : "\u2606 \uD604\uC7A5 \uC990\uACA8\uCC3E\uAE30"}</button>
            <button className="btn btn--ghost" onClick={() => setShare(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 6l-4-4-4 4M12 2v13M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              {"\uD604\uC7A5 \uACF5\uC720"}
            </button>
          </div>
        </>
      )}

      {share && reading && <ShareSheet reading={reading} onClose={() => setShare(false)} />}
    </section>
  );
}