// GoogleマップURL（通常URL・短縮URL）を安全に解決し、店舗を特定する手がかり（店名・緯度経度・Place ID）を抽出する。
// 短縮URLの展開はSSRF対策として、リダイレクト先ホストをGoogle関連ドメインに限定して手動で追跡する。

const ALLOWED_HOSTS_SUFFIXES = [".google.com", "google.com", "goo.gl", "maps.app.goo.gl"];
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 5000;

export class InvalidMapUrlError extends Error {}

function isAllowedGoogleHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return ALLOWED_HOSTS_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function assertValidInputUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new InvalidMapUrlError("URLの形式が正しくありません。");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidMapUrlError("http(s)以外のURLは登録できません。");
  }

  if (!isAllowedGoogleHost(url.hostname)) {
    throw new InvalidMapUrlError("Googleマップ以外のURLは登録できません。");
  }

  return url;
}

async function fetchLocationHeader(url: string): Promise<{ status: number; location: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; hp-tataki-generator/1.0)" },
    });
    return { status: res.status, location: res.headers.get("location") };
  } finally {
    clearTimeout(timeout);
  }
}

// 短縮URL(maps.app.goo.gl / goo.gl/maps)を、許可ドメインへのリダイレクトのみ追跡して展開する
export async function expandMapUrl(rawUrl: string): Promise<string> {
  let current = assertValidInputUrl(rawUrl);

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const isShortener = current.hostname.toLowerCase().includes("goo.gl");
    if (!isShortener) {
      return current.toString();
    }

    const { status, location } = await fetchLocationHeader(current.toString());

    if (status >= 200 && status < 300) {
      // リダイレクトなしで200が返る場合はこのURLを最終URLとみなす
      return current.toString();
    }

    if (status < 300 || status >= 400 || !location) {
      throw new InvalidMapUrlError("GoogleマップURLの展開に失敗しました。URLを確認してください。");
    }

    const nextUrl = new URL(location, current);
    if (!isAllowedGoogleHost(nextUrl.hostname)) {
      throw new InvalidMapUrlError("信頼できないリダイレクト先が検出されたため、処理を中止しました。");
    }
    current = nextUrl;
  }

  throw new InvalidMapUrlError("リダイレクトの回数が上限を超えました。URLを確認してください。");
}

export interface MapUrlExtraction {
  placeId: string | null;
  name: string | null;
  lat: number | null;
  lng: number | null;
}

// 展開済みのGoogleマップURLから、店名・緯度経度・Place ID（分かる場合）を抽出する
export function extractFromMapUrl(finalUrl: string): MapUrlExtraction {
  const url = new URL(finalUrl);

  const queryPlaceId = url.searchParams.get("query_place_id") || url.searchParams.get("place_id");

  let lat: number | null = null;
  let lng: number | null = null;
  const atMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    lat = Number(atMatch[1]);
    lng = Number(atMatch[2]);
  }
  if (lat === null || lng === null) {
    const qLat = url.searchParams.get("q");
    const latLngMatch = qLat?.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/);
    if (latLngMatch) {
      lat = Number(latLngMatch[1]);
      lng = Number(latLngMatch[2]);
    }
  }

  let name: string | null = null;
  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch) {
    name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  } else {
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    if (query && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(query)) {
      name = query;
    }
  }

  return { placeId: queryPlaceId, name, lat, lng };
}
