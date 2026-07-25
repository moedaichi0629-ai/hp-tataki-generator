import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreService, storeServiceUpdateToRow } from "@/lib/storeMapper";
import { storeServiceSchema, formatZodError } from "@/lib/validation";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreServiceRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; serviceId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, serviceId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = storeServiceSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }
  const row = storeServiceUpdateToRow(parsed.data);

  const { data, error } = await supabase
    .from("store_services")
    .update(row)
    .eq("id", serviceId)
    .eq("store_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `サービスの更新に失敗しました: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "サービスが見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ service: rowToStoreService(data as StoreServiceRow) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, serviceId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { error } = await supabase.from("store_services").delete().eq("id", serviceId).eq("store_id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "サービスの削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
