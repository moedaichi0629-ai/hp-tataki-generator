import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// service_role キーを使うため、このモジュールは必ずAPI Route（サーバー側）からのみimportすること。
// クライアントコンポーネントにバンドルされないよう "server-only" で防止している。

let client: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URLまたはSUPABASE_SERVICE_ROLE_KEYが設定されていません。.env.localを確認してください。"
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
