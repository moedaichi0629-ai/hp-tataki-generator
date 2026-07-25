import { NextResponse } from "next/server";

// getSupabaseServerClient()はSUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY未設定時に同期的にthrowするため、
// 各API Routeハンドラのcatch節でこれを使い、DB未接続時にも必ずJSONエラーを返せるようにする
export function handleApiError(error: unknown, fallbackMessage = "サーバーでエラーが発生しました。しばらくしてから再度お試しください。") {
  console.error(error);
  const message = error instanceof Error && error.message.includes("SUPABASE") ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 500 });
}
