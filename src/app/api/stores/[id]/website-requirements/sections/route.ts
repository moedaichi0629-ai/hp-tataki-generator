import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getOrCreateRequirementId } from "@/lib/websiteRequirementsHelper";
import { rowToWebsiteSection, websiteSectionInsertToRow } from "@/lib/promptMapper";
import { websiteSectionCreateSchema, formatZodError } from "@/lib/promptValidation";
import { handleApiError } from "@/lib/apiHandler";
import type { WebsiteSectionRow } from "@/types/supabaseSchema";

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

  const { data: requirement } = await supabase
    .from("website_requirements")
    .select("id")
    .eq("store_id", id)
    .maybeSingle();

  if (!requirement) {
    return NextResponse.json({ sections: [] });
  }

  const { data, error } = await supabase
    .from("website_sections")
    .select("*")
    .eq("website_requirement_id", (requirement as { id: string }).id)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "セクション一覧の取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ sections: (data as WebsiteSectionRow[]).map(rowToWebsiteSection) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = websiteSectionCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  try {
    const requirementId = await getOrCreateRequirementId(supabase, id);

    const { data: maxRow } = await supabase
      .from("website_sections")
      .select("display_order")
      .eq("website_requirement_id", requirementId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = maxRow ? (maxRow as { display_order: number }).display_order + 1 : 0;

    const row = websiteSectionInsertToRow(requirementId, {
      ...parsed.data,
      displayOrder: parsed.data.displayOrder ?? nextOrder,
    });

    const { data, error } = await supabase.from("website_sections").insert(row).select("*").single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "このセクションは既に追加されています。" }, { status: 409 });
      }
      console.error(error);
      return NextResponse.json({ error: `セクションの追加に失敗しました: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ section: rowToWebsiteSection(data as WebsiteSectionRow) }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "セクションの追加に失敗しました。");
  }
}
