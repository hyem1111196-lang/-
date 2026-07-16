import { useState, type CSSProperties } from "react";
import { EMERGENCY_GUIDES, EMERGENCY_CALL } from "../data/emergency";
import { HAZARD_LABEL, STAGE_CONTENT } from "../data/stageContent";
import type { Reading } from "../lib/reading";
import type { HazardKind, StageLevel } from "../lib/stages";

interface Props {
  reading: Reading | null;
}

type GuideMode = "rail" | "emergency";

const HAZARDS: HazardKind[] = ["heat", "cold"];

// 위험별 단계 목록 (폭염은 중대경보 포함 5단계, 한파는 4단계)
const STAGE_ORDER: Record<HazardKind, StageLevel[]> = {
  heat: ["normal", "interest", "warning", "danger", "critical"],
  cold: ["normal", "warning", "danger"],
};

export function GuideView({ reading }: Props) {
  const [tab, setTab] = useState<HazardKind>(reading?.primaryHazard ?? (reading?.model === "winter" ? "cold" : "heat"));
  const [mode, setMode] = useState<GuideMode>("rail");
  const guides = EMERGENCY_GUIDES.filter((g) => g.kind === tab);
  const stages = STAGE_CONTENT[tab];

  return (
    <section className="safety">
      <div className="section-title">
        <b>안전가이드</b> 조치사항 & 응급조치
      </div>

      <div className="seg seg--full seg--hazards">
        {HAZARDS.map((hazard) => (
          <button key={hazard} className={`seg__btn ${tab === hazard ? "is-on" : ""}`} onClick={() => setTab(hazard)}>
            {HAZARD_LABEL[hazard]}
          </button>
        ))}
      </div>

      <div className="guide-mode">
        <button className={`guide-mode__btn ${mode === "rail" ? "is-on" : ""}`} onClick={() => setMode("rail")}>
          조치사항
        </button>
        <button className={`guide-mode__btn guide-mode__btn--emergency ${mode === "emergency" ? "is-on" : ""}`} onClick={() => setMode("emergency")}>
          응급조치
        </button>
      </div>

      {mode === "rail" && (
        <>
          <div className="card refbox">
            <h3 className="refbox__title">{HAZARD_LABEL[tab]} 단계 기준</h3>
            <ul className="reftable">
              {STAGE_ORDER[tab].map((lv) => {
                const m = stages[lv];
                return (
                  <li key={lv}>
                    <span className="ref__dot" style={{ background: m.color }} />
                    <b>{m.label}</b>
                    <span className="ref__th">{tab === "cold" ? "기온 " : "체감온도 "}{m.thresholdLabel}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card refbox rail-actions">
            <h3 className="refbox__title">{HAZARD_LABEL[tab]} 위험별 조치사항</h3>
            {STAGE_ORDER[tab].map((lv) => {
              const m = stages[lv];
              return (
                <article key={lv} className="rail-actions__stage" style={{ "--stage": m.color } as CSSProperties}>
                  <div className="rail-actions__head">
                    <span className="ref__dot" style={{ background: m.color }} />
                    <b>{m.label}</b>
                    <span>{tab === "cold" ? "기온 " : "체감온도 "}{m.thresholdLabel}</span>
                  </div>
                  <p className="rail-actions__headline">{m.headline}</p>
                  <ul className="acts">
                    {m.actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}

      {mode === "emergency" && (
        <>
          <a className="callbtn" href={`tel:${EMERGENCY_CALL}`}>
            <span className="callbtn__num">{EMERGENCY_CALL}</span>
            <span>중증 의심 시 즉시 신고</span>
          </a>

          {guides.map((g) => (
            <article key={g.id} className="card egc">
              <header className="egc__head">
                <h3>{g.title}</h3>
                {g.red && <span className="egc__red">위급</span>}
              </header>
              <p className="egc__sum">{g.summary}</p>
              <div className="egc__cols">
                <div>
                  <h4>증상</h4>
                  <ul className="dots">
                    {g.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>응급조치</h4>
                  <ul className="dots">
                    {g.firstAid.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {g.red && <p className="egc__redline">{g.red}</p>}
            </article>
          ))}
        </>
      )}
    </section>
  );
}
