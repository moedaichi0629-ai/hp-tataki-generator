import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchType } from "@/types/store";

interface RecordSearchHistoryInput {
  searchType: SearchType;
  region?: string | null;
  industry?: string | null;
  params: Record<string, unknown>;
  resultCount: number;
}

// 同じ条件の検索が繰り返された場合は、古い履歴を削除してから新しく保存する。
// これにより検索履歴が重複して積み上がらず、最新の実行結果・日時で1件だけ残る。
export async function recordSearchHistory(supabase: SupabaseClient, input: RecordSearchHistoryInput): Promise<void> {
  let query = supabase.from("search_histories").select("id").eq("search_type", input.searchType);

  if (input.searchType === "region_industry") {
    query = input.region ? query.eq("region", input.region) : query.is("region", null);
    query = input.industry ? query.eq("industry", input.industry) : query.is("industry", null);
  } else if (input.searchType === "map_url") {
    query = query.eq("params->>url", String(input.params.url ?? ""));
  } else if (input.searchType === "name_address") {
    query = query
      .eq("params->>name", String(input.params.name ?? ""))
      .eq("params->>address", String(input.params.address ?? ""));
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    await supabase
      .from("search_histories")
      .delete()
      .eq("id", (existing as { id: string }).id);
  }

  await supabase.from("search_histories").insert({
    search_type: input.searchType,
    region: input.region ?? null,
    industry: input.industry ?? null,
    params: input.params,
    result_count: input.resultCount,
  });
}
