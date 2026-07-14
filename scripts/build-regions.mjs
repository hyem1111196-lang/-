/**
 * 워크플로우 결과(JSON)를 src/data/regions.ts 로 변환한다.
 * 사용: node scripts/build-regions.mjs <workflow-output.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/build-regions.mjs <output.json>");
  process.exit(1);
}

const raw = readFileSync(src, "utf-8");
const parsed = JSON.parse(raw);
const regions = parsed.result?.regions ?? parsed.regions;
if (!regions) {
  console.error("no regions in input");
  process.exit(1);
}

// 시도 표시 순서 (행정 표준 + 철도 권역 관례)
const ORDER = [
  "서울특별시", "인천광역시", "경기도",
  "강원특별자치도", "충청북도", "충청남도", "대전광역시", "세종특별자치시",
  "전북특별자치도", "전라남도", "광주광역시",
  "경상북도", "대구광역시", "경상남도", "부산광역시", "울산광역시",
  "제주특별자치도",
];

const keys = Object.keys(regions).sort((a, b) => {
  const ia = ORDER.indexOf(a);
  const ib = ORDER.indexOf(b);
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
});

let total = 0;
const body = keys
  .map((sido) => {
    const list = regions[sido]
      .map((x) => {
        total += 1;
        return `    { name: ${JSON.stringify(x.name)}, lat: ${x.lat}, lon: ${x.lon} },`;
      })
      .join("\n");
    return `  ${JSON.stringify(sido)}: [\n${list}\n  ],`;
  })
  .join("\n");

const out = `/**
 * 전국 행정구역(시도 → 시군구) 데이터셋.
 * 시군구 중심 좌표(위경도)를 내장해, 지역 선택 시 외부 지오코딩 없이 기상청 격자로 변환한다.
 * 자동 생성물 — 직접 수정 금지(scripts/build-regions.mjs 로 재생성).
 * 출처: 전국 시도 ${keys.length}개 · 시군구 ${total}개.
 */

export interface Sigungu {
  name: string;
  lat: number;
  lon: number;
}

export type RegionDb = Record<string, Sigungu[]>;

export const REGIONS: RegionDb = {
${body}
};

/** 시도 목록(표시 순서) */
export const SIDO_LIST: string[] = Object.keys(REGIONS);

/** 특정 시도의 시군구 목록 */
export function getSigungu(sido: string): Sigungu[] {
  return REGIONS[sido] ?? [];
}

/** 시도+시군구명으로 좌표 찾기 */
export function findRegion(sido: string, sigungu: string): Sigungu | undefined {
  return (REGIONS[sido] ?? []).find((s) => s.name === sigungu);
}
`;

writeFileSync("src/data/regions.ts", out, "utf-8");
console.log(`wrote src/data/regions.ts — ${keys.length} 시도, ${total} 시군구`);
