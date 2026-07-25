import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getPlaceDetailsWithReviews } from "@/lib/googlePlaces";
import { rowToStoreReview } from "@/lib/storeMapper";
import { describeFetchError } from "@/lib/errorUtils";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreReviewRow, StoreRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function buildReviewId(authorName: string | null, postedAt: string | null, text: string | null): string {
  return createHash("sha256")
    .update(`${authorName ?? ""}|${postedAt ?? ""}|${(text ?? "").slice(0, 50)}`)
    .digest("hex");
}

export async function POST(request: Request, { params }: RouteParams) {
  const rateLimit = checkRateLimit(`reviews-sync:${getClientKey(request)}`, 15, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEYが設定されていません。.env.localを確認してください。" },
      { status: 500 }
    );
  }

  const { id } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (storeError || !storeData) {
    return NextResponse.json({ error: "店舗が見つかりませんでした。" }, { status: 404 });
  }

  const store = storeData as StoreRow;
  if (!store.place_id) {
    return NextResponse.json(
      { error: "この店舗にはPlace IDが登録されていないため、口コミを取得できません。" },
      { status: 400 }
    );
  }

  try {
    const result = await getPlaceDetailsWithReviews(store.place_id, apiKey);
    if (!result) {
      return NextResponse.json({ error: "Googleマップから店舗情報を取得できませんでした。" }, { status: 404 });
    }

    const rows = result.reviews.map((r) => ({
      store_id: id,
      author_name: r.authorName,
      rating: r.rating,
      review_text: r.text,
      posted_at: r.postedAt,
      source: "google",
      google_review_id: buildReviewId(r.authorName, r.postedAt, r.text),
    }));

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("store_reviews")
        .upsert(rows, { onConflict: "store_id,google_review_id" });
      if (upsertError) {
        console.error(upsertError);
        return NextResponse.json({ error: "口コミの保存に失敗しました。" }, { status: 500 });
      }
    }

    await supabase
      .from("stores")
      .update({
        google_rating: result.place.rating,
        google_review_count: result.place.reviewCount,
        google_last_fetched_at: new Date().toISOString(),
      })
      .eq("id", id);

    const { data: allReviews, error: fetchError } = await supabase
      .from("store_reviews")
      .select("*")
      .eq("store_id", id)
      .order("posted_at", { ascending: false, nullsFirst: false });

    if (fetchError) {
      console.error(fetchError);
      return NextResponse.json({ error: "口コミの取得に失敗しました。" }, { status: 500 });
    }

    return NextResponse.json({ reviews: (allReviews as StoreReviewRow[]).map(rowToStoreReview) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: describeFetchError(error, "口コミの取得") }, { status: 500 });
  }
}
