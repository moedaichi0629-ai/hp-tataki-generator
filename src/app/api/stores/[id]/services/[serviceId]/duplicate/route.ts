import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreService } from "@/lib/storeMapper";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreServiceRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; serviceId: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id, serviceId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data: original, error: fetchError } = await supabase
    .from("store_services")
    .select("*")
    .eq("id", serviceId)
    .eq("store_id", id)
    .maybeSingle();

  if (fetchError || !original) {
    return NextResponse.json({ error: "複製元のサービスが見つかりませんでした。" }, { status: 404 });
  }

  const row = original as StoreServiceRow;
  const { data: maxRow } = await supabase
    .from("store_services")
    .select("display_order")
    .eq("store_id", id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = maxRow ? (maxRow as { display_order: number }).display_order + 1 : 0;

  const { data, error } = await supabase
    .from("store_services")
    .insert({
      store_id: id,
      name: `${row.name}（コピー）`,
      description: row.description,
      price: row.price,
      price_note: row.price_note,
      duration: row.duration,
      target_audience: row.target_audience,
      features: row.features,
      display_order: nextOrder,
      is_published: false,
      verification_status: row.verification_status,
      remarks: row.remarks,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "サービスの複製に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ service: rowToStoreService(data as StoreServiceRow) }, { status: 201 });
}
