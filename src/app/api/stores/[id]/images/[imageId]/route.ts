import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreImage, storeImageUpdateToRow } from "@/lib/imageMapper";
import { updateStoreImageSchema, formatZodError, STORE_IMAGES_BUCKET } from "@/lib/imageValidation";
import { extractStoragePathFromPublicUrl } from "@/lib/imageStorage";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreImageRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string; imageId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, imageId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateStoreImageSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const row = storeImageUpdateToRow(parsed.data);
  const { data, error } = await supabase
    .from("store_images")
    .update(row)
    .eq("id", imageId)
    .eq("store_id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `画像情報の更新に失敗しました: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "画像が見つかりませんでした。" }, { status: 404 });
  }

  return NextResponse.json({ image: rowToStoreImage(data as StoreImageRow) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, imageId } = await params;

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data: existing } = await supabase
    .from("store_images")
    .select("*")
    .eq("id", imageId)
    .eq("store_id", id)
    .maybeSingle();

  const { error } = await supabase.from("store_images").delete().eq("id", imageId).eq("store_id", id);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "画像の削除に失敗しました。" }, { status: 500 });
  }

  const row = existing as StoreImageRow | null;
  if (row?.source_type === "user_upload" && row.storage_url) {
    const path = extractStoragePathFromPublicUrl(row.storage_url);
    if (path) {
      const { error: removeError } = await supabase.storage.from(STORE_IMAGES_BUCKET).remove([path]);
      if (removeError) {
        console.error("storage object removal failed:", removeError);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
