import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToWebsiteRequirements, websiteRequirementsUpdateToRow } from "@/lib/promptMapper";
import { websiteRequirementsUpdateSchema, formatZodError } from "@/lib/promptValidation";
import { handleApiError } from "@/lib/apiHandler";
import type { WebsiteRequirementsRow } from "@/types/supabaseSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const EMPTY_REQUIREMENTS_FIELDS = {
  purposes: [] as string[],
  websiteType: null,
  targetAudience: null,
  mainMessage: null,
  keyStrengthsNote: null,
  primaryAction: null,
  contactMethod: null,
  reservationMethod: null,
  excludedInformation: null,
  notes: null,
  supplementaryInstructions: null,
  technology: null,
  technologyOther: null,
  deploymentMethod: null,
  deploymentMethodOther: null,
  supportedDevices: [] as string[],
  seoEnabled: true,
  accessibilityEnabled: false,
  mapEnabled: true,
  snsEnabled: false,
  formEnabled: false,
  animationEnabled: false,
  updateFriendliness: null,
  externalIntegrations: null,
  deliveryFormat: null,
  deliveryFormatOther: null,
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const { data, error } = await supabase
    .from("website_requirements")
    .select("*")
    .eq("store_id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "HP制作条件の取得に失敗しました。" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      requirements: { id: null, storeId: id, createdAt: null, updatedAt: null, ...EMPTY_REQUIREMENTS_FIELDS },
    });
  }

  return NextResponse.json({ requirements: rowToWebsiteRequirements(data as WebsiteRequirementsRow) });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = websiteRequirementsUpdateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const row = websiteRequirementsUpdateToRow(id, parsed.data);
  const { data, error } = await supabase
    .from("website_requirements")
    .upsert(row, { onConflict: "store_id" })
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: `HP制作条件の保存に失敗しました: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ requirements: rowToWebsiteRequirements(data as WebsiteRequirementsRow) });
}
