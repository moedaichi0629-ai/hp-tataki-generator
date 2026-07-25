import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToStore, rowToStoreService, rowToStoreStrengths } from "@/lib/storeMapper";
import { rowToStoreImage } from "@/lib/imageMapper";
import {
  rowToWebsiteRequirements,
  rowToWebsiteSection,
  rowToPromptTemplate,
  rowToGeneratedPrompt,
  generatedPromptInsertToRow,
} from "@/lib/promptMapper";
import { checkPromptReadiness } from "@/lib/promptReadiness";
import { buildHpInitialCreationPrompt } from "@/lib/promptBuilders/buildPrompt";
import { polishPromptText } from "@/lib/openaiClient";
import { PROMPT_AI_TOOL_LABELS, PROMPT_TYPE_LABELS } from "@/lib/promptOptions";
import type {
  GeneratedPromptRow,
  StoreImageRow,
  StoreRow,
  StoreServiceRow,
  StoreStrengthsRow,
  WebsiteRequirementsRow,
  WebsiteSectionRow,
  PromptTemplateRow,
} from "@/types/supabaseSchema";
import type { GeneratedPrompt, PromptAiTool, PromptGenerationMethod, PromptType } from "@/types/prompt";

export interface GeneratePromptOptions {
  storeId: string;
  aiTool: PromptAiTool;
  customAiTool?: string | null;
  promptType: PromptType;
  usePolish?: boolean;
}

export type GeneratePromptResult =
  | { ok: true; prompt: GeneratedPrompt; polishApplied: boolean }
  | { ok: false; status: number; error: string; errors?: string[] };

interface ComputedPromptContent {
  title: string;
  content: string;
  storeUpdatedAtSnapshot: string | null;
  imagesUpdatedAtSnapshot: string | null;
  templateVersion: number;
  generationMethod: PromptGenerationMethod;
  polishApplied: boolean;
  requirementId: string;
}

type ComputeResult = { ok: true; data: ComputedPromptContent } | { ok: false; status: number; error: string; errors?: string[] };

function maxTimestamp(...values: (string | null | undefined)[]): string | null {
  const valid = values.filter((v): v is string => Boolean(v));
  if (valid.length === 0) return null;
  return valid.reduce((max, v) => (new Date(v) > new Date(max) ? v : max));
}

async function computePromptContent(
  supabase: SupabaseClient,
  options: GeneratePromptOptions
): Promise<ComputeResult> {
  const { storeId, aiTool, customAiTool, promptType, usePolish } = options;

  if (promptType !== "hp_initial_creation") {
    return {
      ok: false,
      status: 400,
      error: `「${PROMPT_TYPE_LABELS[promptType]}」のプロンプト生成は準備中です。現在生成できるのは「HP初回作成」のみです。`,
    };
  }

  const [storeRes, servicesRes, strengthsRes, requirementsRes, imagesRes] = await Promise.all([
    supabase.from("stores").select("*").eq("id", storeId).maybeSingle(),
    supabase.from("store_services").select("*").eq("store_id", storeId),
    supabase.from("store_strengths").select("*").eq("store_id", storeId).maybeSingle(),
    supabase.from("website_requirements").select("*").eq("store_id", storeId).maybeSingle(),
    supabase.from("store_images").select("*").eq("store_id", storeId),
  ]);

  if (storeRes.error || !storeRes.data) {
    return { ok: false, status: 404, error: "店舗が見つかりませんでした。" };
  }

  const store = rowToStore(storeRes.data as StoreRow);
  const services = ((servicesRes.data ?? []) as StoreServiceRow[]).map(rowToStoreService);
  const strengths = strengthsRes.data ? rowToStoreStrengths(strengthsRes.data as StoreStrengthsRow) : null;
  const images = ((imagesRes.data ?? []) as StoreImageRow[]).map(rowToStoreImage);

  if (!requirementsRes.data) {
    return { ok: false, status: 400, error: "HP制作条件が保存されていません。先にHP制作条件を入力してください。" };
  }
  const requirements = rowToWebsiteRequirements(requirementsRes.data as WebsiteRequirementsRow);

  const { data: sectionRows, error: sectionsError } = await supabase
    .from("website_sections")
    .select("*")
    .eq("website_requirement_id", requirements.id)
    .order("display_order", { ascending: true });

  if (sectionsError) {
    return { ok: false, status: 500, error: "セクション情報の取得に失敗しました。" };
  }
  const sections = ((sectionRows ?? []) as WebsiteSectionRow[]).map(rowToWebsiteSection);

  const readiness = checkPromptReadiness({ store, requirements, sections, images, services, strengths, aiTool });
  if (!readiness.canGenerate) {
    return { ok: false, status: 400, error: "必須項目が不足しているため生成できません。", errors: readiness.errors };
  }

  const { data: templateRow, error: templateError } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("ai_tool", aiTool)
    .eq("prompt_type", promptType)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (templateError || !templateRow) {
    return { ok: false, status: 500, error: "この組み合わせのテンプレートが見つかりませんでした。" };
  }
  const template = rowToPromptTemplate(templateRow as PromptTemplateRow);

  let content = buildHpInitialCreationPrompt({
    store,
    services,
    strengths,
    requirements,
    sections,
    images,
    templateBody: template.templateBody,
    aiTool,
  });

  let polishApplied = false;
  if (usePolish) {
    try {
      content = await polishPromptText(content);
      polishApplied = true;
    } catch (error) {
      console.error("prompt polish failed, falling back to rule-based content:", error);
    }
  }

  const storeUpdatedAtSnapshot = maxTimestamp(store.updatedAt, strengths?.updatedAt, ...services.map((s) => s.updatedAt));
  const imagesUpdatedAtSnapshot = maxTimestamp(...images.map((i) => i.updatedAt));
  const toolLabel = aiTool === "other" && customAiTool ? customAiTool : PROMPT_AI_TOOL_LABELS[aiTool];
  const title = `${store.name} - ${toolLabel} - ${PROMPT_TYPE_LABELS[promptType]}`;

  return {
    ok: true,
    data: {
      title,
      content,
      storeUpdatedAtSnapshot,
      imagesUpdatedAtSnapshot,
      templateVersion: template.version,
      generationMethod: polishApplied ? "rule_based_ai_polish" : "rule_based",
      polishApplied,
      requirementId: requirements.id,
    },
  };
}

export async function generatePromptForStore(
  supabase: SupabaseClient,
  options: GeneratePromptOptions
): Promise<GeneratePromptResult> {
  const computed = await computePromptContent(supabase, options);
  if (!computed.ok) return computed;

  const row = generatedPromptInsertToRow({
    storeId: options.storeId,
    websiteRequirementId: computed.data.requirementId,
    title: computed.data.title,
    promptType: options.promptType,
    aiTool: options.aiTool,
    customAiTool: options.aiTool === "other" ? (options.customAiTool ?? null) : null,
    content: computed.data.content,
    storeUpdatedAtSnapshot: computed.data.storeUpdatedAtSnapshot,
    imagesUpdatedAtSnapshot: computed.data.imagesUpdatedAtSnapshot,
    templateVersion: computed.data.templateVersion,
    generationMethod: computed.data.generationMethod,
  });

  const { data: inserted, error: insertError } = await supabase
    .from("generated_prompts")
    .insert(row)
    .select("*")
    .single();

  if (insertError) {
    console.error(insertError);
    return { ok: false, status: 500, error: `プロンプトの保存に失敗しました: ${insertError.message}` };
  }

  return { ok: true, prompt: rowToGeneratedPrompt(inserted as GeneratedPromptRow), polishApplied: computed.data.polishApplied };
}

// 既存のプロンプト行の内容だけを再生成して上書きする（タイトル・メモ・使用済みフラグは維持）
export async function regeneratePromptForStore(
  supabase: SupabaseClient,
  promptId: string,
  options: GeneratePromptOptions
): Promise<GeneratePromptResult> {
  const computed = await computePromptContent(supabase, options);
  if (!computed.ok) return computed;

  const { data: updated, error: updateError } = await supabase
    .from("generated_prompts")
    .update({
      content: computed.data.content,
      store_updated_at_snapshot: computed.data.storeUpdatedAtSnapshot,
      images_updated_at_snapshot: computed.data.imagesUpdatedAtSnapshot,
      template_version: computed.data.templateVersion,
      generation_method: computed.data.generationMethod,
      ai_tool: options.aiTool,
      custom_ai_tool: options.aiTool === "other" ? (options.customAiTool ?? null) : null,
    })
    .eq("id", promptId)
    .eq("store_id", options.storeId)
    .select("*")
    .maybeSingle();

  if (updateError) {
    console.error(updateError);
    return { ok: false, status: 500, error: `プロンプトの再生成に失敗しました: ${updateError.message}` };
  }
  if (!updated) {
    return { ok: false, status: 404, error: "プロンプトが見つかりませんでした。" };
  }

  return { ok: true, prompt: rowToGeneratedPrompt(updated as GeneratedPromptRow), polishApplied: computed.data.polishApplied };
}
