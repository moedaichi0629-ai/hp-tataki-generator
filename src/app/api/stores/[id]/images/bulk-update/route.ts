import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreImage } from "@/lib/imageMapper";
import { bulkUpdateStoreImagesSchema, formatZodError } from "@/lib/imageValidation";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreImageRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bulkUpdateStoreImagesSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { imageIds, patch } = parsed.data;

  if (patch.addUsageType) {
    // 使用用途は配列のため、既存値に追記する形で1件ずつ更新する
    const { data: targets, error: fetchError } = await supabase
      .from("store_images")
      .select("id, usage_types")
      .eq("store_id", id)
      .in("id", imageIds);

    if (fetchError) {
      console.error(fetchError);
      return NextResponse.json({ error: "画像の一括更新に失敗しました。" }, { status: 500 });
    }

    const updates = (targets as { id: string; usage_types: string[] }[]).map((t) => {
      const usageTypes = Array.from(new Set([...(t.usage_types ?? []), patch.addUsageType]));
      return supabase.from("store_images").update({ usage_types: usageTypes }).eq("id", t.id);
    });
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      console.error(failed.error);
      return NextResponse.json({ error: "画像の一括更新に失敗しました。" }, { status: 500 });
    }
  }

  const simplePatch: Record<string, unknown> = {};
  if (patch.isSelected !== undefined) simplePatch.is_selected = patch.isSelected;
  if (patch.permissionStatus !== undefined) simplePatch.permission_status = patch.permissionStatus;

  if (Object.keys(simplePatch).length > 0) {
    const { error } = await supabase.from("store_images").update(simplePatch).eq("store_id", id).in("id", imageIds);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "画像の一括更新に失敗しました。" }, { status: 500 });
    }
  }

  const { data: updatedImages, error: reloadError } = await supabase
    .from("store_images")
    .select("*")
    .eq("store_id", id)
    .order("display_order", { ascending: true });

  if (reloadError) {
    console.error(reloadError);
    return NextResponse.json({ error: "画像一覧の取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ images: (updatedImages as StoreImageRow[]).map(rowToStoreImage) });
}
