import { describe, it, expect } from "vitest";
import {
  locationFromLabel,
  matchArea,
  matchWarnings,
  normalizeSido,
  normalizeSigungu,
  normalizeSubArea,
  parseArea,
  parseKmaTime,
  parseStatusText,
  splitTopLevel,
  statusFromResponse,
  warningStageFor,
} from "./warnings";

const T6 = [
  "o 한파주의보 : 서울(동북권, 서북권), 인천(옹진군 제외), 경기도(가평, 포천, 연천, 양주), 강원도(철원, 화천, 양구평지, 홍천군평지, 강원북부산지), 세종",
  "o 한파경보 : 강원도(태백, 강원중부산지)",
  "o 대설주의보 : 충청북도(제천, 단양), 울릉도.독도",
  "o 풍랑주의보 : 동해중부앞바다, 동해중부먼바다",
].join("\n");

describe("parseStatusText — 특보현황 원문 파싱", () => {
  it("줄 단위로 특보명·수준·구역을 읽는다", () => {
    const entries = parseStatusText(T6);
    expect(entries.map((e) => e.name)).toEqual(["한파주의보", "한파경보", "대설주의보", "풍랑주의보"]);
    expect(entries[0].hazard).toBe("cold");
    expect(entries[0].level).toBe("warning");
    expect(entries[1].level).toBe("danger");
    expect(entries[2].hazard).toBe("snow");
    expect(entries[3].hazard).toBe("sea");
    expect(entries[0].areas.map((a) => a.sido)).toEqual(["서울", "인천", "경기도", "강원도", "세종"]);
  });

  it("'o 없 음'은 빈 배열", () => {
    expect(parseStatusText("o 없 음")).toEqual([]);
    expect(parseStatusText("")).toEqual([]);
    expect(parseStatusText(null)).toEqual([]);
  });

  it("줄바꿈 없이 이어진 원문도 'o ' 앞에서 나눈다", () => {
    const entries = parseStatusText("o 폭염경보 : 대구, 경상북도(경산, 영천) o 폭염주의보 : 서울, 경기도(수원, 안양)");
    expect(entries.map((e) => e.name)).toEqual(["폭염경보", "폭염주의보"]);
    expect(entries[1].areas[1].subs).toEqual(["수원", "안양"]);
  });
});

describe("splitTopLevel / parseArea", () => {
  it("괄호 안 쉼표는 나누지 않는다", () => {
    expect(splitTopLevel("서울, 경기도(가평, 포천), 세종")).toEqual(["서울", "경기도(가평, 포천)", "세종"]);
  });
  it("제외 목록을 구분한다", () => {
    expect(parseArea("인천(옹진군 제외)")).toMatchObject({ sido: "인천", subs: ["옹진군"], exclude: true });
    expect(parseArea("경기도(가평, 포천)")).toMatchObject({ sido: "경기도", subs: ["가평", "포천"], exclude: false });
    expect(parseArea("서울")).toMatchObject({ sido: "서울", subs: [], exclude: false });
  });
});

describe("normalize — 시도·시군구·세부구역 표기 통일", () => {
  it("시도", () => {
    expect(normalizeSido("서울특별시")).toBe("서울");
    expect(normalizeSido("서울")).toBe("서울");
    expect(normalizeSido("경기도")).toBe("경기");
    expect(normalizeSido("강원특별자치도")).toBe("강원");
    expect(normalizeSido("강원도")).toBe("강원");
    expect(normalizeSido("충청북도")).toBe("충북");
    expect(normalizeSido("전북특별자치도")).toBe("전북");
    expect(normalizeSido("전라북도")).toBe("전북");
    expect(normalizeSido("제주특별자치도")).toBe("제주");
    expect(normalizeSido("제주도")).toBe("제주");
    expect(normalizeSido("세종특별자치시")).toBe("세종");
    expect(normalizeSido("경상남도")).toBe("경남");
  });
  it("시군구·세부구역", () => {
    expect(normalizeSigungu("가평군")).toBe("가평");
    expect(normalizeSigungu("구로구")).toBe("구로");
    expect(normalizeSubArea("양구평지")).toBe("양구");
    expect(normalizeSubArea("홍천군평지")).toBe("홍천");
    expect(normalizeSubArea("강릉시평지")).toBe("강릉");
    expect(normalizeSubArea("강원북부산지")).toBe("강원");
  });
});

describe("matchArea / matchWarnings — 현 위치 대조", () => {
  const status = statusFromResponse({ tmFc: "202601120400", t6: T6, t7: "", other: "" });

  it("시도 전체 특보", () => {
    const m = matchWarnings(status, { sido: "세종특별자치시", sigungu: "세종" });
    expect(m.map((x) => [x.entry.name, x.match])).toEqual([["한파주의보", "full"]]);
  });

  it("세부 구역 포함/미포함", () => {
    expect(matchWarnings(status, { sido: "경기도", sigungu: "가평군" })[0]).toMatchObject({ match: "full" });
    const sw = matchWarnings(status, { sido: "경기도", sigungu: "수원시" });
    expect(sw.map((x) => [x.entry.name, x.match])).toEqual([["한파주의보", "partial"]]);
  });

  it("평지/산지 접미어가 붙은 구역", () => {
    expect(matchWarnings(status, { sido: "강원특별자치도", sigungu: "양구군" })[0]).toMatchObject({ entry: { name: "한파주의보" }, match: "full" });
    expect(matchWarnings(status, { sido: "강원특별자치도", sigungu: "홍천군" })[0]).toMatchObject({ match: "full" });
    // 태백: 경보(full) + 주의보(partial) → 경보가 앞
    const tb = matchWarnings(status, { sido: "강원특별자치도", sigungu: "태백시" });
    expect(tb[0]).toMatchObject({ entry: { name: "한파경보" }, match: "full" });
  });

  it("제외 목록", () => {
    expect(matchWarnings(status, { sido: "인천광역시", sigungu: "옹진군" }).some((x) => x.entry.hazard === "cold")).toBe(false);
    expect(matchWarnings(status, { sido: "인천광역시", sigungu: "남동구" })[0]).toMatchObject({ match: "full" });
  });

  it("서울 권역명 → 자치구", () => {
    expect(matchWarnings(status, { sido: "서울특별시", sigungu: "노원구" })[0]).toMatchObject({ match: "full" }); // 동북권
    expect(matchWarnings(status, { sido: "서울특별시", sigungu: "강남구" })[0]).toMatchObject({ match: "partial" }); // 동남권은 미발효
  });

  it("해당 없는 시도는 빈 배열, 해상 특보는 무시", () => {
    expect(matchWarnings(status, { sido: "부산광역시", sigungu: "해운대구" })).toEqual([]);
    expect(matchArea(parseArea("동해중부앞바다"), { sido: "강원특별자치도", sigungu: "강릉시" })).toBeNull();
  });

  it("warningStageFor — 실제 발효(full)만 단계에 반영", () => {
    expect(warningStageFor(matchWarnings(status, { sido: "강원특별자치도", sigungu: "태백시" }), "cold")).toBe("danger");
    expect(warningStageFor(matchWarnings(status, { sido: "경기도", sigungu: "가평군" }), "cold")).toBe("warning");
    expect(warningStageFor(matchWarnings(status, { sido: "경기도", sigungu: "수원시" }), "cold")).toBe("normal");
    expect(warningStageFor(matchWarnings(status, { sido: "충청북도", sigungu: "제천시" }), "cold")).toBe("normal");
    expect(warningStageFor(matchWarnings(status, { sido: "충청북도", sigungu: "제천시" }), "snow")).toBe("warning");
  });
});

describe("locationFromLabel / parseKmaTime", () => {
  it("표시 지역명에서 시도·시군구를 뽑는다", () => {
    expect(locationFromLabel("서울특별시 구로구 고척동")).toEqual({ sido: "서울특별시", sigungu: "구로구" });
    expect(locationFromLabel("경기도 가평군 인근")).toEqual({ sido: "경기도", sigungu: "가평군" });
    expect(locationFromLabel("서울특별시 중구 (기본 위치)")).toEqual({ sido: "서울특별시", sigungu: "중구" });
    expect(locationFromLabel("세종특별자치시 조치원읍")).toEqual({ sido: "세종특별자치시", sigungu: "세종" });
    expect(locationFromLabel("현재 위치")).toBeNull();
  });
  it("기상청 시각 문자열", () => {
    expect(parseKmaTime("202601120400")?.toISOString()).toBe("2026-01-11T19:00:00.000Z");
    expect(parseKmaTime(202601120400)?.getHours()).toBeTypeOf("number");
    expect(parseKmaTime("")).toBeNull();
  });
});
