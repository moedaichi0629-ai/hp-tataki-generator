import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { handleApiError } from "@/lib/apiHandler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "並び順の指定が正しくありません。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return handleApiError(error);
  }

  const updates = parsed.data.orderedIds.map((imageId, index) =>
    supabase.from("store_images").update({ display_order: index }).eq("id", imageId).eq("store_id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error(failed.error);
    return NextResponse.json({ error: "並び順の更新に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
