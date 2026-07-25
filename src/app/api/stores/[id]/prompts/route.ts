import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToGeneratedPrompt } from "@/lib/promptMapper";
import { generatePromptForStore } from "@/lib/promptGeneration";
import { generatePromptSchema, formatZodError } from "@/lib/promptValidation";
import { handleApiError } from "@/lib/apiHandler";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import type { GeneratedPromptRow } from "@/types/supabaseSchema";

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
    .from("generated_prompts")
    .select("*")
    .eq("store_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "プロンプト履歴の取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ prompts: (data as GeneratedPromptRow[]).map(rowToGeneratedPrompt) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const rateLimit = checkRateLimit(`prompt-generate:${getClientKey(request)}`, 15, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = generatePromptSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  if (parsed.data.aiTool === "other" && !parsed.data.customAiTool) {
    return NextResponse.json({ error: "「その他」を選択した場合はツール名を入力してください。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  try {
    const result = await generatePromptForStore(supabase, {
      storeId: id,
      aiTool: parsed.data.aiTool,
      customAiTool: parsed.data.customAiTool,
      promptType: parsed.data.promptType,
      usePolish: parsed.data.usePolish,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, errors: result.errors }, { status: result.status });
    }

    return NextResponse.json({ prompt: result.prompt, polishApplied: result.polishApplied }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "プロンプトの生成に失敗しました。");
  }
}
