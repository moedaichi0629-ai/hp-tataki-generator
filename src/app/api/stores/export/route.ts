import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStore } from "@/lib/storeMapper";
import { handleApiError } from "@/lib/apiHandler";
import { formatSearchRadius } from "@/lib/searchRadiusOptions";
import type { StoreRow } from "@/types/supabaseSchema";

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  created_desc: { column: "created_at", ascending: false },
  created_asc: { column: "created_at", ascending: true },
  rating_desc: { column: "google_rating", ascending: false },
  reviews_desc: { column: "google_review_count", ascending: false },
  name_asc: { column: "name", ascending: true },
  updated_desc: { column: "updated_at", ascending: false },
};

const MAX_ROWS = 5000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  let query = supabase.from("stores").select("*");

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

  const sortKey = searchParams.get("sort") ?? "created_desc";
  const sort = SORT_MAP[sortKey] ?? SORT_MAP.created_desc;
  query = query.order(sort.column, { ascending: sort.ascending, nullsFirst: false }).limit(MAX_ROWS);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "店舗一覧の取得に失敗しました。" }, { status: 500 });
  }

  const stores = (data as StoreRow[]).map(rowToStore);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("店舗一覧");
  sheet.columns = [
    { header: "店舗名", key: "name", width: 30 },
    { header: "Googleマップのリンク", key: "googleMapsUrl", width: 40 },
    { header: "地域", key: "region", width: 20 },
    { header: "業種", key: "industry", width: 16 },
    { header: "作成したHPのリンク", key: "createdHpUrl", width: 40 },
    { header: "営業済み", key: "salesContacted", width: 10 },
    { header: "検索範囲", key: "searchRadius", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const store of stores) {
    sheet.addRow({
      name: store.name,
      googleMapsUrl: store.googleMapsUrl ?? "",
      region: store.registrationRegion ?? "",
      industry: store.industry ?? "",
      createdHpUrl: store.createdHpUrl ?? "",
      salesContacted: store.salesContacted,
      searchRadius: formatSearchRadius(store.registrationSearchRadiusMeters),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `stores_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
