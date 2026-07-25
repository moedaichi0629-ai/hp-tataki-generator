import { NextResponse } from "next/server";
import { geocodeRegion, getPlaceDetails, searchPlaceIds, searchPlaceIdsNearby } from "@/lib/googlePlaces";
import { describeFetchError } from "@/lib/errorUtils";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { searchByRegionIndustrySchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { recordSearchHistory } from "@/lib/searchHistory";
import type { PlaceSearchResult } from "@/types/store";

const MIN_RADIUS_METERS = 100;
const MAX_RADIUS_METERS = 5000;
// 業種が未指定の場合に使う汎用キーワード（業種を問わず店舗全般を対象にする）
const ANY_INDUSTRY_KEYWORD = "店舗";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`search:${getClientKey(request)}`, 20, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "検索リクエストが多すぎます。しばらく待ってから再度お試しください。" },
      { status: 429 }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEYが設定されていません。.env.localを確認してください。" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = searchByRegionIndustrySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "検索条件の形式が正しくありません。" }, { status: 400 });
  }
  const {
    region,
    industry,
    radiusMeters: rawRadius,
    maxResults,
    minRating,
    minReviews,
    openNowOnly,
    noWebsiteOnly,
    excludeRegistered,
  } = parsed.data;

  const useRadius = rawRadius > 0;
  const radiusMeters = Math.min(Math.max(rawRadius, MIN_RADIUS_METERS), MAX_RADIUS_METERS);

  if (!region && !industry) {
    return NextResponse.json({ error: "地域か業種のどちらかを入力してください。" }, { status: 400 });
  }

  try {
    let placeIds: string[];

    if (region) {
      const effectiveIndustry = industry || ANY_INDUSTRY_KEYWORD;

      const geocoded = useRadius
        ? await geocodeRegion(region, apiKey).catch((error) => {
            console.error("geocodeRegion failed, falling back to text search:", error);
            return null;
          })
        : null;

      placeIds =
        geocoded && geocoded.isPinpoint
          ? await searchPlaceIdsNearby(geocoded, radiusMeters, effectiveIndustry, apiKey)
          : await searchPlaceIds(`${effectiveIndustry} ${region}`, apiKey);
    } else {
      placeIds = await searchPlaceIds(industry, apiKey);
    }

    const details = await Promise.all(placeIds.map((id) => getPlaceDetails(id, apiKey)));
    let shops = details.filter((shop): shop is PlaceSearchResult => shop !== null);

    if (noWebsiteOnly) {
      shops = shops.filter((shop) => !shop.website);
    }
    if (typeof minRating === "number") {
      shops = shops.filter((shop) => (shop.rating ?? 0) >= minRating);
    }
    if (typeof minReviews === "number") {
      shops = shops.filter((shop) => (shop.reviewCount ?? 0) >= minReviews);
    }
    if (openNowOnly) {
      shops = shops.filter((shop) => shop.openNow === true);
    }

    shops = shops.slice(0, maxResults);

    if (excludeRegistered || shops.length > 0) {
      const supabase = getSupabaseServerClient();
      const placeIdList = shops.map((s) => s.placeId);
      const { data: registered } = await supabase
        .from("stores")
        .select("place_id")
        .in("place_id", placeIdList.length > 0 ? placeIdList : ["__none__"]);
      const registeredIds = new Set((registered ?? []).map((r: { place_id: string }) => r.place_id));

      shops = shops.map((shop) => ({ ...shop, isRegistered: registeredIds.has(shop.placeId) }));
      if (excludeRegistered) {
        shops = shops.filter((shop) => !shop.isRegistered);
      }
    }

    try {
      await recordSearchHistory(getSupabaseServerClient(), {
        searchType: "region_industry",
        region: region || null,
        industry: industry || null,
        params: { radiusMeters: rawRadius, minRating, minReviews, openNowOnly, noWebsiteOnly, excludeRegistered },
        resultCount: shops.length,
      });
    } catch (error) {
      console.error("search_histories insert failed:", error);
    }

    return NextResponse.json({ shops });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: describeFetchError(error, "検索") }, { status: 500 });
  }
}
