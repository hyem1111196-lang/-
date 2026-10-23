import type { Reading } from "../lib/reading";
import { formatIssuedAt, type MatchedWarning } from "../lib/warnings";

interface Props {
  reading: Reading;
  /** 간략 표시(예보 화면 등): 발효 특보만, 안내문 없이 */
  compact?: boolean;
}

/** 기상청 기상특보 배지 — 현 위치에 발효 중인 특보(한파·폭염·대설·호우 등)와 조회 상태 */
export function WarningBadges({ reading, compact = false }: Props) {
  const full = reading.warnings.filter((w) => w.match === "full");
  const partial = reading.warnings.filter((w) => w.match === "partial");
  const seasonLabel = reading.primaryHazard === "cold" ? "한파" : "폭염";
  const measureLabel = reading.primaryHazard === "cold" ? "기온" : "체감온도";

  // 특보 조회 실패 시에는 아무것도 표시하지 않는다(기온·체감온도 기준 판정은 그대로 동작).
  if (reading.warningSource === "none") return null;

  if (full.length === 0 && partial.length === 0) {
    if (compact) return null;
    return (
      <p className="wrn wrn--none" aria-label="weather warning status">
        {`현재 위치에 발효 중인 기상특보 없음 · ${measureLabel} 기준 판정`}
        {reading.warningIssuedAt && <small>{`(기상청 ${formatIssuedAt(reading.warningIssuedAt)})`}</small>}
      </p>
    );
  }

  return (
    <div className="wrn-list" aria-label="weather warnings in effect">
      {full.map((w) => (
        <Badge key={`f-${w.entry.name}`} w={w} issued={reading.warningIssuedAt} />
      ))}
      {!compact &&
        partial.map((w) => (
          <Badge key={`p-${w.entry.name}`} w={w} issued={reading.warningIssuedAt} />
        ))}
      {!compact && full.some((w) => w.entry.hazard === "cold") && reading.primaryHazard === "cold" && (
        <p className="wrn wrn--note">{`${seasonLabel}특보 발효 중 — 기상청 특보 기준으로 단계를 표시합니다.`}</p>
      )}
      {!compact && full.some((w) => w.entry.hazard === "heat") && reading.primaryHazard === "heat" && (
        <p className="wrn wrn--note">{"폭염특보 발효 중 — 작업 조치 단계는 현재 체감온도 기준입니다."}</p>
      )}
    </div>
  );
}

function Badge({ w, issued }: { w: MatchedWarning; issued: Date | null }) {
  const partial = w.match === "partial";
  return (
    <span className={`wrn-badge wrn-badge--${w.entry.level} ${partial ? "is-partial" : ""}`}>
      <b>{`기상청 ${w.entry.name}`}</b>
      <span>{partial ? "같은 시도 내 다른 구역 발효" : "발효 중"}</span>
      {issued && <small>{formatIssuedAt(issued)}</small>}
    </span>
  );
}
