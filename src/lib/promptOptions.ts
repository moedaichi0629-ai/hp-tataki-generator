import type {
  DeliveryFormat,
  DeploymentMethod,
  PrimaryAction,
  PromptAiTool,
  PromptType,
  SectionType,
  SupportedDevice,
  TechnologyChoice,
  UpdateFriendliness,
  WebsitePurpose,
  WebsiteType,
} from "@/types/prompt";

function toLabelMap<T extends string>(options: { value: T; label: string }[]): Record<T, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<T, string>;
}

export const WEBSITE_PURPOSE_OPTIONS: { value: WebsitePurpose; label: string }[] = [
  { value: "awareness", label: "店舗の認知向上" },
  { value: "new_customers", label: "新規顧客獲得" },
  { value: "reservations", label: "予約増加" },
  { value: "inquiries", label: "問い合わせ増加" },
  { value: "service_intro", label: "サービス紹介" },
  { value: "pricing_info", label: "料金案内" },
  { value: "access_info", label: "アクセス案内" },
  { value: "recruiting", label: "採用" },
  { value: "sales_sample", label: "営業提案用サンプル" },
  { value: "existing_site_replacement", label: "既存サイトの代替" },
  { value: "other", label: "その他" },
];
export const WEBSITE_PURPOSE_LABELS = toLabelMap(WEBSITE_PURPOSE_OPTIONS);

export const WEBSITE_TYPE_OPTIONS: { value: WebsiteType; label: string }[] = [
  { value: "single_page", label: "1ページの店舗サイト" },
  { value: "multi_page", label: "複数ページの店舗サイト" },
  { value: "landing_page", label: "ランディングページ" },
  { value: "sales_sample", label: "営業提案用サンプル" },
  { value: "official_site", label: "正式公開用サイト" },
  { value: "reservation_focused", label: "予約誘導用サイト" },
  { value: "inquiry_focused", label: "問い合わせ獲得用サイト" },
  { value: "recruiting_site", label: "採用サイト" },
  { value: "other", label: "その他" },
];
export const WEBSITE_TYPE_LABELS = toLabelMap(WEBSITE_TYPE_OPTIONS);

export const PRIMARY_ACTION_OPTIONS: { value: PrimaryAction; label: string }[] = [
  { value: "call", label: "電話" },
  { value: "reservation", label: "予約" },
  { value: "inquiry", label: "問い合わせ" },
  { value: "line_registration", label: "LINE登録" },
  { value: "instagram_view", label: "Instagram閲覧" },
  { value: "visit", label: "来店" },
  { value: "document_request", label: "資料請求" },
  { value: "job_application", label: "採用応募" },
  { value: "other", label: "その他" },
];
export const PRIMARY_ACTION_LABELS = toLabelMap(PRIMARY_ACTION_OPTIONS);

export const TECHNOLOGY_OPTIONS: { value: TechnologyChoice; label: string }[] = [
  { value: "ai_choice", label: "AIに任せる" },
  { value: "html_css_js", label: "HTML・CSS・JavaScript" },
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "wordpress", label: "WordPress" },
  { value: "other", label: "その他" },
];
export const TECHNOLOGY_LABELS = toLabelMap(TECHNOLOGY_OPTIONS);

export const DEPLOYMENT_METHOD_OPTIONS: { value: DeploymentMethod; label: string }[] = [
  { value: "vercel", label: "Vercel" },
  { value: "netlify", label: "Netlify" },
  { value: "github_pages", label: "GitHub Pages" },
  { value: "wordpress", label: "WordPress" },
  { value: "rental_server", label: "レンタルサーバー" },
  { value: "undecided", label: "未定" },
  { value: "other", label: "その他" },
];
export const DEPLOYMENT_METHOD_LABELS = toLabelMap(DEPLOYMENT_METHOD_OPTIONS);

export const SUPPORTED_DEVICE_OPTIONS: { value: SupportedDevice; label: string }[] = [
  { value: "smartphone", label: "スマートフォン" },
  { value: "tablet", label: "タブレット" },
  { value: "pc", label: "PC" },
];
export const SUPPORTED_DEVICE_LABELS = toLabelMap(SUPPORTED_DEVICE_OPTIONS);

export const DELIVERY_FORMAT_OPTIONS: { value: DeliveryFormat; label: string }[] = [
  { value: "published_url", label: "公開URL" },
  { value: "github_repo", label: "GitHubリポジトリ" },
  { value: "zip_file", label: "ZIPファイル" },
  { value: "html_files", label: "HTMLファイル一式" },
  { value: "wordpress", label: "WordPress" },
  { value: "undecided", label: "未定" },
  { value: "other", label: "その他" },
];
export const DELIVERY_FORMAT_LABELS = toLabelMap(DELIVERY_FORMAT_OPTIONS);

export const UPDATE_FRIENDLINESS_OPTIONS: { value: UpdateFriendliness; label: string }[] = [
  { value: "self_update", label: "自分たちで更新したい" },
  { value: "ai_tool_update", label: "AIツールに依頼して更新したい" },
  { value: "no_preference", label: "こだわらない" },
];
export const UPDATE_FRIENDLINESS_LABELS = toLabelMap(UPDATE_FRIENDLINESS_OPTIONS);

export const SECTION_TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: "first_view", label: "ファーストビュー" },
  { value: "store_introduction", label: "店舗紹介" },
  { value: "features", label: "特徴・強み" },
  { value: "service", label: "サービス" },
  { value: "menu", label: "メニュー" },
  { value: "pricing", label: "料金" },
  { value: "staff_introduction", label: "スタッフ紹介" },
  { value: "customer_voices", label: "お客様の声" },
  { value: "review_highlights", label: "口コミから分かる特徴" },
  { value: "gallery", label: "ギャラリー" },
  { value: "faq", label: "よくある質問" },
  { value: "store_info", label: "店舗情報" },
  { value: "business_hours", label: "営業時間" },
  { value: "access", label: "アクセス" },
  { value: "google_map", label: "Googleマップ" },
  { value: "reservation", label: "予約方法" },
  { value: "contact", label: "お問い合わせ" },
  { value: "sns_links", label: "SNSリンク" },
  { value: "recruiting_info", label: "採用情報" },
  { value: "footer", label: "フッター" },
  { value: "privacy_policy", label: "プライバシーポリシー" },
  { value: "other", label: "その他" },
];
export const SECTION_TYPE_LABELS = toLabelMap(SECTION_TYPE_OPTIONS);

// 業種を問わず妥当な初期おすすめセクション（ユーザーが自由に追加・削除・変更できる前提の初期値）
export const RECOMMENDED_SECTION_TYPES: SectionType[] = [
  "first_view",
  "store_introduction",
  "features",
  "service",
  "business_hours",
  "access",
  "contact",
];

export const PROMPT_AI_TOOL_OPTIONS: { value: PromptAiTool; label: string }[] = [
  { value: "raddyai", label: "RaddyAI" },
  { value: "claude_code", label: "Claude Code" },
  { value: "cursor", label: "Cursor" },
  { value: "lovable", label: "Lovable" },
  { value: "bolt", label: "Bolt" },
  { value: "replit", label: "Replit" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "gemini", label: "Gemini" },
  { value: "other", label: "その他" },
];
export const PROMPT_AI_TOOL_LABELS = toLabelMap(PROMPT_AI_TOOL_OPTIONS);

export const PROMPT_TYPE_OPTIONS: { value: PromptType; label: string }[] = [
  { value: "hp_initial_creation", label: "HP初回作成" },
  { value: "hp_revision", label: "既存HP修正" },
  { value: "store_info_update", label: "店舗情報修正" },
  { value: "image_replacement", label: "画像差し替え" },
  { value: "section_add", label: "セクション追加" },
  { value: "section_remove", label: "セクション削除" },
  { value: "layout_fix", label: "表示崩れ修正" },
  { value: "mobile_fix", label: "スマホ対応修正" },
  { value: "seo_improvement", label: "SEO改善" },
  { value: "deploy", label: "公開・デプロイ" },
  { value: "other", label: "その他" },
];
export const PROMPT_TYPE_LABELS = toLabelMap(PROMPT_TYPE_OPTIONS);
