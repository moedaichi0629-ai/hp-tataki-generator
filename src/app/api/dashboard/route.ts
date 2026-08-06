import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStore } from "@/lib/storeMapper";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreRow } from "@/types/supabaseSchema";

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    total,
    newThisMonth,
    noWebsite,
    unconfirmedWebsite,
    infoChecking,
    salesTarget,
    notTarget,
    recentCreated,
    recentUpdated,
    requirementStoreIds,
    selectedImageStoreIds,
  ] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("stores").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("official_website_status", "none"),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("official_website_status", "unconfirmed"),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("store_status", "info_checking"),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_sales_target", true),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_sales_target", false),
    supabase.from("stores").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("stores").select("*").order("updated_at", { ascending: false }).limit(5),
    supabase.from("website_requirements").select("store_id"),
    supabase.from("store_images").select("store_id").eq("is_selected", true),
  ]);

  const errors = [
    total.error,
    newThisMonth.error,
    noWebsite.error,
    unconfirmedWebsite.error,
    infoChecking.error,
    salesTarget.error,
    notTarget.error,
    recentCreated.error,
    recentUpdated.error,
    requirementStoreIds.error,
    selectedImageStoreIds.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error(errors);
    return NextResponse.json({ error: "ダッシュボード情報の取得に失敗しました。" }, { status: 500 });
  }

  const totalStores = total.count ?? 0;
  const storesWithRequirements = new Set(
    ((requirementStoreIds.data ?? []) as { store_id: string }[]).map((r) => r.store_id)
  );
  const storesWithSelectedImages = new Set(
    ((selectedImageStoreIds.data ?? []) as { store_id: string }[]).map((r) => r.store_id)
  );

  return NextResponse.json({
    totalStores,
    newStoresThisMonth: newThisMonth.count ?? 0,
    noWebsiteCount: noWebsite.count ?? 0,
    unconfirmedWebsiteCount: unconfirmedWebsite.count ?? 0,
    infoCheckingCount: infoChecking.count ?? 0,
    salesTargetCount: salesTarget.count ?? 0,
    notTargetCount: notTarget.count ?? 0,
    requirementsMissingCount: Math.max(0, totalStores - storesWithRequirements.size),
    imagesInsufficientCount: Math.max(0, totalStores - storesWithSelectedImages.size),
    recentCreatedStores: ((recentCreated.data ?? []) as StoreRow[]).map(rowToStore),
    recentUpdatedStores: ((recentUpdated.data ?? []) as StoreRow[]).map(rowToStore),
  });
}
