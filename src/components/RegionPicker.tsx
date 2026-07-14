import { useMemo, useState } from "react";
import { REGIONS, SIDO_LIST, getSigungu } from "../data/regions";

interface Props {
  onQuery: (lat: number, lon: number, label: string) => void;
}

export function RegionPicker({ onQuery }: Props) {
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");

  const sigunguList = useMemo(() => (sido ? getSigungu(sido) : []), [sido]);
  const ready = Boolean(sido && sigungu);

  const submit = () => {
    const region = REGIONS[sido]?.find((s) => s.name === sigungu);
    if (!region) return;
    onQuery(region.lat, region.lon, `${sido} ${sigungu}`);
  };

  return (
    <section className="card region">
      <div className="section-title">
        <b>지역</b> 선택 조회 · 전국
      </div>
      <div className="region__row">
        <select
          className="region__sel"
          aria-label="시·도 선택"
          value={sido}
          onChange={(e) => {
            setSido(e.target.value);
            setSigungu("");
          }}
        >
          <option value="">시·도</option>
          {SIDO_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="region__sel"
          aria-label="시·군·구 선택"
          value={sigungu}
          onChange={(e) => setSigungu(e.target.value)}
          disabled={!sido}
        >
          <option value="">시·군·구</option>
          {sigunguList.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn--brand region__go" onClick={submit} disabled={!ready}>
        이 지역 체감온도 조회
      </button>
    </section>
  );
}
