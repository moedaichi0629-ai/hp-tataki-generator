import { getPlaceDetails, searchPlaceIds, searchPlaceIdsNearby } from "@/lib/googlePlaces";
import type { MapUrlExtraction } from "@/lib/mapUrlResolver";
import type { PlaceSearchResult } from "@/types/store";

const NEARBY_RADIUS_METERS = 150;
const MAX_CANDIDATES = 5;

// URLからPlace IDを直接取得できない場合、抽出した店名・緯度経度をもとにText Search / Nearby Searchで候補を探す
export async function resolveCandidatesFromExtraction(
  extraction: MapUrlExtraction,
  apiKey: string
): Promise<PlaceSearchResult[]> {
  if (extraction.placeId) {
    const detail = await getPlaceDetails(extraction.placeId, apiKey);
    return detail ? [detail] : [];
  }

  if (!extraction.name && (extraction.lat === null || extraction.lng === null)) {
    return [];
  }

  let placeIds: string[] = [];

  if (extraction.lat !== null && extraction.lng !== null && extraction.name) {
    placeIds = await searchPlaceIdsNearby(
      { lat: extraction.lat, lng: extraction.lng },
      NEARBY_RADIUS_METERS,
      extraction.name,
      apiKey
    );
  }

  if (placeIds.length === 0 && extraction.name) {
    placeIds = await searchPlaceIds(extraction.name, apiKey);
  }

  const candidates = await Promise.all(
    placeIds.slice(0, MAX_CANDIDATES).map((id) => getPlaceDetails(id, apiKey))
  );

  return candidates.filter((c): c is PlaceSearchResult => c !== null);
}

export async function resolveCandidatesByNameAddress(
  name: string,
  address: string,
  apiKey: string
): Promise<PlaceSearchResult[]> {
  const query = address ? `${name} ${address}` : name;
  const placeIds = await searchPlaceIds(query, apiKey);
  const candidates = await Promise.all(
    placeIds.slice(0, MAX_CANDIDATES).map((id) => getPlaceDetails(id, apiKey))
  );
  return candidates.filter((c): c is PlaceSearchResult => c !== null);
}
