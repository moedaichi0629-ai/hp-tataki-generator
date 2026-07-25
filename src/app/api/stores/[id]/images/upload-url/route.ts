import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requestUploadUrlSchema, formatZodError, STORE_IMAGES_BUCKET } from "@/lib/imageValidation";
import { buildStorageObjectPath } from "@/lib/imageStorage";
import { handleApiError } from "@/lib/apiHandler";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// アップロード対象ファイルを検証したうえで、ブラウザから直接Supabase Storageへアップロードするための
// 署名付きURLを発行する。サーバー（Vercel関数）はファイルの実バイトを一切扱わない
// （Vercelのリクエストボディ上限を回避し、10MB程度までのアップロードに対応するため）。
export async function POST(request: Request, { params }: RouteParams) {
  const rateLimit = checkRateLimit(`images-upload-url:${getClientKey(request)}`, 30, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = requestUploadUrlSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const path = buildStorageObjectPath(id, parsed.data.fileName);

  const { data, error } = await supabase.storage.from(STORE_IMAGES_BUCKET).createSignedUploadUrl(path);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: `アップロードURLの発行に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
