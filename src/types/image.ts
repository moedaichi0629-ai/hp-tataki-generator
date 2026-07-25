// 第2段階: 画像管理システムのドメイン型定義
// Supabaseのテーブル（supabase/migrations/0002_store_images.sql）に対応する

export type ImageSourceType =
  | "google_maps"
  | "store_provided"
  | "user_upload"
  | "external_url"
  | "sns_reference"
  | "free_material"
  | "ai_generated"
  | "other";

export type StoreImageCategory =
  | "main_candidate"
  | "exterior"
  | "interior"
  | "staff"
  | "product"
  | "service"
  | "menu"
  | "facility"
  | "access"
  | "logo"
  | "other";

export type ImagePermissionStatus =
  | "unconfirmed"
  | "sales_proposal_only"
  | "store_permitted"
  | "store_provided"
  | "self_prepared"
  | "free_material"
  | "ai_generated"
  | "public_ready"
  | "not_allowed";

// HP内での使用予定箇所（1画像で複数選択可）
export type ImageUsageType =
  | "first_view"
  | "store_introduction"
  | "features"
  | "service"
  | "menu"
  | "staff_introduction"
  | "gallery"
  | "access"
  | "background"
  | "logo"
  | "not_used";

export const IMAGE_USAGE_TYPES: ImageUsageType[] = [
  "first_view",
  "store_introduction",
  "features",
  "service",
  "menu",
  "staff_introduction",
  "gallery",
  "access",
  "background",
  "logo",
  "not_used",
];

export interface StoreImage {
  id: string;
  storeId: string;
  name: string | null;
  imageType: StoreImageCategory;
  sourceType: ImageSourceType;
  googlePhotoResourceName: string | null;
  storageUrl: string | null;
  externalUrl: string | null;
  snsPostUrl: string | null;
  authorName: string | null;
  googleMapsUri: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  mimeType: string | null;
  isSelected: boolean;
  usageTypes: ImageUsageType[];
  permissionStatus: ImagePermissionStatus;
  displayOrder: number;
  memo: string | null;
  fetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StoreImageInsert = Partial<Omit<StoreImage, "id" | "storeId" | "createdAt" | "updatedAt">> & {
  sourceType: ImageSourceType;
};

export type StoreImageUpdate = Partial<Omit<StoreImage, "id" | "storeId" | "createdAt" | "updatedAt">>;

export interface SocialImageReference {
  id: string;
  storeId: string;
  snsType: string;
  postUrl: string;
  description: string | null;
  plannedUse: boolean;
  confirmationStatus: string;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SocialImageReferenceInsert = Partial<
  Omit<SocialImageReference, "id" | "storeId" | "createdAt" | "updatedAt">
> & {
  snsType: string;
  postUrl: string;
};

export type SocialImageReferenceUpdate = Partial<
  Omit<SocialImageReference, "id" | "storeId" | "createdAt" | "updatedAt">
>;
