import type { SupabaseClient } from "@supabase/supabase-js";

// website_sectionsはwebsite_requirement_idにぶら下がるため、
// まだHP制作条件が保存されていない店舗でセクションを先に追加しようとした場合は、
// 空のwebsite_requirementsを自動作成してから紐付ける
export async function getOrCreateRequirementId(supabase: SupabaseClient, storeId: string): Promise<string> {
  const { data: existing, error: fetchError } = await supabase
    .from("website_requirements")
    .select("id")
    .eq("store_id", storeId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (existing) return (existing as { id: string }).id;

  const { data: created, error: insertError } = await supabase
    .from("website_requirements")
    .insert({ store_id: storeId })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);
  return (created as { id: string }).id;
}
