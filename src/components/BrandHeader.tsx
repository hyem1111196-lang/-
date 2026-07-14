interface Props {
  source?: "kma" | "mock";
  onInfo: () => void;
}

export function BrandHeader({ source, onInfo }: Props) {
  return (
    <header className="brand brand--compact">
      <div className="brand__top">
        <div className="brand__id">
          <span className="brand__logo" aria-hidden="true">
            KOR<span className="brand__ai">AI</span>L
          </span>
          <span className="brand__sub">작업현장 안전</span>
        </div>
        <button className="brand__info" onClick={onInfo} aria-label="서비스 안내">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="7.8" r="1.1" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="brand__titlerow">
        <h1 className="brand__title">AI 기상정보 대응 시스템</h1>
        <span className={`src-badge src-badge--${source ?? "mock"}`}>
          <span className="src-dot" />
          {source === "kma" ? "기상청 실시간" : "시범운영"}
        </span>
      </div>
    </header>
  );
}

