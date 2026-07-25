import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStore, storeUpdateToRow } from "@/lib/storeMapper";
import { storeUpdateSchema, formatZodError } from "@/lib/validation";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreRow } from "@/types/supabaseSchema";

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

  const { data, error } = await supabase.from("stores").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "店舗情報の取得に失敗しました。" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "店舗が見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ store: rowToStore(data as StoreRow) });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = storeUpdateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }
  const row = storeUpdateToRow(parsed.data);

  const { data, error } = await supabase.from("stores").update(row).eq("id", id).select("*").maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: `店舗情報の更新に失敗しました: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "店舗が見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ store: rowToStore(data as StoreRow) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { error } = await supabase.from("stores").delete().eq("id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "店舗の削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
