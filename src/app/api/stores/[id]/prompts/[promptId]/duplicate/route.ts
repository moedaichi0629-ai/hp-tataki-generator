import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToGeneratedPrompt } from "@/lib/promptMapper";
import { handleApiError } from "@/lib/apiHandler";
import type { GeneratedPromptRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; promptId: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id, promptId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data: original, error: fetchError } = await supabase
    .from("generated_prompts")
    .select("*")
    .eq("id", promptId)
    .eq("store_id", id)
    .maybeSingle();

  if (fetchError || !original) {
    return NextResponse.json({ error: "複製元のプロンプトが見つかりませんでした。" }, { status: 404 });
  }
  const row = original as GeneratedPromptRow;

  const { data, error } = await supabase
    .from("generated_prompts")
    .insert({
      store_id: row.store_id,
      website_requirement_id: row.website_requirement_id,
      title: `${row.title}（コピー）`,
      prompt_type: row.prompt_type,
      ai_tool: row.ai_tool,
      custom_ai_tool: row.custom_ai_tool,
      content: row.content,
      store_updated_at_snapshot: row.store_updated_at_snapshot,
      images_updated_at_snapshot: row.images_updated_at_snapshot,
      template_version: row.template_version,
      generation_method: row.generation_method,
      is_used: false,
      memo: row.memo,
    })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "プロンプトの複製に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ prompt: rowToGeneratedPrompt(data as GeneratedPromptRow) }, { status: 201 });
}
