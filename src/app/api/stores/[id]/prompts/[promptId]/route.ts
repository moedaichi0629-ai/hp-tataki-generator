import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToGeneratedPrompt, generatedPromptUpdateToRow } from "@/lib/promptMapper";
import { updatePromptSchema, formatZodError } from "@/lib/promptValidation";
import { handleApiError } from "@/lib/apiHandler";
import type { GeneratedPromptRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; promptId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id, promptId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data, error } = await supabase
    .from("generated_prompts")
    .select("*")
    .eq("id", promptId)
    .eq("store_id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "プロンプトの取得に失敗しました。" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "プロンプトが見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ prompt: rowToGeneratedPrompt(data as GeneratedPromptRow) });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, promptId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updatePromptSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  if (parsed.data.aiTool === "other" && parsed.data.customAiTool === undefined) {
    return NextResponse.json({ error: "「その他」を選択した場合はツール名を入力してください。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const row = generatedPromptUpdateToRow(parsed.data);
  const { data, error } = await supabase
    .from("generated_prompts")
    .update(row)
    .eq("id", promptId)
    .eq("store_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `プロンプトの更新に失敗しました: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "プロンプトが見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ prompt: rowToGeneratedPrompt(data as GeneratedPromptRow) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, promptId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { error } = await supabase.from("generated_prompts").delete().eq("id", promptId).eq("store_id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "プロンプトの削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
