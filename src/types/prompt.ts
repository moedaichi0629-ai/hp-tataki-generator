// 第3段階: HP制作条件・HP作成用プロンプト生成のドメイン型定義
// Supabaseのテーブル（supabase/migrations/0003_prompts.sql）に対応する

export type WebsitePurpose =
  | "awareness"
  | "new_customers"
  | "reservations"
  | "inquiries"
  | "service_intro"
  | "pricing_info"
  | "access_info"
  | "recruiting"
  | "sales_sample"
  | "existing_site_replacement"
  | "other";

export type WebsiteType =
  | "single_page"
  | "multi_page"
  | "landing_page"
  | "sales_sample"
  | "official_site"
  | "reservation_focused"
  | "inquiry_focused"
  | "recruiting_site"
  | "other";

export type PrimaryAction =
  | "call"
  | "reservation"
  | "inquiry"
  | "line_registration"
  | "instagram_view"
  | "visit"
  | "document_request"
  | "job_application"
  | "other";

export type TechnologyChoice = "ai_choice" | "html_css_js" | "react" | "nextjs" | "wordpress" | "other";

export type DeploymentMethod = "vercel" | "netlify" | "github_pages" | "wordpress" | "rental_server" | "undecided" | "other";

export type SupportedDevice = "smartphone" | "tablet" | "pc";

export type DeliveryFormat =
  | "published_url"
  | "github_repo"
  | "zip_file"
  | "html_files"
  | "wordpress"
  | "undecided"
  | "other";

export type UpdateFriendliness = "self_update" | "ai_tool_update" | "no_preference";

export interface WebsiteRequirements {
  id: string;
  storeId: string;

  purposes: WebsitePurpose[];
  websiteType: WebsiteType | null;
  targetAudience: string | null;
  mainMessage: string | null;
  keyStrengthsNote: string | null;
  primaryAction: PrimaryAction | null;
  contactMethod: string | null;
  reservationMethod: string | null;
  excludedInformation: string | null;
  notes: string | null;
  supplementaryInstructions: string | null;

  technology: TechnologyChoice | null;
  technologyOther: string | null;
  deploymentMethod: DeploymentMethod | null;
  deploymentMethodOther: string | null;
  supportedDevices: SupportedDevice[];
  seoEnabled: boolean;
  accessibilityEnabled: boolean;
  mapEnabled: boolean;
  snsEnabled: boolean;
  formEnabled: boolean;
  animationEnabled: boolean;
  updateFriendliness: UpdateFriendliness | null;
  externalIntegrations: string | null;
  deliveryFormat: DeliveryFormat | null;
  deliveryFormatOther: string | null;

  createdAt: string;
  updatedAt: string;
}

export type WebsiteRequirementsUpdate = Partial<Omit<WebsiteRequirements, "id" | "storeId" | "createdAt" | "updatedAt">>;

export type SectionType =
  | "first_view"
  | "store_introduction"
  | "features"
  | "service"
  | "menu"
  | "pricing"
  | "staff_introduction"
  | "customer_voices"
  | "review_highlights"
  | "gallery"
  | "faq"
  | "store_info"
  | "business_hours"
  | "access"
  | "google_map"
  | "reservation"
  | "contact"
  | "sns_links"
  | "recruiting_info"
  | "footer"
  | "privacy_policy"
  | "other";

export interface WebsiteSection {
  id: string;
  websiteRequirementId: string;
  sectionType: SectionType;
  enabled: boolean;
  displayOrder: number;
  heading: string | null;
  content: string | null;
  imageIds: string[];
  cta: string | null;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WebsiteSectionInsert = {
  sectionType: SectionType;
  heading?: string | null;
  content?: string | null;
  imageIds?: string[];
  cta?: string | null;
  instructions?: string | null;
  displayOrder?: number;
};

export type WebsiteSectionUpdate = Partial<
  Omit<WebsiteSection, "id" | "websiteRequirementId" | "sectionType" | "createdAt" | "updatedAt">
>;

