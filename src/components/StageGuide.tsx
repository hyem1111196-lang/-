import { useEffect, useState, type CSSProperties } from "react";
import { STAGE_CONTENT, HAZARD_LABEL } from "../data/stageContent";
import type { HazardKind, StageLevel } from "../lib/stages";

interface Props {
  hazard: HazardKind;
  current: StageLevel;
}

const ORDER: StageLevel[] = ["normal", "interest", "warning", "danger"];

export function StageGuide({ hazard, current }: Props) {
  const [sel, setSel] = useState<StageLevel>(current);
  useEffect(() => setSel(current), [current, hazard]);

  const content = STAGE_CONTENT[hazard];
  const meta = content[sel];

  return (
    <section className="card guide" style={{ "--stage": meta.color } as CSSProperties}>
      <div className="section-title">
        <b>{HAZARD_LABEL[hazard]}</b> 위험별 철도 조치사항
      </div>

      <div className="steps" role="tablist" aria-label="위험 단계 선택">
        {ORDER.map((lv) => {
          const m = content[lv];
          return (
            <button
              key={lv}
              role="tab"
              aria-selected={sel === lv}
              className={`step ${sel === lv ? "is-sel" : ""} ${current === lv ? "is-now" : ""}`}
              style={{ "--c": m.color } as CSSProperties}
              onClick={() => setSel(lv)}
            >
              <span className="step__label">{m.label}</span>
              <span className="step__th">{m.thresholdLabel}</span>
              {current === lv && <span className="step__now">현재</span>}
            </button>
          );
        })}
      </div>

      <div className="guide__body">
        <div className="guide__head">
          <span className="guide__emoji">{meta.emoji}</span>
          <span className="guide__headline">{meta.headline}</span>
        </div>
        <ul className="acts">
          {meta.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
