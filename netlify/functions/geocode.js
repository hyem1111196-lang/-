/**
 * Kakao 역지오코딩 프록시 (서버리스).
 * GET /api/geocode?lat&lon → 행정동 표시명 (예: "서울특별시 구로구 고척동")
 *
 * Kakao REST 키는 환경변수 KAKAO_REST_KEY 로만 주입한다(원본의 클라이언트 키 노출 약점 개선).
 * 키가 없으면 503 → 클라이언트는 격자 기반 근사 지역명으로 폴백한다.
 */

const KAKAO = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json";

export async function handler(event) {
  const key = process.env.KAKAO_REST_KEY;
  const lat = Number(event.queryStringParameters?.lat);
  const lon = Number(event.queryStringParameters?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return resp(400, { error: "lat/lon required" });
  }
  if (!key) return resp(503, { error: "KAKAO_REST_KEY not configured" });

  try {
    const params = new URLSearchParams({ x: String(lon), y: String(lat) });
    const res = await fetch(`${KAKAO}?${params}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    if (!res.ok) throw new Error(`Kakao ${res.status}`);
    const data = await res.json();
    const doc =
      data.documents?.find((d) => d.region_type === "H") || data.documents?.[0];
    if (!doc) return resp(404, { error: "no region" });
    const parts = [doc.region_1depth_name, doc.region_2depth_name, doc.region_3depth_name]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
    return resp(200, { name: parts.join(" ") });
  } catch (err) {
    return resp(502, { error: String(err && err.message ? err.message : err) });
  }
}

function resp(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" },
    body: JSON.stringify(body),
  };
}
