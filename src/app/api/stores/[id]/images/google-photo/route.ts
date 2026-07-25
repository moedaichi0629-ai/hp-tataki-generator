import { NextResponse } from "next/server";
import { fetchPlacePhotoBytes } from "@/lib/googlePlaces";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

// Googleマップ写真の実バイトをサーバー側で取得しそのまま配信するプロキシ。
// <img src="/api/stores/[id]/images/google-photo?ref=...&maxwidth=..."> から利用する。
// APIキーをクライアントへ渡さないため、また画像を自前ストレージへ複製しないための構成。
export async function GET(request: Request) {
  const rateLimit = checkRateLimit(`google-photo-proxy:${getClientKey(request)}`, 120, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。" }, { status: 429 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEYが設定されていません。" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const photoReference = searchParams.get("ref");
  const maxWidth = Number(searchParams.get("maxwidth") ?? "400");

  if (!photoReference) {
    return NextResponse.json({ error: "写真参照情報が指定されていません。" }, { status: 400 });
  }

  try {
    const res = await fetchPlacePhotoBytes(photoReference, maxWidth, apiKey);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Googleマップ写真の取得に失敗しました。写真参照情報が期限切れの可能性があります。再取得をお試しください。" },
        { status: 404 }
      );
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Googleマップ写真の取得中にエラーが発生しました。" }, { status: 500 });
  }
}
