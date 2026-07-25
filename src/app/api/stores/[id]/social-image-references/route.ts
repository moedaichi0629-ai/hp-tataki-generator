import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToSocialImageReference, socialImageReferenceInsertToRow } from "@/lib/imageMapper";
import { socialImageReferenceCreateSchema, formatZodError } from "@/lib/imageValidation";
import { handleApiError } from "@/lib/apiHandler";
import type { SocialImageReferenceRow } from "@/types/supabaseSchema";

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
    .from("store_social_image_references")
    .select("*")
    .eq("store_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SNS投稿メモの取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({
    references: (data as SocialImageReferenceRow[]).map(rowToSocialImageReference),
  });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = socialImageReferenceCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const row = socialImageReferenceInsertToRow(id, parsed.data);
  const { data, error } = await supabase.from("store_social_image_references").insert(row).select("*").single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: `SNS投稿メモの保存に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json(
    { reference: rowToSocialImageReference(data as SocialImageReferenceRow) },
    { status: 201 }
  );
}
