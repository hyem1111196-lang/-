import { useState } from "react";
import { QrImage } from "./QrImage";
import { getStageMeta } from "../data/stageContent";
import { formatTemp, formatObservedAt } from "../lib/format";
import type { Reading } from "../lib/reading";

interface Props {
  reading: Reading;
  onClose: () => void;
}

export function ShareSheet({ reading, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const meta = getStageMeta(reading.primaryHazard, reading.primaryLevel);

  const summary = `[코레일 체감온도 안전] ${reading.location}
체감온도 ${formatTemp(reading.feelsLikeC)} · ${meta.label} 단계
(${formatObservedAt(reading.observedAt)})
▶ 현장 조치: ${meta.actions[0]}
도구 바로가기: ${url}`;

  const doShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "코레일 체감온도 안전", text: summary });
        return;
      } catch {
        /* 취소 시 폴백 */
      }
    }
    await copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="현장 공유" onClick={onClose}>
      <div className="sheet__panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" aria-hidden="true" />
        <h2 className="sheet__title">현장 공유 · 전파</h2>
        <p className="sheet__desc">현재 위험 상황을 팀에 전달하거나, QR로 이 도구를 즉시 공유하세요.</p>

        <div className="sheet__qr">
          <QrImage text={url} />
          <span className="sheet__qrcap">QR 스캔 → 도구 바로 접속</span>
        </div>

        <pre className="sheet__summary">{summary}</pre>

        <div className="sheet__btns">
          <button className="btn btn--brand" onClick={doShare}>
            공유하기
          </button>
          <button className="btn btn--ghost" onClick={copy}>
            {copied ? "복사됨 ✓" : "내용 복사"}
          </button>
        </div>
        <button className="sheet__close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
