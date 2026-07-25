import type { PlaceSearchResult } from "@/types/store";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
const GEOCODE_API_BASE = "https://maps.googleapis.com/maps/api/geocode/json";
const REQUEST_TIMEOUT_MS = 10000;

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

export async function searchPlaceIdsNearby(
  location: { lat: number; lng: number },
  radiusMeters: number,
  keyword: string,
  apiKey: string
): Promise<string[]> {
  const url = new URL(`${PLACES_API_BASE}/nearbysearch/json`);
  url.searchParams.set("location", `${location.lat},${location.lng}`);
  url.searchParams.set("radius", String(radiusMeters));
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("language", "ja");
  url.searchParams.set("key", apiKey);

  const res = await fetchWithTimeout(url.toString());
  const data = (await res.json()) as TextSearchResponse;

  assertOkStatus(data.status, data.error_message, "Google Places Nearby Search に失敗しました");

  return (data.results ?? []).map((r) => r.place_id).filter((id): id is string => Boolean(id));
}

export async function searchPlaceIds(query: string, apiKey: string): Promise<string[]> {
  const url = new URL(`${PLACES_API_BASE}/textsearch/json`);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "ja");
  url.searchParams.set("region", "jp");
  url.searchParams.set("key", apiKey);

  const res = await fetchWithTimeout(url.toString());
  const data = (await res.json()) as TextSearchResponse;

  assertOkStatus(data.status, data.error_message, "Google Places Text Search に失敗しました");

  return (data.results ?? []).map((r) => r.place_id).filter((id): id is string => Boolean(id));
}

interface PlaceDetailsReview {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number; // unix seconds
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
