import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreNote, storeNoteInsertToRow } from "@/lib/storeMapper";
import { storeNoteCreateSchema, formatZodError } from "@/lib/validation";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreNoteRow } from "@/types/supabaseSchema";

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
    .from("store_notes")
    .select("*")
    .eq("store_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "メモの取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ notes: (data as StoreNoteRow[]).map(rowToStoreNote) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = storeNoteCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }
  const row = storeNoteInsertToRow(id, parsed.data);

  const { data, error } = await supabase.from("store_notes").insert(row).select("*").single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: `メモの保存に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ note: rowToStoreNote(data as StoreNoteRow) }, { status: 201 });
}
