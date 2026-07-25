import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getPlaceDetails } from "@/lib/googlePlaces";
import { storeInsertToRow } from "@/lib/storeMapper";
import { handleApiError } from "@/lib/apiHandler";

const legacySearchHistorySchema = z.object({
  id: z.string(),
  region: z.string(),
  industry: z.string(),
  resultCount: z.number(),
});

const legacyGenerationHistorySchema = z.object({
  id: z.string(),
  placeId: z.string(),
  shopName: z.string(),
  region: z.string().optional(),
  industry: z.string().optional(),
  type: z.enum(["site", "pitch"]),
});

const importSchema = z.object({
  searchHistory: z.array(legacySearchHistorySchema).optional().default([]),
  generationHistory: z.array(legacyGenerationHistorySchema).optional().default([]),
});

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "移行データの形式が正しくありません。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }
  const { searchHistory, generationHistory } = parsed.data;

  let importedSearchHistories = 0;
  if (searchHistory.length > 0) {
    const rows = searchHistory.map((entry) => ({
      search_type: "region_industry",
      region: entry.region || null,
      industry: entry.industry || null,
      params: { migratedFrom: "localStorage", legacyId: entry.id },
      result_count: entry.resultCount,
    }));
    const { error } = await supabase.from("search_histories").insert(rows);
    if (error) {
      console.error(error);
    } else {
      importedSearchHistories = rows.length;
    }
  }

  const uniquePlaceIds = Array.from(new Map(generationHistory.map((e) => [e.placeId, e])).values());

  let importedStores = 0;
  let skippedExistingStores = 0;
  let failedStores = 0;

  if (uniquePlaceIds.length > 0) {
    if (!apiKey) {
      return NextResponse.json(
        {
          importedSearchHistories,
          importedStores: 0,
          skippedExistingStores: 0,
          failedStores: uniquePlaceIds.length,
          error:
            "GOOGLE_PLACES_API_KEYが未設定のため、生成履歴からの店舗作成はスキップされました。検索履歴のみ移行しました。",
        },
        { status: 200 }
      );
    }

    const { data: existing } = await supabase
      .from("stores")
      .select("place_id")
      .in(
        "place_id",
        uniquePlaceIds.map((e) => e.placeId)
      );
    const existingIds = new Set((existing ?? []).map((r: { place_id: string }) => r.place_id));

    for (const entry of uniquePlaceIds) {
      if (existingIds.has(entry.placeId)) {
        skippedExistingStores += 1;
        continue;
      }

      try {
        const place = await getPlaceDetails(entry.placeId, apiKey);
        const row = storeInsertToRow({
          placeId: entry.placeId,
          name: place?.name ?? entry.shopName,
          address: place?.address ?? null,
          phoneNumber: place?.phoneNumber ?? null,
          businessHours: place?.openingHours ?? null,
          googleMapsUrl: place?.mapUrl ?? null,
          officialWebsiteUrl: place?.website ?? null,
          googleRating: place?.rating ?? null,
          googleReviewCount: place?.reviewCount ?? null,
          googleCategories: place?.categories ?? null,
          lat: place?.lat ?? null,
          lng: place?.lng ?? null,
          storeStatus: "candidate",
          officialWebsiteStatus: "unconfirmed",
        });
        (row as Record<string, unknown>).google_last_fetched_at = new Date().toISOString();

        const { error } = await supabase.from("stores").insert(row);
        if (error) {
          console.error(error);
          failedStores += 1;
        } else {
          importedStores += 1;
        }
      } catch (error) {
        console.error(error);
        failedStores += 1;
      }
    }
  }

  return NextResponse.json({ importedSearchHistories, importedStores, skippedExistingStores, failedStores });
}
