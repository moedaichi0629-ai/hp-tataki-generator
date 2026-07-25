import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreNote, storeNoteUpdateToRow } from "@/lib/storeMapper";
import { storeNoteSchema, formatZodError } from "@/lib/validation";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreNoteRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; noteId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, noteId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = storeNoteSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }
  const row = storeNoteUpdateToRow(parsed.data);

  const { data, error } = await supabase
    .from("store_notes")
    .update(row)
    .eq("id", noteId)
    .eq("store_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `メモの更新に失敗しました: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "メモが見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ note: rowToStoreNote(data as StoreNoteRow) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, noteId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { error } = await supabase.from("store_notes").delete().eq("id", noteId).eq("store_id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "メモの削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
