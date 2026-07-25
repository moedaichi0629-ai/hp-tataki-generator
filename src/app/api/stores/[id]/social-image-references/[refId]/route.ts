import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToSocialImageReference, socialImageReferenceUpdateToRow } from "@/lib/imageMapper";
import { socialImageReferenceSchema, formatZodError } from "@/lib/imageValidation";
import { handleApiError } from "@/lib/apiHandler";
import type { SocialImageReferenceRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; refId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, refId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = socialImageReferenceSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const row = socialImageReferenceUpdateToRow(parsed.data);
  const { data, error } = await supabase
    .from("store_social_image_references")
    .update(row)
    .eq("id", refId)
    .eq("store_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `SNS投稿メモの更新に失敗しました: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "SNS投稿メモが見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ reference: rowToSocialImageReference(data as SocialImageReferenceRow) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, refId } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { error } = await supabase
    .from("store_social_image_references")
    .delete()
    .eq("id", refId)
    .eq("store_id", id);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "SNS投稿メモの削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
