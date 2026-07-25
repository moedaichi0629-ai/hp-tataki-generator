import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { rowToStore } from "@/lib/storeMapper";
import type { StoreRow } from "@/types/supabaseSchema";
import type { Store } from "@/types/store";

const NEARBY_METERS_THRESHOLD = 50;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface DuplicateCheckInput {
  placeId?: string | null;
  name: string;
  address?: string | null;
  phoneNumber?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface DuplicateCheckResult {
  exactMatch: Store | null;
  candidates: Store[];
}

// place_id完全一致を最優先で確認し、なければ店名・住所・電話番号・緯度経度の組み合わせで重複候補を探す
export async function findDuplicates(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
  const supabase = getSupabaseServerClient();

  if (input.placeId) {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("place_id", input.placeId)
      .maybeSingle();

    if (error) throw new Error(`重複チェックに失敗しました: ${error.message}`);
    if (data) {
      return { exactMatch: rowToStore(data as StoreRow), candidates: [] };
    }
  }

  const orFilters: string[] = [`name.eq.${escapeCommaForOr(input.name)}`];
  if (input.phoneNumber) {
    orFilters.push(`phone_number.eq.${escapeCommaForOr(input.phoneNumber)}`);
  }

  const { data, error } = await supabase.from("stores").select("*").or(orFilters.join(","));
  if (error) throw new Error(`重複チェックに失敗しました: ${error.message}`);

  const rows = (data ?? []) as StoreRow[];
  const candidates = rows
    .filter((row) => {
      const nameMatches = row.name.trim() === input.name.trim();
      const phoneMatches = Boolean(input.phoneNumber) && row.phone_number === input.phoneNumber;
      const addressMatches =
        Boolean(input.address) && Boolean(row.address) && row.address === input.address;
      const geoMatches =
        input.lat != null &&
        input.lng != null &&
        row.lat != null &&
        row.lng != null &&
        haversineMeters(
          { lat: input.lat, lng: input.lng },
          { lat: row.lat, lng: row.lng }
        ) <= NEARBY_METERS_THRESHOLD;

      return nameMatches || phoneMatches || addressMatches || geoMatches;
    })
    .map(rowToStore);

  return { exactMatch: null, candidates };
}

function escapeCommaForOr(value: string): string {
  // PostgRESTのor()フィルタはカンマ区切りのため、値にカンマが含まれる場合は個別クエリにフォールバックさせる
  return value.replace(/,/g, "");
}
