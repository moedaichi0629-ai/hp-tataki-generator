import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { regeneratePromptForStore } from "@/lib/promptGeneration";
import { handleApiError } from "@/lib/apiHandler";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import type { GeneratedPromptRow } from "@/types/supabaseSchema";
import type { PromptAiTool, PromptType } from "@/types/prompt";

interface RouteParams {
  params: Promise<{ id: string; promptId: string }>;
}

const regenerateSchema = z.object({
  usePolish: z.boolean().optional().default(false),
});

export async function POST(request: Request, { params }: RouteParams) {
  const rateLimit = checkRateLimit(`prompt-regenerate:${getClientKey(request)}`, 15, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const { id, promptId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = regenerateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("generated_prompts")
    .select("*")
    .eq("id", promptId)
    .eq("store_id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "プロンプトが見つかりませんでした。" }, { status: 404 });
  }
  const existingRow = existing as GeneratedPromptRow;

  try {
    const result = await regeneratePromptForStore(supabase, promptId, {
      storeId: id,
      aiTool: existingRow.ai_tool as PromptAiTool,
      customAiTool: existingRow.custom_ai_tool,
      promptType: existingRow.prompt_type as PromptType,
      usePolish: parsed.data.usePolish,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, errors: result.errors }, { status: result.status });
    }

    return NextResponse.json({ prompt: result.prompt, polishApplied: result.polishApplied });
  } catch (error) {
    return handleApiError(error, "プロンプトの再生成に失敗しました。");
  }
}
