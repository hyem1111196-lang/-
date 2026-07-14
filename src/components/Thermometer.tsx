interface Props {
  /** 채움 색상 (단계 색) */
  color: string;
  /** 체감온도 °C — 막대 채움 비율 계산용 */
  feelsLikeC: number;
}

/** 체감온도 시각화 온도계. -20°C~45°C 를 막대 0~100% 로 매핑. */
export function Thermometer({ color, feelsLikeC }: Props) {
  const ratio = Math.max(0, Math.min(1, (feelsLikeC + 20) / 65));
  const stemTop = 14;
  const stemBottom = 70;
  const fillTop = stemBottom - (stemBottom - stemTop) * ratio;

  return (
    <svg className="thermo" width="34" height="96" viewBox="0 0 34 96" aria-hidden="true">
      <rect x="13" y="8" width="8" height="66" rx="4" fill="#e6edf6" />
      <rect
        x="13"
        y={fillTop}
        width="8"
        height={stemBottom - fillTop + 4}
        rx="4"
        fill={color}
        style={{ transition: "y var(--dur) var(--ease), height var(--dur) var(--ease), fill var(--dur)" }}
      />
      <circle cx="17" cy="82" r="11" fill="#e6edf6" />
      <circle cx="17" cy="82" r="8" fill={color} style={{ transition: "fill var(--dur)" }} />
    </svg>
  );
}
