import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { handleApiError } from "@/lib/apiHandler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { error } = await supabase.from("search_histories").delete().eq("id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "検索履歴の削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
