import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET() {
  const googlePlacesConfigured = Boolean(process.env.GOOGLE_PLACES_API_KEY);
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const supabaseUrlConfigured = Boolean(process.env.SUPABASE_URL);
  const supabaseKeyConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  let databaseConnected = false;
  let databaseError: string | null = null;
  if (supabaseUrlConfigured && supabaseKeyConfigured) {
    try {
      const { error } = await getSupabaseServerClient().from("stores").select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      databaseConnected = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : "データベースへの接続に失敗しました。";
    }
  }

  return NextResponse.json({
    googlePlacesConfigured,
    openaiConfigured,
    supabaseUrlConfigured,
    supabaseKeyConfigured,
    databaseConnected,
    databaseError,
  });
}
