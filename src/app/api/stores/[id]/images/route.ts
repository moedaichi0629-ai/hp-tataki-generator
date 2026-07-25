import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreImage, storeImageInsertToRow } from "@/lib/imageMapper";
import { registerStoreImageSchema, formatZodError } from "@/lib/imageValidation";
import { handleApiError } from "@/lib/apiHandler";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import type { StoreImageRow } from "@/types/supabaseSchema";

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
    .from("store_images")
    .select("*")
    .eq("store_id", id)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "画像一覧の取得に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ images: (data as StoreImageRow[]).map(rowToStoreImage) });
}

export async function POST(request: Request, { params }: RouteParams) {
  const rateLimit = checkRateLimit(`images-create:${getClientKey(request)}`, 60, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = registerStoreImageSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const input = parsed.data;

  const { data: maxRow } = await supabase
    .from("store_images")
    .select("display_order")
    .eq("store_id", id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = maxRow ? (maxRow as { display_order: number }).display_order + 1 : 0;

  let row;
  if (input.sourceType === "user_upload") {
    const { data: publicUrlData } = supabase.storage.from("store-images").getPublicUrl(input.storagePath);
    row = storeImageInsertToRow(id, {
      sourceType: "user_upload",
      name: input.name,
      storageUrl: publicUrlData.publicUrl,
      width: input.width,
      height: input.height,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      displayOrder: nextOrder,
    });
  } else if (input.sourceType === "external_url") {
    row = storeImageInsertToRow(id, {
      sourceType: "external_url",
      name: input.name,
      externalUrl: input.externalUrl,
      displayOrder: nextOrder,
    });
  } else {
    row = storeImageInsertToRow(id, {
      sourceType: "sns_reference",
      name: input.name,
      snsPostUrl: input.snsPostUrl,
      displayOrder: nextOrder,
    });
  }

  const { data, error } = await supabase.from("store_images").insert(row).select("*").single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: `画像情報の保存に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ image: rowToStoreImage(data as StoreImageRow) }, { status: 201 });
}
