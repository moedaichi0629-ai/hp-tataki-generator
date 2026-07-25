import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStore, storeInsertToRow } from "@/lib/storeMapper";
import { findDuplicates } from "@/lib/duplicateDetection";
import { storeCreateSchema, formatZodError } from "@/lib/validation";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreRow } from "@/types/supabaseSchema";

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  created_desc: { column: "created_at", ascending: false },
  created_asc: { column: "created_at", ascending: true },
  rating_desc: { column: "google_rating", ascending: false },
  reviews_desc: { column: "google_review_count", ascending: false },
  name_asc: { column: "name", ascending: true },
  updated_desc: { column: "updated_at", ascending: false },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }
  let query = supabase.from("stores").select("*", { count: "exact" });

  const name = searchParams.get("name");
  if (name) query = query.ilike("name", `%${name}%`);

  const region = searchParams.get("region");
  if (region) query = query.ilike("address", `%${region}%`);

  const industry = searchParams.get("industry");
  if (industry) query = query.ilike("industry", `%${industry}%`);

  const storeStatus = searchParams.get("storeStatus");
  if (storeStatus) query = query.eq("store_status", storeStatus);

  const officialWebsiteStatus = searchParams.get("officialWebsiteStatus");
  if (officialWebsiteStatus) query = query.eq("official_website_status", officialWebsiteStatus);

  const isSalesTarget = searchParams.get("isSalesTarget");
  if (isSalesTarget === "true" || isSalesTarget === "false") {
    query = query.eq("is_sales_target", isSalesTarget === "true");
  }

  const minRating = searchParams.get("minRating");
  if (minRating) query = query.gte("google_rating", Number(minRating));

  const minReviews = searchParams.get("minReviews");
  if (minReviews) query = query.gte("google_review_count", Number(minReviews));

  const createdFrom = searchParams.get("createdFrom");
  if (createdFrom) query = query.gte("created_at", createdFrom);
  const createdTo = searchParams.get("createdTo");
  if (createdTo) query = query.lte("created_at", createdTo);
  const updatedFrom = searchParams.get("updatedFrom");
  if (updatedFrom) query = query.gte("updated_at", updatedFrom);
  const updatedTo = searchParams.get("updatedTo");
  if (updatedTo) query = query.lte("updated_at", updatedTo);

  const sortKey = searchParams.get("sort") ?? "created_desc";
  const sort = SORT_MAP[sortKey] ?? SORT_MAP.created_desc;
  query = query.order(sort.column, { ascending: sort.ascending, nullsFirst: false });

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "店舗一覧の取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({
    stores: (data as StoreRow[]).map(rowToStore),
    total: count ?? 0,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`stores-create:${getClientKey(request)}`, 30, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = storeCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const input = parsed.data;
  const force = Boolean((body as Record<string, unknown> | null)?.force);

  try {
    const duplicates = await findDuplicates({
      placeId: input.placeId,
      name: input.name,
      address: input.address,
      phoneNumber: input.phoneNumber,
      lat: input.lat,
      lng: input.lng,
    });

    if (duplicates.exactMatch) {
      return NextResponse.json(
        { error: "同じPlace IDの店舗が既に登録されています。", existingStore: duplicates.exactMatch },
        { status: 409 }
      );
    }

    if (duplicates.candidates.length > 0 && !force) {
      return NextResponse.json(
        { duplicateCandidates: duplicates.candidates },
        { status: 200 }
      );
    }

    const supabase = getSupabaseServerClient();
    const row = storeInsertToRow(input);
    if (input.placeId) {
      (row as Record<string, unknown>).google_last_fetched_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from("stores").insert(row).select("*").single();
    if (error) {
      console.error(error);
      return NextResponse.json({ error: `店舗の保存に失敗しました: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ store: rowToStore(data as StoreRow) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "店舗の登録に失敗しました。" },
      { status: 500 }
    );
  }
}
