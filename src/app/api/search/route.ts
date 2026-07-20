import { NextResponse } from "next/server";
import { geocodeRegion, getPlaceDetails, searchPlaceIds, searchPlaceIdsNearby } from "@/lib/googlePlaces";
import { isOfficialWebsite } from "@/lib/officialWebsite";
import { describeFetchError } from "@/lib/errorUtils";

const MAX_RESULTS = 10;
const DEFAULT_RADIUS_METERS = 1000;
const MIN_RADIUS_METERS = 100;
const MAX_RADIUS_METERS = 5000;

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEYが設定されていません。.env.localを確認してください。" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const region = typeof body?.region === "string" ? body.region.trim() : "";
  const industry = typeof body?.industry === "string" ? body.industry.trim() : "";
  const rawRadius = typeof body?.radiusMeters === "number" ? body.radiusMeters : DEFAULT_RADIUS_METERS;
  const radiusMeters = Math.min(Math.max(rawRadius, MIN_RADIUS_METERS), MAX_RADIUS_METERS);

  if (!region || !industry) {
    return NextResponse.json({ error: "地域と業種を入力してください。" }, { status: 400 });
  }

  try {
    // 「〇〇駅」「住所」のようにピンポイントな地点を指す場合は、その地点を中心とした半径検索に切り替える
    // Geocoding APIが未有効化などで失敗しても、従来通りのテキスト検索にフォールバックする
    const geocoded = await geocodeRegion(region, apiKey).catch((error) => {
      console.error("geocodeRegion failed, falling back to text search:", error);
      return null;
    });

    const placeIds =
      geocoded && geocoded.isPinpoint
        ? await searchPlaceIdsNearby(geocoded, radiusMeters, industry, apiKey)
        : await searchPlaceIds(`${industry} ${region}`, apiKey);

    const details = await Promise.all(placeIds.map((id) => getPlaceDetails(id, apiKey)));

    const shopsWithoutWebsite = details.filter(
      (shop): shop is NonNullable<typeof shop> => shop !== null && !isOfficialWebsite(shop.website)
    );

    return NextResponse.json({ shops: shopsWithoutWebsite.slice(0, MAX_RESULTS) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: describeFetchError(error, "検索") }, { status: 500 });
  }
}
