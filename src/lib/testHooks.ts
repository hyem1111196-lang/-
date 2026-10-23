/**
 * 미리보기(Preview) 배포 전용 테스트 훅.
 *
 * 운영 주소(korail-weather.pages.dev)에서는 절대 동작하지 않는다 — 전사 배포 안전을 위해
 * 어떤 URL로도 운영 화면에 조작된 값이 나오지 않도록 호스트로 잠근다.
 * Cloudflare Pages 미리보기 주소(브랜치명.korail-weather.pages.dev, 해시.korail-weather.pages.dev)와
 * 로컬 개발 서버에서만 ?wrntest=cold|danger|heat 로 가짜 특보를 주입해 화면을 확인할 수 있다.
 *
 *   ?wrntest=cold   → 현 위치 시도 전체에 한파주의보
 *   ?wrntest=danger → 한파경보
 *   ?wrntest=heat   → 폭염경보(참고 배지)
 *   ?wrntest=none   → 특보 없음(정상 응답)
 */
import type { WarningStatus } from "./warnings";

export const PRODUCTION_HOST = "korail-weather.pages.dev";

/** 미리보기·로컬 호스트인지 (운영 호스트는 false) */
export function isPreviewHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".localhost")) return true;
  if (h === PRODUCTION_HOST) return false;
  return h.endsWith(`.${PRODUCTION_HOST}`);
}

export function readWarningTestParam(search: string): string | null {
  const v = new URLSearchParams(search).get("wrntest");
  return v ? v.toLowerCase() : null;
}

/** 테스트용 가짜 특보 현황 — 현 위치 시도 전체 발효 */
export function warningTestStatus(param: string, sido: string): WarningStatus | null {
  const area = { sido, subs: [] as string[], exclude: false, raw: sido };
  const now = new Date();
  const mk = (name: string, hazard: "cold" | "heat", level: "warning" | "danger"): WarningStatus => ({
    issuedAt: now,
    entries: [{ name, hazard, level, areas: [area], raw: `o ${name} : ${sido}` }],
    preliminaryText: "",
    note: "테스트(wrntest) 주입값",
    source: "kma",
  });
  switch (param) {
    case "cold":
      return mk("한파주의보", "cold", "warning");
    case "danger":
      return mk("한파경보", "cold", "danger");
    case "heat":
      return mk("폭염경보", "heat", "danger");
    case "none":
      return { issuedAt: now, entries: [], preliminaryText: "", note: "테스트(wrntest) 주입값", source: "kma" };
    default:
      return null;
  }
}
