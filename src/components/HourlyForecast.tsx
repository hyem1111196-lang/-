import { useEffect, useState, type CSSProperties } from "react";
import type { HourlyReading } from "../hooks/useReading";
import { STAGE_CONTENT } from "../data/stageContent";
import type { Reading } from "../lib/reading";
import { STAGE_RANK, type HazardKind, type StageLevel } from "../lib/stages";

interface Props {
  hourly: HourlyReading[];
  ultraHourly: HourlyReading[];
  reading: Reading | null;
  loading: boolean;
  hazardOverride?: HazardKind | null;
  dataMock?: boolean;
}

const HAZARD_LABEL: Record<HazardKind, string> = {
  heat: "\uD3ED\uC5FC",
  cold: "\uD55C\uD30C",
};

const SUMMER_HAZARDS: HazardKind[] = ["heat"];
const WINTER_HAZARDS: HazardKind[] = ["cold"];

/** \uC870\uD68C \uC2DC\uAC01\uC758 \uC6D4 \uAE30\uC900 \uACC4\uC808 \uC704\uD5D8(\uC5EC\uB984 4~10\uC6D4: \uD3ED\uC5FC\u00B7\uD638\uC6B0 / \uACA8\uC6B8 11~3\uC6D4: \uD3ED\uC124\u00B7\uD55C\uD30C) */
function seasonHazards(date: Date): HazardKind[] {
  const month = date.getMonth() + 1;
  return month >= 11 || month <= 3 ? WINTER_HAZARDS : SUMMER_HAZARDS;
}

const STAGE_VAR: Record<StageLevel, string> = {
  normal: "var(--stage-normal)",
  interest: "var(--stage-interest)",
  warning: "var(--stage-warning)",
  danger: "var(--stage-danger)",
  critical: "var(--stage-critical)",
};

const VIEW_W = 340; // 고정 뷰박스 폭 — 막대 개수가 5~6개로 달라져도 동일 비율로 균등 분배
const CHART_H = 224;

function valueOf(h: HourlyReading, hazard: HazardKind) {
  if (hazard === "cold") return h.tempC;
  return h.heatFeelsLikeC;
}

function levelOf(h: HourlyReading, hazard: HazardKind): StageLevel {
  if (hazard === "cold") return h.coldLevel;
  return h.heatLevel;
}

function makeDayTimeline(hourly: HourlyReading[], base: Date) {
  if (!hourly.length) return [];
  const day = new Date(base);
  day.setHours(0, 0, 0, 0);
  return Array.from({ length: 25 }, (_, hour) => {
    const target = new Date(day);
    target.setHours(hour, 0, 0, 0);
    const exact = hourly.find((item) => sameHour(item.time, target));
    if (exact) return { ...exact, time: target };
    const nearest = [...hourly].sort((a, b) => Math.abs(a.time.getTime() - target.getTime()) - Math.abs(b.time.getTime() - target.getTime()))[0];
    return { ...nearest, time: target };
  });
}

function sameHour(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
    && a.getHours() === b.getHours();
}

function renderBars(hourly: HourlyReading[], hazard: HazardKind) {
  const values = hourly.map((h) => valueOf(h, hazard));
  const isCold = hazard === "cold";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(6, max - min);
  const H = 150;
  const padTop = 26;
  const n = hourly.length || 1;
  const slot = VIEW_W / n; // \uB9C9\uB300 \uD55C \uCE78 \uD3ED \u2014 \uAC1C\uC218\uC5D0 \uB9DE\uCDB0 \uADE0\uB4F1 \uBD84\uBC30
  const barW = Math.min(38, slot * 0.5);
  const extreme = isCold ? min : max;

  return hourly.map((h, i) => {
    const value = valueOf(h, hazard);
    const level = levelOf(h, hazard);
    const ratio = (value - min) / span;
    const barH = padTop + ratio * H;
    const cx = (i + 0.5) * slot;
    const y = 190 - barH;
    const isExtreme = value === extreme;
    const label = `${value.toFixed(1)}\u00B0`;
    return (
      <g key={`${h.time.toISOString()}-${i}`}>
        <rect x={cx - barW / 2} y={y} width={barW} height={barH} rx="6" fill={STAGE_VAR[level]} />
        <text x={cx} y={y - 6} className={`forecast__val ${isExtreme ? "is-extreme" : ""}`}>{label}</text>
        <text x={cx} y={214} className="forecast__hr">{`${h.time.getHours()}\uC2DC`}</text>
      </g>
    );
  });
}

function maxStage(items: HourlyReading[], hazard: HazardKind): StageLevel {
  return items.reduce<StageLevel>((max, h) => (STAGE_RANK[levelOf(h, hazard)] > STAGE_RANK[max] ? levelOf(h, hazard) : max), "normal");
}

function summary(hourly: HourlyReading[], hazard: HazardKind) {
  const isCold = hazard === "cold";
  const target = hourly.reduce((pick, item) => {
    if (!pick) return item;
    return isCold ? (valueOf(item, hazard) < valueOf(pick, hazard) ? item : pick) : valueOf(item, hazard) > valueOf(pick, hazard) ? item : pick;
  }, null as HourlyReading | null);
  const value = target ? valueOf(target, hazard) : 0;
  const level = target ? levelOf(target, hazard) : "normal";
  const hour = target ? `${target.time.getHours()}\uC2DC` : "-";
  const label =
    hazard === "cold"
      ? `\uCD5C\uC800 \uAE30\uC628 ${value.toFixed(1)}\u00B0C`
      : `\uCD5C\uACE0 \uCCB4\uAC10\uC628\uB3C4 ${value.toFixed(1)}\u00B0C`;
  return { label, hour, level };
}

function levelLabel(level: StageLevel) {
  return level === "normal" ? "\uC548\uC804" : level === "interest" ? "\uAD00\uC2EC" : level === "warning" ? "\uC8FC\uC758\uBCF4" : level === "critical" ? "\uC911\uB300\uACBD\uBCF4" : "\uACBD\uBCF4";
}

export function HourlyForecast({ hourly, ultraHourly, reading, loading, hazardOverride, dataMock }: Props) {
  const tabs = seasonHazards(reading?.observedAt ?? new Date());
  const [selected, setSelected] = useState<HazardKind>(hazardOverride ?? reading?.primaryHazard ?? tabs[0]);

  // 현황 화면 칩으로 특정 위험을 지정해 들어오면 그 위험으로 맞춘다.
  useEffect(() => {
    if (hazardOverride) setSelected(hazardOverride);
  }, [hazardOverride]);

  const hazard = tabs.includes(selected) ? selected : tabs[0];
  const dayHourly = makeDayTimeline(hourly, reading?.observedAt ?? new Date());
  // 그래프: 초단기예보(앞 6시간, 1시간마다 갱신)만 사용. 로딩 중엔 비워둠 → 24개→6개 깜빡임 방지.
  const chartData = [...ultraHourly].sort((a, b) => a.time.getTime() - b.time.getTime());
  // 오늘 예상 최고: 하루 전체(단기예보) 기준이되, 그래프에 보이는 앞 6시간은
  // 초단기예보 값으로 덮어써 그래프 막대와 최고값이 어긋나지 않게 한다.
  const ultraByHour = new Map(chartData.map((h) => [h.time.getHours(), h]));
  const peakSource = dayHourly.length
    ? dayHourly.map((h) => ultraByHour.get(h.time.getHours()) ?? h)
    : chartData;
  const hasAny = dayHourly.length > 0 || chartData.length > 0;
  const title = hazard === "cold" ? "기온 예보" : "체감온도 예보";

  if (!hasAny) {
    // \uC870\uD68C \uC911\uC774\uAC70\uB098 \uD604\uC7AC\uAC12\uC774 \uC774\uBBF8 \uC788\uC73C\uBA74 \uC608\uBCF4\uAC00 \uC624\uB294 \uC911 \u2192 \uB85C\uB529 \uD45C\uC2DC. \uC544\uC9C1 \uC870\uD68C \uC804\uC77C \uB54C\uB9CC \uC548\uB0B4.
    if (loading || reading) return <section className="card pad">{"\uC608\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911..."}</section>;
    return (
      <section className="card pad empty">
        <p>{"\uC2DC\uAC04\uB300\uBCC4 \uC608\uBCF4 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
        <p className="muted">{"\uD604\uD669 \uD0ED\uC5D0\uC11C \uC704\uCE58\uB97C \uBA3C\uC800 \uC870\uD68C\uD574\uC8FC\uC138\uC694."}</p>
      </section>
    );
  }

  const unit = "\u00B0C";
  const top = summary(peakSource, hazard);
  const stage = maxStage(peakSource, hazard);
  const stageMeta = STAGE_CONTENT[hazard][stage];
  const chartWidth = VIEW_W;
  // 하루 예보(단기예보)가 아직 안 왔으면 '오늘 최고'를 계산하지 않고 '불러오는 중' 표시.
  const peakReady = dayHourly.length > 0;

  return (
    <section className="forecast">
      <div className="section-title"><b>{HAZARD_LABEL[hazard]}</b> {title}</div>

      {dataMock && (
        <p className="current__mockwarn">{"⚠️ 실시간 연결 실패 — 예보는 임시값입니다. 담당자에게 문의하세요"}</p>
      )}

      {tabs.length > 1 && (
        <div className="forecast-tabs" role="tablist" aria-label={"예보 위험 선택"}>
          {tabs.map((h) => (
            <button
              key={h}
              type="button"
              role="tab"
              aria-selected={h === hazard}
              className={`forecast-tab ${h === hazard ? "is-active" : ""}`}
              onClick={() => setSelected(h)}
            >
              {HAZARD_LABEL[h]}
            </button>
          ))}
        </div>
      )}

      <div className="forecast-peak card" style={{ "--stage": peakReady ? STAGE_VAR[top.level] : "#94a3b8" } as CSSProperties}>
        <span className="forecast-peak__kicker">{"\uC624\uB298 0\uC2DC~24\uC2DC \uC911 \uCD5C\uACE0 \uC704\uD5D8\uAC12"}</span>
        <strong>{peakReady ? top.label : "불러오는 중..."}</strong>
        {peakReady && <span>{top.hour} · {levelLabel(top.level)}</span>}
      </div>

      <div className="forecast__chartwrap" aria-label="hourly forecast horizontal scroll area">
        <div className="forecast__unit">{unit}</div>
        {chartData.length > 0 ? (
          <svg className="forecast__chart" width={chartWidth} height={CHART_H} viewBox={`0 0 ${chartWidth} ${CHART_H}`} preserveAspectRatio="none" role="img" aria-label={title}>
            {renderBars(chartData, hazard)}
          </svg>
        ) : (
          <div style={{ height: CHART_H, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: 600 }}>{"예보 그래프 불러오는 중..."}</div>
        )}
      </div>

      <div className="forecast__advice card">
        <div className="forecast-actions" style={{ "--stage": stageMeta.color } as CSSProperties}>
          <h3>{"\uC624\uB298 \uC608\uC0C1 \uCD5C\uACE0 \u00B7 "}{HAZARD_LABEL[hazard]} {levelLabel(stage)} {"\uB2E8\uACC4 \uC870\uCE58\uC0AC\uD56D"}</h3>
          <ul className="acts">
            {stageMeta.actions.map((action, i) => <li key={i}>{action}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}