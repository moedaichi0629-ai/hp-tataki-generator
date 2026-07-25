import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToSearchHistory } from "@/lib/storeMapper";
import { handleApiError } from "@/lib/apiHandler";
import type { SearchHistoryRow } from "@/types/supabaseSchema";

const MAX_HISTORY_ITEMS = 30;

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data, error } = await supabase
    .from("search_histories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_ITEMS);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "検索履歴の取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ histories: (data as SearchHistoryRow[]).map(rowToSearchHistory) });
}

export async function DELETE() {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { error } = await supabase.from("search_histories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "検索履歴の削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
