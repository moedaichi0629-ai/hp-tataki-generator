import type { PlaceSearchResult } from "@/types/store";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
const GEOCODE_API_BASE = "https://maps.googleapis.com/maps/api/geocode/json";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_PHOTOS = 10;

// 駅名・住所など「ピンポイントな場所」を表す型（このいずれかを含む場合は半径検索に切り替える）
const PINPOINT_TYPES = [
  "transit_station",
  "train_station",
  "subway_station",
  "point_of_interest",
  "establishment",
  "premise",
  "street_address",
];

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Google Places API（Text/Nearby Search共通）の1ページあたりの最大件数と、next_page_tokenが
// 有効になるまでのウェイト。1クエリあたり最大3ページ（60件）までしか取得できない仕様に合わせる。
const MAX_SEARCH_PAGES = 3;
const NEXT_PAGE_TOKEN_DELAY_MS = 2200;

interface TextSearchResponse {
  results?: { place_id?: string }[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

interface GeocodeResponse {
  results?: {
    geometry?: { location?: { lat?: number; lng?: number } };
    types?: string[];
  }[];
  status: string;
  error_message?: string;
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  isPinpoint: boolean;
}

// 「〇〇駅」「住所」など特定地点を指すテキストを座標に変換する。市区町村などの広域地名はisPinpoint=falseになる
export async function geocodeRegion(region: string, apiKey: string): Promise<GeocodedLocation | null> {
  const url = new URL(GEOCODE_API_BASE);
  url.searchParams.set("address", region);
  url.searchParams.set("language", "ja");
  url.searchParams.set("region", "jp");
  url.searchParams.set("key", apiKey);

  const res = await fetchWithTimeout(url.toString());
  const data = (await res.json()) as GeocodeResponse;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(
      `Google Geocoding に失敗しました: ${data.status}${data.error_message ? ` (${data.error_message})` : ""}`
    );
  }

  const result = data.results?.[0];
  const lat = result?.geometry?.location?.lat;
  const lng = result?.geometry?.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const types = result?.types ?? [];
  const isPinpoint = types.some((type) => PINPOINT_TYPES.includes(type));

  return { lat, lng, isPinpoint };
}

function assertOkStatus(status: string, errorMessage: string | undefined, context: string) {
  if (status !== "OK" && status !== "ZERO_RESULTS") {
    throw new Error(`${context}: ${status}${errorMessage ? ` (${errorMessage})` : ""}`);
  }
}

async function fetchSearchPage(url: URL, context: string): Promise<{ placeIds: string[]; nextPageToken: string | null }> {
  const res = await fetchWithTimeout(url.toString());
  const data = (await res.json()) as TextSearchResponse;

  assertOkStatus(data.status, data.error_message, context);

  return {
    placeIds: (data.results ?? []).map((r) => r.place_id).filter((id): id is string => Boolean(id)),
    nextPageToken: data.next_page_token ?? null,
  };
}

// next_page_tokenを使い、同じ検索条件で最大3ページ（60件）まで取得する。
// トークンは発行直後は無効なため、2ページ目以降はGoogle推奨の短い待機を挟む。
async function collectPlaceIds(
  buildUrl: (pageToken: string | null) => URL,
  context: string,
  maxResults: number
): Promise<string[]> {
  const collected: string[] = [];
  let pageToken: string | null = null;

  for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
    if (page > 0) {
      if (!pageToken) break;
      await delay(NEXT_PAGE_TOKEN_DELAY_MS);
    }
    try {
      const result = await fetchSearchPage(buildUrl(pageToken), context);
      collected.push(...result.placeIds);
      pageToken = result.nextPageToken;
    } catch (error) {
      // 1ページ目の失敗は呼び出し元に伝える。2ページ目以降はnext_page_tokenの遅延等で
      // 一時的に失敗することがあるため、それまでに集まった結果を返すに留める
      if (page === 0) throw error;
      console.error(`${context}（追加ページ取得失敗、ここまでの結果を返します）:`, error);
      break;
    }
    if (collected.length >= maxResults || !pageToken) break;
  }

  return collected;
}

export async function searchPlaceIdsNearby(
  location: { lat: number; lng: number },
  radiusMeters: number,
  keyword: string,
  apiKey: string,
  maxResults = 20
): Promise<string[]> {
  return collectPlaceIds(
    (pageToken) => {
      const url = new URL(`${PLACES_API_BASE}/nearbysearch/json`);
      if (pageToken) {
        url.searchParams.set("pagetoken", pageToken);
      } else {
        url.searchParams.set("location", `${location.lat},${location.lng}`);
        url.searchParams.set("radius", String(radiusMeters));
        url.searchParams.set("keyword", keyword);
        url.searchParams.set("language", "ja");
      }
      url.searchParams.set("key", apiKey);
      return url;
    },
    "Google Places Nearby Search に失敗しました",
    maxResults
  );
}

export async function searchPlaceIds(query: string, apiKey: string, maxResults = 20): Promise<string[]> {
  return collectPlaceIds(
    (pageToken) => {
      const url = new URL(`${PLACES_API_BASE}/textsearch/json`);
      if (pageToken) {
        url.searchParams.set("pagetoken", pageToken);
      } else {
        url.searchParams.set("query", query);
        url.searchParams.set("language", "ja");
        url.searchParams.set("region", "jp");
      }
      url.searchParams.set("key", apiKey);
      return url;
    },
    "Google Places Text Search に失敗しました",
    maxResults
  );
}

interface PlaceDetailsReview {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number; // unix seconds
}

interface PlaceDetailsPhoto {
  photo_reference?: string;
  width?: number;
  height?: number;
  html_attributions?: string[];
}

interface PlaceDetailsResponse {
  result?: {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    opening_hours?: { weekday_text?: string[]; open_now?: boolean };
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    website?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    business_status?: string;
    price_level?: number;
    types?: string[];
    reviews?: PlaceDetailsReview[];
    photos?: PlaceDetailsPhoto[];
  };
  status: string;
  error_message?: string;
}

const DETAILS_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "formatted_phone_number",
  "opening_hours",
  "rating",
  "user_ratings_total",
  "url",
  "website",
  "geometry",
  "business_status",
  "price_level",
  "types",
].join(",");

const DETAILS_FIELDS_WITH_REVIEWS = `${DETAILS_FIELDS},reviews`;
const DETAILS_FIELDS_WITH_PHOTOS = "place_id,photos";

function toPlaceSearchResult(placeId: string, result: NonNullable<PlaceDetailsResponse["result"]>): PlaceSearchResult {
  return {
    placeId,
    name: result.name ?? "名称不明",
    address: result.formatted_address ?? "",
    phoneNumber: result.formatted_phone_number ?? null,
    openingHours: result.opening_hours?.weekday_text ?? null,
    rating: result.rating ?? null,
    reviewCount: result.user_ratings_total ?? null,
    mapUrl: result.url ?? null,
    website: result.website ?? null,
    lat: result.geometry?.location?.lat ?? null,
    lng: result.geometry?.location?.lng ?? null,
    businessStatus: result.business_status ?? null,
    priceLevel: result.price_level ?? null,
    categories: result.types ?? null,
    openNow: result.opening_hours?.open_now ?? null,
  };
}

export async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceSearchResult | null> {
  const url = new URL(`${PLACES_API_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", DETAILS_FIELDS);
  url.searchParams.set("language", "ja");
  url.searchParams.set("key", apiKey);

  const res = await fetchWithTimeout(url.toString());
  const data = (await res.json()) as PlaceDetailsResponse;

  if (data.status !== "OK" || !data.result) return null;

  return toPlaceSearchResult(placeId, data.result);
}

export interface PlaceReviewRaw {
  authorName: string | null;
  rating: number | null;
  text: string | null;
  postedAt: string | null;
}

export async function getPlaceDetailsWithReviews(
  placeId: string,
  apiKey: string
): Promise<{ place: PlaceSearchResult; reviews: PlaceReviewRaw[] } | null> {
  const url = new URL(`${PLACES_API_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", DETAILS_FIELDS_WITH_REVIEWS);
  url.searchParams.set("language", "ja");
  url.searchParams.set("key", apiKey);

  const res = await fetchWithTimeout(url.toString());
  const data = (await res.json()) as PlaceDetailsResponse;

  if (data.status !== "OK" || !data.result) return null;

  const reviews = (data.result.reviews ?? []).map((r) => ({
    authorName: r.author_name ?? null,
    rating: typeof r.rating === "number" ? r.rating : null,
    text: r.text ?? null,
    postedAt: r.time ? new Date(r.time * 1000).toISOString() : null,
  }));

  return { place: toPlaceSearchResult(placeId, data.result), reviews };
}

export interface PlacePhotoRaw {
  photoReference: string;
  width: number | null;
  height: number | null;
  authorName: string | null;
  authorUri: string | null;
}

// html_attributionsは `<a href="...">投稿者名</a>` 形式のHTML文字列で返るため、簡易的にパースする
function parseHtmlAttribution(html: string | undefined): { authorName: string | null; authorUri: string | null } {
  if (!html) return { authorName: null, authorUri: null };
  const match = html.match(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
  if (!match) return { authorName: html.replace(/<[^>]*>/g, "").trim() || null, authorUri: null };
  return { authorName: match[2]?.trim() || null, authorUri: match[1] || null };
}

// Place Details の photos フィールドのみを取得する（実体画像はダウンロードしない。参照情報のみ）
export async function getPlacePhotos(placeId: string, apiKey: string): Promise<PlacePhotoRaw[] | null> {
  const url = new URL(`${PLACES_API_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", DETAILS_FIELDS_WITH_PHOTOS);
  url.searchParams.set("language", "ja");
  url.searchParams.set("key", apiKey);

  const res = await fetchWithTimeout(url.toString());
  const data = (await res.json()) as PlaceDetailsResponse;

  if (data.status !== "OK" || !data.result) return null;

  return (data.result.photos ?? [])
    .filter((p): p is PlaceDetailsPhoto & { photo_reference: string } => Boolean(p.photo_reference))
    .slice(0, MAX_PHOTOS)
    .map((p) => {
      const { authorName, authorUri } = parseHtmlAttribution(p.html_attributions?.[0]);
      return {
        photoReference: p.photo_reference,
        width: p.width ?? null,
        height: p.height ?? null,
        authorName,
        authorUri,
      };
    });
}

const PHOTO_API_BASE = "https://maps.googleapis.com/maps/api/place/photo";
const MAX_PHOTO_WIDTH = 1600;

// Googleマップ写真の実バイトを取得する（サーバー側プロキシ用。APIキーはここでのみ使用しクライアントへは渡さない）
export async function fetchPlacePhotoBytes(
  photoReference: string,
  maxWidth: number,
  apiKey: string
): Promise<Response> {
  const url = new URL(PHOTO_API_BASE);
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("maxwidth", String(Math.min(Math.max(maxWidth, 100), MAX_PHOTO_WIDTH)));
  url.searchParams.set("key", apiKey);

  return fetchWithTimeout(url.toString());
}
