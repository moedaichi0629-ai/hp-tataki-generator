import type {
  ImagePermissionStatus,
  ImageSourceType,
  ImageUsageType,
  StoreImageCategory,
} from "@/types/image";

export const IMAGE_SOURCE_TYPE_OPTIONS: { value: ImageSourceType; label: string }[] = [
  { value: "google_maps", label: "Googleマップ" },
  { value: "store_provided", label: "店舗提供" },
  { value: "user_upload", label: "ユーザーアップロード" },
  { value: "external_url", label: "外部URL" },
  { value: "sns_reference", label: "SNS投稿メモ" },
  { value: "free_material", label: "フリー素材" },
  { value: "ai_generated", label: "AI生成" },
  { value: "other", label: "その他" },
];

export const IMAGE_SOURCE_TYPE_LABELS: Record<ImageSourceType, string> = Object.fromEntries(
  IMAGE_SOURCE_TYPE_OPTIONS.map((o) => [o.value, o.label])
) as Record<ImageSourceType, string>;

export const STORE_IMAGE_CATEGORY_OPTIONS: { value: StoreImageCategory; label: string }[] = [
  { value: "main_candidate", label: "メイン画像候補" },
  { value: "exterior", label: "店舗外観" },
  { value: "interior", label: "店舗内観" },
  { value: "staff", label: "スタッフ" },
  { value: "product", label: "商品" },
  { value: "service", label: "サービス" },
  { value: "menu", label: "メニュー" },
  { value: "facility", label: "設備" },
  { value: "access", label: "アクセス" },
  { value: "logo", label: "ロゴ" },
  { value: "other", label: "その他" },
];

export const STORE_IMAGE_CATEGORY_LABELS: Record<StoreImageCategory, string> = Object.fromEntries(
  STORE_IMAGE_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
) as Record<StoreImageCategory, string>;

export const IMAGE_PERMISSION_STATUS_OPTIONS: { value: ImagePermissionStatus; label: string }[] = [
  { value: "unconfirmed", label: "未確認" },
  { value: "sales_proposal_only", label: "営業提案用のみ" },
  { value: "store_permitted", label: "店舗から使用許可あり" },
  { value: "store_provided", label: "店舗提供画像" },
  { value: "self_prepared", label: "自分で用意した画像" },
  { value: "free_material", label: "フリー素材" },
  { value: "ai_generated", label: "AI生成画像" },
  { value: "public_ready", label: "正式公開使用可能" },
  { value: "not_allowed", label: "使用不可" },
];

export const IMAGE_PERMISSION_STATUS_LABELS: Record<ImagePermissionStatus, string> = Object.fromEntries(
  IMAGE_PERMISSION_STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<ImagePermissionStatus, string>;

// 第3段階のプロンプト生成で「正式公開用には使わない」対象として扱うステータス
export const NON_PUBLIC_PERMISSION_STATUSES: ImagePermissionStatus[] = [
  "unconfirmed",
  "sales_proposal_only",
  "not_allowed",
];

export const IMAGE_USAGE_TYPE_OPTIONS: { value: ImageUsageType; label: string }[] = [
  { value: "first_view", label: "ファーストビュー" },
  { value: "store_introduction", label: "店舗紹介" },
  { value: "features", label: "特徴・強み" },
  { value: "service", label: "サービス" },
  { value: "menu", label: "メニュー" },
  { value: "staff_introduction", label: "スタッフ紹介" },
  { value: "gallery", label: "ギャラリー" },
  { value: "access", label: "アクセス" },
  { value: "background", label: "背景" },
  { value: "logo", label: "ロゴ" },
  { value: "not_used", label: "使用しない" },
];

export const IMAGE_USAGE_TYPE_LABELS: Record<ImageUsageType, string> = Object.fromEntries(
  IMAGE_USAGE_TYPE_OPTIONS.map((o) => [o.value, o.label])
) as Record<ImageUsageType, string>;

export const SNS_TYPE_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "その他" },
];

export const SOCIAL_REFERENCE_CONFIRMATION_STATUS_OPTIONS = [
  { value: "unconfirmed", label: "未確認" },
  { value: "requested", label: "依頼済み" },
  { value: "received", label: "受領済み" },
  { value: "not_needed", label: "不要" },
];

// 画像の縦横比から用途候補を推測する（自動確定はしない。ユーザーが変更可能な初期値として提示するのみ）
export function suggestCategoryFromDimensions(
  width: number | null,
  height: number | null
): StoreImageCategory | null {
  if (!width || !height) return null;
  const ratio = width / height;
  if (ratio > 1.3) return "exterior"; // 横長: 外観・メイン候補系
  if (ratio < 0.77) return "staff"; // 縦長: スタッフ・商品候補
  return "other"; // 正方形に近い: ギャラリー候補
}
