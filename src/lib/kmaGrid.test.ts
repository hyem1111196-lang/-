import { describe, it, expect } from "vitest";
import { latLonToGrid, getBaseDateTimeCandidates } from "./kmaGrid";

describe("latLonToGrid — 기상청 격자 변환", () => {
  it("구로구 고척동 좌표 → 격자 {58,125} (라이브 API 실측 정답)", () => {
    // 원본 서비스 기본 위치이자 실제 기상청 응답 grid 값
    expect(latLonToGrid(37.5012, 126.8621)).toEqual({ x: 58, y: 125 });
  });

  it("서울 도심(종로 인근) → 격자 {60,127} 부근", () => {
    const g = latLonToGrid(37.5714, 126.9658);
    expect(g.x).toBe(60);
    expect(g.y).toBe(127);
  });

  it("부산 인근 격자는 서울보다 동남쪽(x↑, y↓)", () => {
    const seoul = latLonToGrid(37.5714, 126.9658);
    const busan = latLonToGrid(35.1796, 129.0756);
    expect(busan.x).toBeGreaterThan(seoul.x);
    expect(busan.y).toBeLessThan(seoul.y);
  });
});

describe("getBaseDateTimeCandidates — 발표시각 산정", () => {
  it("45분 이전이면 직전 정시를 기준으로 한다", () => {
    const now = new Date(2026, 5, 26, 10, 11); // 10:11
    const [first] = getBaseDateTimeCandidates(now);
    expect(first.time).toBe("0900");
    expect(first.date).toBe("20260626");
  });

  it("45분 이후면 현재 정시를 기준으로 한다", () => {
    const now = new Date(2026, 5, 26, 10, 50); // 10:50
    const [first] = getBaseDateTimeCandidates(now);
    expect(first.time).toBe("1000");
  });

  it("hoursBack 만큼 과거 후보를 생성한다", () => {
    const now = new Date(2026, 5, 26, 10, 50);
    const list = getBaseDateTimeCandidates(now, 6);
    expect(list).toHaveLength(7);
    expect(list[6].time).toBe("0400");
  });
});
