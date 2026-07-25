import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getPlacePhotos } from "@/lib/googlePlaces";
import { rowToStoreImage } from "@/lib/imageMapper";
import { describeFetchError } from "@/lib/errorUtils";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreImageInsertRow, StoreRow, StoreImageRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const rateLimit = checkRateLimit(`google-photos-fetch:${getClientKey(request)}`, 15, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEYが設定されていません。.env.localを確認してください。" },
      { status: 500 }
    );
  }

  const { id } = await params;

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (storeError || !storeData) {
    return NextResponse.json({ error: "店舗が見つかりませんでした。" }, { status: 404 });
  }

  const store = storeData as StoreRow;
  if (!store.place_id) {
    return NextResponse.json(
      { error: "この店舗にはPlace IDが登録されていないため、Googleマップ写真を取得できません。" },
      { status: 400 }
    );
  }

  try {
    const photos = await getPlacePhotos(store.place_id, apiKey);
    if (!photos) {
      return NextResponse.json({ error: "Googleマップから店舗情報を取得できませんでした。" }, { status: 404 });
    }
    if (photos.length === 0) {
      return NextResponse.json(
        { error: "この店舗にはGoogleマップ上の写真が登録されていません。", images: [] },
        { status: 200 }
      );
    }

    const { data: existingRows } = await supabase
      .from("store_images")
      .select("google_photo_resource_name, display_order")
      .eq("store_id", id)
      .eq("source_type", "google_maps");

    const existingRefs = new Map(
      ((existingRows ?? []) as { google_photo_resource_name: string | null; display_order: number }[]).map((r) => [
        r.google_photo_resource_name,
        r.display_order,
      ])
    );

    let nextOrder = existingRefs.size > 0 ? Math.max(...existingRefs.values()) + 1 : 0;
    const fetchedAt = new Date().toISOString();

    const newRows: StoreImageInsertRow[] = [];
    const updates: PromiseLike<unknown>[] = [];

    for (const p of photos) {
      if (existingRefs.has(p.photoReference)) {
        // 既存の写真: 表示順・使用設定などユーザーの変更は保持し、Google側のメタデータのみ更新する
        updates.push(
          supabase
            .from("store_images")
            .update({
              width: p.width,
              height: p.height,
              author_name: p.authorName,
              google_maps_uri: p.authorUri,
              fetched_at: fetchedAt,
            })
            .eq("store_id", id)
            .eq("google_photo_resource_name", p.photoReference)
        );
      } else {
        newRows.push({
          store_id: id,
          source_type: "google_maps",
          google_photo_resource_name: p.photoReference,
          width: p.width,
          height: p.height,
          author_name: p.authorName,
          google_maps_uri: p.authorUri,
          display_order: nextOrder++,
          fetched_at: fetchedAt,
        });
      }
    }

    if (newRows.length > 0) {
      const { error: insertError } = await supabase.from("store_images").insert(newRows);
      if (insertError) {
        console.error(insertError);
        return NextResponse.json({ error: "Googleマップ写真情報の保存に失敗しました。" }, { status: 500 });
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    const { data: allImages, error: fetchError } = await supabase
      .from("store_images")
      .select("*")
      .eq("store_id", id)
      .order("display_order", { ascending: true });

    if (fetchError) {
      console.error(fetchError);
      return NextResponse.json({ error: "画像一覧の取得に失敗しました。" }, { status: 500 });
    }

    return NextResponse.json({ images: (allImages as StoreImageRow[]).map(rowToStoreImage) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: describeFetchError(error, "Googleマップ写真情報の取得") }, { status: 500 });
  }
}
