import { NextResponse } from "next/server";
import { expandMapUrl, extractFromMapUrl, InvalidMapUrlError } from "@/lib/mapUrlResolver";
import { resolveCandidatesFromExtraction } from "@/lib/placeIdResolver";
import { describeFetchError } from "@/lib/errorUtils";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { searchByMapUrlSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { recordSearchHistory } from "@/lib/searchHistory";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`resolve-map-url:${getClientKey(request)}`, 20, 60_000);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
      { status: 429 }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEYが設定されていません。.env.localを確認してください。" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = searchByMapUrlSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "GoogleマップURLを入力してください。" }, { status: 400 });
  }

  try {
    const finalUrl = await expandMapUrl(parsed.data.url);
    const extraction = extractFromMapUrl(finalUrl);
    const candidates = await resolveCandidatesFromExtraction(extraction, apiKey);

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "このURLから店舗を特定できませんでした。店名や住所での個別検索をお試しください。" },
        { status: 404 }
      );
    }

    try {
      await recordSearchHistory(getSupabaseServerClient(), {
        searchType: "map_url",
        params: { url: parsed.data.url },
        resultCount: candidates.length,
      });
    } catch (error) {
      console.error("search_histories insert failed:", error);
    }

    return NextResponse.json({ candidates });
  } catch (error) {
    if (error instanceof InvalidMapUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: describeFetchError(error, "GoogleマップURLの解決") }, { status: 500 });
  }
}
