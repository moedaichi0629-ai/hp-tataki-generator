import type {
  FieldVerificationStatus,
  NoteType,
  OfficialWebsiteStatus,
  StoreStatus,
} from "@/types/store";

export const STORE_STATUS_OPTIONS: { value: StoreStatus; label: string }[] = [
  { value: "candidate", label: "候補" },
  { value: "info_checking", label: "情報確認中" },
  { value: "requirements_input", label: "制作条件入力中" },
  { value: "prompt_not_created", label: "プロンプト未作成" },
  { value: "prompt_created", label: "プロンプト作成済み" },
  { value: "hp_in_progress", label: "HP作成中" },
  { value: "sample_done", label: "サンプル完成" },
  { value: "sales_planned", label: "営業予定" },
  { value: "sales_done", label: "営業済み" },
  { value: "replied", label: "返信あり" },
  { value: "negotiating", label: "商談中" },
  { value: "closed_won", label: "成約" },
  { value: "skipped", label: "見送り" },
  { value: "not_target", label: "対象外" },
];

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = Object.fromEntries(
  STORE_STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<StoreStatus, string>;

export const OFFICIAL_WEBSITE_STATUS_OPTIONS: { value: OfficialWebsiteStatus; label: string }[] = [
  { value: "unconfirmed", label: "未確認" },
  { value: "none", label: "公式サイトなし" },
  { value: "exists", label: "公式サイトあり" },
  { value: "booking_site_only", label: "予約サイトのみ" },
  { value: "sns_only", label: "SNSのみ" },
  { value: "needs_check", label: "確認が必要" },
];

export const OFFICIAL_WEBSITE_STATUS_LABELS: Record<OfficialWebsiteStatus, string> = Object.fromEntries(
  OFFICIAL_WEBSITE_STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<OfficialWebsiteStatus, string>;

export const FIELD_VERIFICATION_STATUS_OPTIONS: { value: FieldVerificationStatus; label: string }[] = [
  { value: "unconfirmed", label: "未確認" },
  { value: "confirmed", label: "確認済み" },
  { value: "needs_fix", label: "要修正" },
  { value: "do_not_publish", label: "掲載しない" },
];

export const FIELD_VERIFICATION_STATUS_LABELS: Record<FieldVerificationStatus, string> = Object.fromEntries(
  FIELD_VERIFICATION_STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<FieldVerificationStatus, string>;

export const NOTE_TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: "research", label: "店舗調査" },
  { value: "hp_production", label: "HP制作" },
  { value: "sales", label: "営業" },
  { value: "check_item", label: "確認事項" },
  { value: "other", label: "その他" },
];

export const NOTE_TYPE_LABELS: Record<NoteType, string> = Object.fromEntries(
  NOTE_TYPE_OPTIONS.map((o) => [o.value, o.label])
) as Record<NoteType, string>;
