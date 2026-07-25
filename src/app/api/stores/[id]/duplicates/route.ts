import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { findDuplicates } from "@/lib/duplicateDetection";
import { rowToStore } from "@/lib/storeMapper";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase.from("stores").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "店舗が見つかりませんでした。" }, { status: 404 });
    }

    const store = rowToStore(data as StoreRow);
    const result = await findDuplicates({
      name: store.name,
      address: store.address,
      phoneNumber: store.phoneNumber,
      lat: store.lat,
      lng: store.lng,
    });

    const candidates = result.candidates.filter((c) => c.id !== id);

    return NextResponse.json({ candidates });
  } catch (error) {
    return handleApiError(error, "重複候補の取得に失敗しました。");
  }
}
