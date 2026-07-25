import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToWebsiteSection, websiteSectionUpdateToRow } from "@/lib/promptMapper";
import { websiteSectionUpdateSchema, formatZodError } from "@/lib/promptValidation";
import { handleApiError } from "@/lib/apiHandler";
import type { WebsiteSectionRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; sectionId: string }>;
}

async function resolveRequirementId(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  storeId: string
): Promise<string | null> {
  const { data } = await supabase.from("website_requirements").select("id").eq("store_id", storeId).maybeSingle();
  return data ? (data as { id: string }).id : null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, sectionId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = websiteSectionUpdateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const requirementId = await resolveRequirementId(supabase, id);
  if (!requirementId) {
    return NextResponse.json({ error: "セクションが見つかりませんでした。" }, { status: 404 });
  }

  const row = websiteSectionUpdateToRow(parsed.data);
  const { data, error } = await supabase
    .from("website_sections")
    .update(row)
    .eq("id", sectionId)
    .eq("website_requirement_id", requirementId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `セクションの更新に失敗しました: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "セクションが見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ section: rowToWebsiteSection(data as WebsiteSectionRow) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, sectionId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const requirementId = await resolveRequirementId(supabase, id);
  if (!requirementId) {
    return NextResponse.json({ error: "セクションが見つかりませんでした。" }, { status: 404 });
  }

  const { error } = await supabase
    .from("website_sections")
    .delete()
    .eq("id", sectionId)
    .eq("website_requirement_id", requirementId);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "セクションの削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
