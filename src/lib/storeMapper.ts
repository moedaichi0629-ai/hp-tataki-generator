import type {
  SearchHistoryRow,
  StoreInsertRow,
  StoreNoteInsertRow,
  StoreNoteRow,
  StoreNoteUpdateRow,
  StoreReviewRow,
  StoreRow,
  StoreServiceInsertRow,
  StoreServiceRow,
  StoreServiceUpdateRow,
  StoreStrengthsRow,
  StoreStrengthsUpsertRow,
  StoreUpdateRow,
} from "@/types/supabaseSchema";
import type {
  SearchHistory,
  Store,
  StoreInsert,
  StoreNote,
  StoreNoteInsert,
  StoreNoteUpdate,
  StoreReview,
  StoreService,
  StoreServiceInsert,
  StoreServiceUpdate,
  StoreStrengths,
  StoreStrengthsUpdate,
  StoreUpdate,
} from "@/types/store";

export function rowToStore(row: StoreRow): Store {
  return {
    id: row.id,
    placeId: row.place_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    industry: row.industry,
    category: row.category,
    description: row.description,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    phoneNumber: row.phone_number,
    businessHours: row.business_hours,
    closedDays: row.closed_days,
    priceRange: row.price_range,
    nearestStation: row.nearest_station,
    parkingInfo: row.parking_info,
    paymentMethods: row.payment_methods,
    accessibilityInfo: row.accessibility_info,
    googleMapsUrl: row.google_maps_url,
    officialWebsiteUrl: row.official_website_url,
    bookingSiteUrl: row.booking_site_url,
    instagramUrl: row.instagram_url,
    xUrl: row.x_url,
    facebookUrl: row.facebook_url,
    otherSnsUrls: row.other_sns_urls,
    googleRating: row.google_rating,
    googleReviewCount: row.google_review_count,
    googleCategories: row.google_categories,
    googleLastFetchedAt: row.google_last_fetched_at,
    storeStatus: row.store_status,
    isSalesTarget: row.is_sales_target,
    officialWebsiteStatus: row.official_website_status,
    infoVerificationStatus: row.info_verification_status,
    memo: row.memo,
    verificationState: row.verification_state ?? {},
    createdHpUrl: row.created_hp_url,
    salesContacted: row.sales_contacted,
    registrationRegion: row.registration_region,
    registrationSearchRadiusMeters: row.registration_search_radius_meters,
  };
}

export function storeInsertToRow(input: StoreInsert): StoreInsertRow {
  return {
    place_id: input.placeId,
    name: input.name,
    industry: input.industry,
    category: input.category,
    description: input.description,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    phone_number: input.phoneNumber,
    business_hours: input.businessHours,
    closed_days: input.closedDays,
    price_range: input.priceRange,
    nearest_station: input.nearestStation,
    parking_info: input.parkingInfo,
    payment_methods: input.paymentMethods,
    accessibility_info: input.accessibilityInfo,
    google_maps_url: input.googleMapsUrl,
    official_website_url: input.officialWebsiteUrl,
    booking_site_url: input.bookingSiteUrl,
    instagram_url: input.instagramUrl,
    x_url: input.xUrl,
    facebook_url: input.facebookUrl,
    other_sns_urls: input.otherSnsUrls,
    google_rating: input.googleRating,
    google_review_count: input.googleReviewCount,
    google_categories: input.googleCategories,
    google_last_fetched_at: input.googleLastFetchedAt,
    store_status: input.storeStatus,
    is_sales_target: input.isSalesTarget,
    official_website_status: input.officialWebsiteStatus,
    info_verification_status: input.infoVerificationStatus,
    memo: input.memo,
    verification_state: input.verificationState,
    created_hp_url: input.createdHpUrl,
    sales_contacted: input.salesContacted,
    registration_region: input.registrationRegion,
    registration_search_radius_meters: input.registrationSearchRadiusMeters,
  };
}

export function storeUpdateToRow(input: StoreUpdate): StoreUpdateRow {
  const row = storeInsertToRow({ name: input.name ?? "", ...input }) as StoreUpdateRow;
  if (input.name === undefined) delete row.name;
  return row;
}

export function rowToStoreService(row: StoreServiceRow): StoreService {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    description: row.description,
    price: row.price,
    priceNote: row.price_note,
    duration: row.duration,
    targetAudience: row.target_audience,
    features: row.features,
    displayOrder: row.display_order,
    isPublished: row.is_published,
    verificationStatus: row.verification_status,
    remarks: row.remarks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function storeServiceInsertToRow(storeId: string, input: StoreServiceInsert): StoreServiceInsertRow {
  return {
    store_id: storeId,
    name: input.name,
    description: input.description,
    price: input.price,
    price_note: input.priceNote,
    duration: input.duration,
    target_audience: input.targetAudience,
    features: input.features,
    display_order: input.displayOrder,
    is_published: input.isPublished,
    verification_status: input.verificationStatus,
    remarks: input.remarks,
  };
}

export function storeServiceUpdateToRow(input: StoreServiceUpdate): StoreServiceUpdateRow {
  return {
    name: input.name,
    description: input.description,
    price: input.price,
    price_note: input.priceNote,
    duration: input.duration,
    target_audience: input.targetAudience,
    features: input.features,
    display_order: input.displayOrder,
    is_published: input.isPublished,
    verification_status: input.verificationStatus,
    remarks: input.remarks,
  };
}

export function rowToStoreReview(row: StoreReviewRow): StoreReview {
  return {
    id: row.id,
    storeId: row.store_id,
    authorName: row.author_name,
    rating: row.rating,
    reviewText: row.review_text,
    postedAt: row.posted_at,
    source: row.source,
    googleReviewId: row.google_review_id,
    fetchedAt: row.fetched_at,
  };
}

export function rowToStoreStrengths(row: StoreStrengthsRow): StoreStrengths {
  return {
    storeId: row.store_id,
    goodPoints: row.good_points,
    atmosphere: row.atmosphere,
    serviceQuality: row.service_quality,
    accessNotes: row.access_notes,
    targetCustomer: row.target_customer,
    differentiators: row.differentiators,
    potentialConcerns: row.potential_concerns,
    hpKeyMessages: row.hp_key_messages,
    recommendedCta: row.recommended_cta,
    cautions: row.cautions,
    improvementCandidates: row.improvement_candidates,
    aiGenerated: row.ai_generated,
    aiDisclaimerShown: row.ai_disclaimer_shown,
    updatedAt: row.updated_at,
  };
}

export function storeStrengthsUpdateToRow(storeId: string, input: StoreStrengthsUpdate): StoreStrengthsUpsertRow {
  return {
    store_id: storeId,
    good_points: input.goodPoints,
    atmosphere: input.atmosphere,
    service_quality: input.serviceQuality,
    access_notes: input.accessNotes,
    target_customer: input.targetCustomer,
    differentiators: input.differentiators,
    potential_concerns: input.potentialConcerns,
    hp_key_messages: input.hpKeyMessages,
    recommended_cta: input.recommendedCta,
    cautions: input.cautions,
    improvement_candidates: input.improvementCandidates,
    ai_generated: input.aiGenerated,
    ai_disclaimer_shown: input.aiDisclaimerShown,
  };
}

export function rowToStoreNote(row: StoreNoteRow): StoreNote {
  return {
    id: row.id,
    storeId: row.store_id,
    title: row.title,
    body: row.body,
    noteType: row.note_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function storeNoteInsertToRow(storeId: string, input: StoreNoteInsert): StoreNoteInsertRow {
  return {
    store_id: storeId,
    title: input.title,
    body: input.body,
    note_type: input.noteType,
  };
}

export function storeNoteUpdateToRow(input: StoreNoteUpdate): StoreNoteUpdateRow {
  return {
    title: input.title,
    body: input.body,
    note_type: input.noteType,
  };
}

export function rowToSearchHistory(row: SearchHistoryRow): SearchHistory {
  return {
    id: row.id,
    searchType: row.search_type as SearchHistory["searchType"],
    region: row.region,
    industry: row.industry,
    params: row.params,
    resultCount: row.result_count,
    createdAt: row.created_at,
  };
}
