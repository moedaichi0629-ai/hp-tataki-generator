import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStoreStrengths, storeStrengthsUpdateToRow } from "@/lib/storeMapper";
import { storeStrengthsSchema, formatZodError } from "@/lib/validation";
import { handleApiError } from "@/lib/apiHandler";
import type { StoreStrengthsRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const EMPTY_STRENGTHS_FIELDS = {
  goodPoints: "",
  atmosphere: "",
  serviceQuality: "",
  accessNotes: "",
  targetCustomer: "",
  differentiators: "",
  potentialConcerns: "",
  hpKeyMessages: "",
  recommendedCta: "",
  cautions: "",
  improvementCandidates: "",
  aiGenerated: false,
  aiDisclaimerShown: false,
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data, error } = await supabase.from("store_strengths").select("*").eq("store_id", id).maybeSingle();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "強み情報の取得に失敗しました。" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ strengths: { storeId: id, updatedAt: null, ...EMPTY_STRENGTHS_FIELDS } });
  }

  return NextResponse.json({ strengths: rowToStoreStrengths(data as StoreStrengthsRow) });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = storeStrengthsSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }
  const row = storeStrengthsUpdateToRow(id, parsed.data);

  const { data, error } = await supabase
    .from("store_strengths")
    .upsert(row, { onConflict: "store_id" })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `強み情報の保存に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ strengths: rowToStoreStrengths(data as StoreStrengthsRow) });
}
