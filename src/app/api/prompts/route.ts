import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToGeneratedPrompt } from "@/lib/promptMapper";
import { handleApiError } from "@/lib/apiHandler";
import type { GeneratedPromptRow, StoreImageRow } from "@/types/supabaseSchema";

interface StoreJoinRow extends GeneratedPromptRow {
  stores: { name: string; updated_at: string } | null;
}

export async function GET(request: Request) {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { searchParams } = new URL(request.url);
  const storeName = searchParams.get("storeName")?.trim().toLowerCase();
  const aiTool = searchParams.get("aiTool");
  const promptType = searchParams.get("promptType");
  const isUsed = searchParams.get("isUsed");
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const freshness = searchParams.get("freshness"); // "fresh" | "stale"

  let query = supabase
    .from("generated_prompts")
    .select("*, stores(name, updated_at)")
    .order("created_at", { ascending: false });

  if (aiTool) query = query.eq("ai_tool", aiTool);
  if (promptType) query = query.eq("prompt_type", promptType);
  if (isUsed === "true" || isUsed === "false") query = query.eq("is_used", isUsed === "true");
  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "プロンプト履歴の取得に失敗しました。" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as StoreJoinRow[];

  const storeIds = Array.from(new Set(rows.map((r) => r.store_id)));
  const { data: imageRows } = await supabase
    .from("store_images")
    .select("store_id, updated_at")
    .in("store_id", storeIds.length > 0 ? storeIds : ["__none__"]);

  const latestImageUpdateByStore = new Map<string, string>();
  ((imageRows ?? []) as Pick<StoreImageRow, "store_id" | "updated_at">[]).forEach((row) => {
    const current = latestImageUpdateByStore.get(row.store_id);
    if (!current || new Date(row.updated_at) > new Date(current)) {
      latestImageUpdateByStore.set(row.store_id, row.updated_at);
    }
  });

  let results = rows.map((row) => {
    const storeName2 = row.stores?.name ?? "(削除された店舗)";
    const currentStoreUpdatedAt = row.stores?.updated_at ?? null;
    const currentImagesUpdatedAt = latestImageUpdateByStore.get(row.store_id) ?? null;

    const isStale = Boolean(
      (row.store_updated_at_snapshot &&
        currentStoreUpdatedAt &&
        new Date(currentStoreUpdatedAt) > new Date(row.store_updated_at_snapshot)) ||
        (row.images_updated_at_snapshot &&
          currentImagesUpdatedAt &&
          new Date(currentImagesUpdatedAt) > new Date(row.images_updated_at_snapshot))
    );

    return { prompt: rowToGeneratedPrompt(row), storeName: storeName2, isStale };
  });

  if (storeName) {
    results = results.filter((r) => r.storeName.toLowerCase().includes(storeName));
  }
  if (freshness === "fresh") results = results.filter((r) => !r.isStale);
  if (freshness === "stale") results = results.filter((r) => r.isStale);

  return NextResponse.json({ results });
}
