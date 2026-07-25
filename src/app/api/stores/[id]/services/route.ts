import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreService, storeServiceInsertToRow } from "@/lib/storeMapper";
import { storeServiceCreateSchema, formatZodError } from "@/lib/validation";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreServiceRow } from "@/types/supabaseSchema";

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
    .from("store_services")
    .select("*")
    .eq("store_id", id)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "サービス一覧の取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ services: (data as StoreServiceRow[]).map(rowToStoreService) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = storeServiceCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  if (parsed.data.displayOrder === undefined) {
    const { data: maxRow } = await supabase
      .from("store_services")
      .select("display_order")
      .eq("store_id", id)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    parsed.data.displayOrder = maxRow ? (maxRow as { display_order: number }).display_order + 1 : 0;
  }

  const row = storeServiceInsertToRow(id, parsed.data);
  const { data, error } = await supabase.from("store_services").insert(row).select("*").single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: `サービスの保存に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ service: rowToStoreService(data as StoreServiceRow) }, { status: 201 });
}
