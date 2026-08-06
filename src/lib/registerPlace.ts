import type { PlaceSearchResult, Store } from "@/types/store";

export interface RegisterPlaceOptions {
  force?: boolean;
  registrationRegion?: string | null;
  registrationSearchRadiusMeters?: number | null;
}

export type RegisterPlaceResult =
  | { status: "created"; store: Store }
  | { status: "exists"; existingStore: Store }
  | { status: "duplicates"; candidates: Store[] }
  | { status: "error"; message: string };

export async function registerPlace(
  place: PlaceSearchResult,
  options: RegisterPlaceOptions = {}
): Promise<RegisterPlaceResult> {
  try {
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        force: Boolean(options.force),
        placeId: place.placeId,
        name: place.name,
        address: place.address || null,
        lat: place.lat,
        lng: place.lng,
        phoneNumber: place.phoneNumber,
        businessHours: place.openingHours,
        googleMapsUrl: place.mapUrl,
        officialWebsiteUrl: place.website,
        googleRating: place.rating,
        googleReviewCount: place.reviewCount,
        googleCategories: place.categories,
        registrationRegion: options.registrationRegion ?? null,
        registrationSearchRadiusMeters: options.registrationSearchRadiusMeters ?? null,
      }),
    });
    const data = await res.json();

    if (res.status === 409) {
      return { status: "exists", existingStore: data.existingStore as Store };
    }
    if (!res.ok) {
      return { status: "error", message: data.error ?? "登録に失敗しました。" };
    }
    if (data.duplicateCandidates) {
      return { status: "duplicates", candidates: data.duplicateCandidates as Store[] };
    }

    return { status: "created", store: data.store as Store };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "登録に失敗しました。",
    };
  }
}
