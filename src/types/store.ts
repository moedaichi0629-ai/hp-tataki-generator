// 第1段階: 店舗情報収集・管理システムのドメイン型定義
// Supabaseの各テーブル（supabase/migrations/0001_init.sql）に対応する

export type OfficialWebsiteStatus =
  | "unconfirmed"
  | "none"
  | "exists"
  | "booking_site_only"
  | "sns_only"
  | "needs_check";

export type StoreStatus =
  | "candidate"
  | "info_checking"
  | "requirements_input"
  | "prompt_not_created"
  | "prompt_created"
  | "hp_in_progress"
  | "sample_done"
  | "sales_planned"
  | "sales_done"
  | "replied"
  | "negotiating"
  | "closed_won"
  | "skipped"
  | "not_target";

export type FieldVerificationStatus =
  | "unconfirmed"
  | "confirmed"
  | "needs_fix"
  | "do_not_publish";

export type NoteType = "research" | "hp_production" | "sales" | "check_item" | "other";

// 基本情報のうち項目別に確認状態を持たせるフィールド名
export const VERIFIABLE_STORE_FIELDS = [
  "name",
  "industry",
  "category",
  "description",
  "address",
  "phoneNumber",
  "businessHours",
  "closedDays",
  "priceRange",
  "nearestStation",
  "parkingInfo",
  "paymentMethods",
  "accessibilityInfo",
] as const;

export type VerifiableStoreField = (typeof VERIFIABLE_STORE_FIELDS)[number];

export type VerificationState = Partial<Record<VerifiableStoreField, FieldVerificationStatus>>;

export interface Store {
  id: string;
  placeId: string | null;
  createdAt: string;
  updatedAt: string;

  name: string;
  industry: string | null;
  category: string | null;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phoneNumber: string | null;
  businessHours: string[] | null;
  closedDays: string | null;
  priceRange: string | null;
  nearestStation: string | null;
  parkingInfo: string | null;
  paymentMethods: string[] | null;
  accessibilityInfo: string | null;

  googleMapsUrl: string | null;
  officialWebsiteUrl: string | null;
  bookingSiteUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  facebookUrl: string | null;
  otherSnsUrls: string[] | null;

  googleRating: number | null;
  googleReviewCount: number | null;
  googleCategories: string[] | null;
  googleLastFetchedAt: string | null;

  storeStatus: StoreStatus;
  isSalesTarget: boolean;
  officialWebsiteStatus: OfficialWebsiteStatus;
  infoVerificationStatus: FieldVerificationStatus;
  memo: string | null;
  verificationState: VerificationState;
}

export type StoreInsert = Partial<Omit<Store, "id" | "createdAt" | "updatedAt" | "name">> & {
  name: string;
};

export type StoreUpdate = Partial<Omit<Store, "id" | "createdAt" | "updatedAt">>;

export interface StoreService {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: string | null;
  priceNote: string | null;
  duration: string | null;
  targetAudience: string | null;
  features: string | null;
  displayOrder: number;
  isPublished: boolean;
  verificationStatus: FieldVerificationStatus;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StoreServiceInsert = Partial<
  Omit<StoreService, "id" | "storeId" | "createdAt" | "updatedAt" | "name">
> & {
  name: string;
};

export type StoreServiceUpdate = Partial<Omit<StoreService, "id" | "storeId" | "createdAt" | "updatedAt">>;

export interface StoreReview {
  id: string;
  storeId: string;
  authorName: string | null;
  rating: number | null;
  reviewText: string | null;
  postedAt: string | null;
  source: string;
  googleReviewId: string | null;
  fetchedAt: string;
}

export interface StoreStrengths {
  storeId: string;
  goodPoints: string | null;
  atmosphere: string | null;
  serviceQuality: string | null;
  accessNotes: string | null;
  targetCustomer: string | null;
  differentiators: string | null;
  potentialConcerns: string | null;
  hpKeyMessages: string | null;
  recommendedCta: string | null;
  cautions: string | null;
  improvementCandidates: string | null;
  aiGenerated: boolean;
  aiDisclaimerShown: boolean;
  updatedAt: string;
}

export type StoreStrengthsUpdate = Partial<Omit<StoreStrengths, "storeId" | "updatedAt">>;

export interface StoreNote {
  id: string;
  storeId: string;
  title: string | null;
  body: string;
  noteType: NoteType;
  createdAt: string;
  updatedAt: string;
}

export type StoreNoteInsert = Partial<Omit<StoreNote, "id" | "storeId" | "createdAt" | "updatedAt" | "body">> & {
  body: string;
};

export type StoreNoteUpdate = Partial<Omit<StoreNote, "id" | "storeId" | "createdAt" | "updatedAt">>;

export type SearchType = "region_industry" | "map_url" | "name_address";

export interface SearchHistory {
  id: string;
  searchType: SearchType;
  region: string | null;
  industry: string | null;
  params: Record<string, unknown>;
  resultCount: number;
  createdAt: string;
}

// Google Places APIから取得した検索結果（登録前の候補）
export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  phoneNumber: string | null;
  openingHours: string[] | null;
  rating: number | null;
  reviewCount: number | null;
  mapUrl: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  businessStatus: string | null;
  priceLevel: number | null;
  categories: string[] | null;
  openNow: boolean | null;
  isRegistered?: boolean;
}
