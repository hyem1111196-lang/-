interface Props {
  onClose: () => void;
}

const STAGES = [
  { label: "정상", c: "var(--stage-normal)" },
  { label: "관심", c: "var(--stage-interest)" },
  { label: "주의보", c: "var(--stage-warning)" },
  { label: "경보", c: "var(--stage-danger)" },
];

export function Onboarding({ onClose }: Props) {
  return (
    <div className="ob" role="dialog" aria-modal="true" aria-label="서비스 안내">
      <div className="ob__panel">
        <div className="ob__hero">
          <span className="ob__badge">전사 활용</span>
          <h2 className="ob__title">
            코레일 작업현장 AI
            <br />
            기상정보 대응시스템
          </h2>
          <p className="ob__lead">
            옥외 작업현장의 <b>폭염·한파·호우</b> 체감온도와 단계별 안전조치를 한 화면에서.
            앱 설치 없이 전 직원·협력업체 누구나.
          </p>
        </div>

        <ol className="ob__steps">
          <li>
            <span className="ob__n">1</span>
            <div>
              <b>현 위치 / 전국 지역 조회</b>
              <p>GPS로 현재 위치, 또는 전국 시·군·구를 선택해 즉시 체감온도 확인.</p>
            </div>
          </li>
          <li>
            <span className="ob__n">2</span>
            <div>
              <b>단계별 안전조치 안내</b>
              <p>위험 단계에 맞춘 4단계 안전조치 팝업으로 현장 대응을 안내.</p>
            </div>
          </li>
          <li>
            <span className="ob__n">3</span>
            <div>
              <b>예보·응급조치·현장 공유</b>
              <p>위험 시간대 예보, 온열·한랭 응급조치, QR/링크로 팀 전파.</p>
            </div>
          </li>
        </ol>

        <div className="ob__legend">
          {STAGES.map((s) => (
            <span key={s.label} className="ob__chip">
              <span className="ob__chipdot" style={{ background: s.c }} />
              {s.label}
            </span>
          ))}
        </div>

        <p className="ob__tip">
          💡 브라우저 메뉴 → <b>홈 화면에 추가</b> 하면 앱처럼 바로 실행됩니다.
        </p>

        <button className="btn btn--brand ob__go" onClick={onClose}>
          시작하기
        </button>
      </div>
    </div>
  );
}


