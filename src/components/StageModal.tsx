import type { CSSProperties } from "react";
import { getStageMeta, HAZARD_LABEL } from "../data/stageContent";
import { formatTemp } from "../lib/format";
import type { Reading } from "../lib/reading";

interface Props {
  reading: Reading;
  onConfirm: () => void;
  onClose: () => void;
}

export function StageModal({ reading, onConfirm, onClose }: Props) {
  const meta = getStageMeta(reading.primaryHazard, reading.primaryLevel);
  const isRain = reading.primaryHazard === "rain";
  const isSnow = reading.primaryHazard === "snow";
  const amountText = reading.rn1mm < 10 ? reading.rn1mm.toFixed(1) : String(Math.round(reading.rn1mm));
  const headline = isSnow
    ? `시간당 강설 ${amountText}cm`
    : isRain
      ? `시간당 강수 ${amountText}mm`
      : `체감온도 ${formatTemp(reading.feelsLikeC)}`;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="위험별 철도 조치사항">
      <div className="modal__win" style={{ "--stage": meta.color } as CSSProperties}>
        <div className="modal__bar" />
        <div className="modal__head">
          <span className="modal__emoji">{meta.emoji}</span>
          <div>
            <p className="modal__kicker">{HAZARD_LABEL[reading.primaryHazard]} · {meta.label} 단계</p>
            <h2 className="modal__title">{headline}</h2>
          </div>
        </div>

        <p className="modal__lead">
          현재 위험 단계에 맞는 철도 현장 조치사항을 확인하세요.
        </p>

        <ul className="acts acts--modal">
          {meta.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>

        <div className="modal__btns">
          <button className="btn btn--stage" onClick={onConfirm}>
            현장 확인 및 조치 완료
          </button>
          <button className="modal__later" onClick={onClose}>
            나중에 확인
          </button>
        </div>
      </div>
    </div>
  );
}
