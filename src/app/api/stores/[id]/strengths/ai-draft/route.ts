import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStore, rowToStoreReview } from "@/lib/storeMapper";
import { generateStrengthsDraft, STRENGTHS_AI_DISCLAIMER } from "@/lib/openaiClient";
import { describeFetchError } from "@/lib/errorUtils";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreReviewRow, StoreRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const rateLimit = checkRateLimit(`strengths-ai-draft:${getClientKey(request)}`, 10, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEYが設定されていません。.env.localを確認してください。" },
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

  const [{ data: storeData, error: storeError }, { data: reviewData, error: reviewError }] = await Promise.all([
    supabase.from("stores").select("*").eq("id", id).maybeSingle(),
    supabase.from("store_reviews").select("*").eq("store_id", id),
  ]);

  if (storeError || !storeData) {
    return NextResponse.json({ error: "店舗が見つかりませんでした。" }, { status: 404 });
  }
  if (reviewError) {
    console.error(reviewError);
    return NextResponse.json({ error: "口コミの取得に失敗しました。" }, { status: 500 });
  }

  const store = rowToStore(storeData as StoreRow);
  const reviews = ((reviewData ?? []) as StoreReviewRow[]).map(rowToStoreReview);

  if (reviews.length === 0 && !store.description) {
    return NextResponse.json(
      { error: "口コミまたは店舗説明が登録されていないため、AI下書きを作成できません。" },
      { status: 400 }
    );
  }

  try {
    const draft = await generateStrengthsDraft(store, reviews);
    return NextResponse.json({ draft, disclaimer: STRENGTHS_AI_DISCLAIMER });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: describeFetchError(error, "AI下書きの生成") }, { status: 500 });
  }
}
