// Supabase テーブルのDB上の行の形（snake_case）。
// supabase/migrations/0001_init.sql と対応させて手書きしている
// （Supabase CLIが未導入のため `supabase gen types` の代わりに手動管理）。

export type OfficialWebsiteStatusRow =
  | "unconfirmed"
  | "none"
  | "exists"
  | "booking_site_only"
  | "sns_only"
  | "needs_check";

export type StoreStatusRow =
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

export type FieldVerificationStatusRow = "unconfirmed" | "confirmed" | "needs_fix" | "do_not_publish";

export type NoteTypeRow = "research" | "hp_production" | "sales" | "check_item" | "other";

export interface StoreRow {
  id: string;
  place_id: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  industry: string | null;
  category: string | null;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone_number: string | null;
  business_hours: string[] | null;
  closed_days: string | null;
  price_range: string | null;
  nearest_station: string | null;
  parking_info: string | null;
  payment_methods: string[] | null;
  accessibility_info: string | null;
  google_maps_url: string | null;
  official_website_url: string | null;
  booking_site_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  facebook_url: string | null;
  other_sns_urls: string[] | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_categories: string[] | null;
  google_last_fetched_at: string | null;
  store_status: StoreStatusRow;
  is_sales_target: boolean;
  official_website_status: OfficialWebsiteStatusRow;
  info_verification_status: FieldVerificationStatusRow;
  memo: string | null;
  verification_state: Record<string, string>;
  created_hp_url: string | null;
  sales_contacted: boolean;
  registration_region: string | null;
  registration_search_radius_meters: number | null;
}

export type StoreInsertRow = Partial<Omit<StoreRow, "id" | "created_at" | "updated_at">> & {
  name: string;
};
export type StoreUpdateRow = Partial<Omit<StoreRow, "id" | "created_at" | "updated_at">>;

export interface StoreServiceRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: string | null;
  price_note: string | null;
  duration: string | null;
  target_audience: string | null;
  features: string | null;
  display_order: number;
  is_published: boolean;
  verification_status: FieldVerificationStatusRow;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export type StoreServiceInsertRow = Partial<Omit<StoreServiceRow, "id" | "created_at" | "updated_at">> & {
  store_id: string;
  name: string;
};
export type StoreServiceUpdateRow = Partial<
  Omit<StoreServiceRow, "id" | "store_id" | "created_at" | "updated_at">
>;

export interface StoreReviewRow {
  id: string;
  store_id: string;
  author_name: string | null;
  rating: number | null;
  review_text: string | null;
  posted_at: string | null;
  source: string;
  google_review_id: string | null;
  fetched_at: string;
}

export type StoreReviewInsertRow = Partial<Omit<StoreReviewRow, "id" | "fetched_at">> & {
  store_id: string;
};

export interface StoreStrengthsRow {
  store_id: string;
  good_points: string | null;
  atmosphere: string | null;
  service_quality: string | null;
  access_notes: string | null;
  target_customer: string | null;
  differentiators: string | null;
  potential_concerns: string | null;
  hp_key_messages: string | null;
  recommended_cta: string | null;
  cautions: string | null;
  improvement_candidates: string | null;
  ai_generated: boolean;
  ai_disclaimer_shown: boolean;
  updated_at: string;
}

export type StoreStrengthsUpsertRow = Partial<Omit<StoreStrengthsRow, "updated_at">> & {
  store_id: string;
};

export interface StoreNoteRow {
  id: string;
  store_id: string;
  title: string | null;
  body: string;
  note_type: NoteTypeRow;
  created_at: string;
  updated_at: string;
}

export type StoreNoteInsertRow = Partial<Omit<StoreNoteRow, "id" | "created_at" | "updated_at">> & {
  store_id: string;
  body: string;
};
export type StoreNoteUpdateRow = Partial<Omit<StoreNoteRow, "id" | "store_id" | "created_at" | "updated_at">>;

export interface SearchHistoryRow {
  id: string;
  search_type: string;
  region: string | null;
  industry: string | null;
  params: Record<string, unknown>;
  result_count: number;
  created_at: string;
}

export type SearchHistoryInsertRow = Partial<Omit<SearchHistoryRow, "id" | "created_at">> & {
  search_type: string;
};

// ---------------------------------------------------------------------------
// 第2段階: 画像管理
// ---------------------------------------------------------------------------

export type ImageSourceTypeRow =
  | "google_maps"
  | "store_provided"
  | "user_upload"
  | "external_url"
  | "sns_reference"
  | "free_material"
  | "ai_generated"
  | "other";

export type StoreImageCategoryRow =
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

export type ImagePermissionStatusRow =
  | "unconfirmed"
  | "sales_proposal_only"
  | "store_permitted"
  | "store_provided"
  | "self_prepared"
  | "free_material"
  | "ai_generated"
  | "public_ready"
  | "not_allowed";

export interface StoreImageRow {
  id: string;
  store_id: string;
  name: string | null;
  image_type: StoreImageCategoryRow;
  source_type: ImageSourceTypeRow;
  google_photo_resource_name: string | null;
  storage_url: string | null;
  external_url: string | null;
  sns_post_url: string | null;
  author_name: string | null;
  google_maps_uri: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string | null;
  is_selected: boolean;
  usage_types: string[];
  permission_status: ImagePermissionStatusRow;
  display_order: number;
  memo: string | null;
  fetched_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StoreImageInsertRow = Partial<Omit<StoreImageRow, "id" | "created_at" | "updated_at">> & {
  store_id: string;
  source_type: ImageSourceTypeRow;
};

export type StoreImageUpdateRow = Partial<Omit<StoreImageRow, "id" | "store_id" | "created_at" | "updated_at">>;

export interface SocialImageReferenceRow {
  id: string;
  store_id: string;
  sns_type: string;
  post_url: string;
  description: string | null;
  planned_use: boolean;
  confirmation_status: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type SocialImageReferenceInsertRow = Partial<
  Omit<SocialImageReferenceRow, "id" | "created_at" | "updated_at">
> & {
  store_id: string;
  sns_type: string;
  post_url: string;
};

export type SocialImageReferenceUpdateRow = Partial<
  Omit<SocialImageReferenceRow, "id" | "store_id" | "created_at" | "updated_at">
>;

// ---------------------------------------------------------------------------
// 第3段階: HP制作条件・HP作成用プロンプト生成
// ---------------------------------------------------------------------------

export interface WebsiteRequirementsRow {
  id: string;
  store_id: string;
  purposes: string[];
  website_type: string | null;
  target_audience: string | null;
  main_message: string | null;
  key_strengths_note: string | null;
  primary_action: string | null;
  contact_method: string | null;
  reservation_method: string | null;
  excluded_information: string | null;
  notes: string | null;
  supplementary_instructions: string | null;
  technology: string | null;
  technology_other: string | null;
  deployment_method: string | null;
  deployment_method_other: string | null;
  supported_devices: string[];
  seo_enabled: boolean;
  accessibility_enabled: boolean;
  map_enabled: boolean;
  sns_enabled: boolean;
  form_enabled: boolean;
  animation_enabled: boolean;
  update_friendliness: string | null;
  external_integrations: string | null;
  delivery_format: string | null;
  delivery_format_other: string | null;
  created_at: string;
  updated_at: string;
}

export type WebsiteRequirementsUpsertRow = Partial<Omit<WebsiteRequirementsRow, "id" | "created_at" | "updated_at">> & {
  store_id: string;
};

export interface WebsiteSectionRow {
  id: string;
  website_requirement_id: string;
  section_type: string;
  enabled: boolean;
  display_order: number;
  heading: string | null;
  content: string | null;
  image_ids: string[];
  cta: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export type WebsiteSectionInsertRow = Partial<Omit<WebsiteSectionRow, "id" | "created_at" | "updated_at">> & {
  website_requirement_id: string;
  section_type: string;
};

export type WebsiteSectionUpdateRow = Partial<
  Omit<WebsiteSectionRow, "id" | "website_requirement_id" | "section_type" | "created_at" | "updated_at">
>;

export interface PromptTemplateRow {
  id: string;
  ai_tool: string;
  prompt_type: string;
  version: number;
  template_body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeneratedPromptRow {
  id: string;
  store_id: string;
  website_requirement_id: string | null;
  title: string;
  prompt_type: string;
  ai_tool: string;
  custom_ai_tool: string | null;
  content: string;
  store_updated_at_snapshot: string | null;
  images_updated_at_snapshot: string | null;
  template_version: number | null;
  generation_method: string;
  is_used: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type GeneratedPromptInsertRow = Partial<Omit<GeneratedPromptRow, "id" | "created_at" | "updated_at">> & {
  store_id: string;
  title: string;
  prompt_type: string;
  ai_tool: string;
  content: string;
};

export type GeneratedPromptUpdateRow = Partial<
  Omit<GeneratedPromptRow, "id" | "store_id" | "created_at" | "updated_at">
>;
