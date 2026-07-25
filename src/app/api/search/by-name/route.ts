import { NextResponse } from "next/server";
import { resolveCandidatesByNameAddress } from "@/lib/placeIdResolver";
import { describeFetchError } from "@/lib/errorUtils";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { searchByNameAddressSchema } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`search-by-name:${getClientKey(request)}`, 20, 60_000);
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
  const parsed = searchByNameAddressSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "店名を入力してください。" }, { status: 400 });
  }

  try {
    const candidates = await resolveCandidatesByNameAddress(parsed.data.name, parsed.data.address, apiKey);

    if (candidates.length === 0) {
      return NextResponse.json({ error: "該当する店舗が見つかりませんでした。" }, { status: 404 });
    }

    try {
      await getSupabaseServerClient().from("search_histories").insert({
        search_type: "name_address",
        params: { name: parsed.data.name, address: parsed.data.address },
        result_count: candidates.length,
      });
    } catch (error) {
      console.error("search_histories insert failed:", error);
    }

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: describeFetchError(error, "店舗検索") }, { status: 500 });
  }
}
