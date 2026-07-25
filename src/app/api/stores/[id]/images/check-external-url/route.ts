import { NextResponse } from "next/server";
import { checkExternalImageUrl, UnsafeUrlError } from "@/lib/externalUrlGuard";
import { checkExternalUrlSchema, formatZodError } from "@/lib/imageValidation";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`check-external-url:${getClientKey(request)}`, 20, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkExternalUrlSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  try {
    const result = await checkExternalImageUrl(parsed.data.url);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "画像URLの確認中にエラーが発生しました。" }, { status: 500 });
  }
}
