import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreReview } from "@/lib/storeMapper";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreReviewRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data, error } = await supabase
    .from("store_reviews")
    .select("*")
    .eq("store_id", id)
    .order("posted_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "口コミの取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ reviews: (data as StoreReviewRow[]).map(rowToStoreReview) });
}
