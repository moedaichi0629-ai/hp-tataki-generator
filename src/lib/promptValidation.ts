import { z } from "zod";

const websitePurposeEnum = z.enum([
  "awareness",
  "new_customers",
  "reservations",
  "inquiries",
  "service_intro",
  "pricing_info",
  "access_info",
  "recruiting",
  "sales_sample",
  "existing_site_replacement",
  "other",
]);

const websiteTypeEnum = z.enum([
  "single_page",
  "multi_page",
  "landing_page",
  "sales_sample",
  "official_site",
  "reservation_focused",
  "inquiry_focused",
  "recruiting_site",
  "other",
]);

const primaryActionEnum = z.enum([
  "call",
  "reservation",
  "inquiry",
  "line_registration",
  "instagram_view",
  "visit",
  "document_request",
  "job_application",
  "other",
]);

const technologyEnum = z.enum(["ai_choice", "html_css_js", "react", "nextjs", "wordpress", "other"]);
const deploymentMethodEnum = z.enum([
  "vercel",
  "netlify",
  "github_pages",
  "wordpress",
  "rental_server",
  "undecided",
  "other",
]);
const supportedDeviceEnum = z.enum(["smartphone", "tablet", "pc"]);
const deliveryFormatEnum = z.enum([
  "published_url",
  "github_repo",
  "zip_file",
  "html_files",
  "wordpress",
  "undecided",
  "other",
]);
const updateFriendlinessEnum = z.enum(["self_update", "ai_tool_update", "no_preference"]);

export const websiteRequirementsUpdateSchema = z.object({
  purposes: z.array(websitePurposeEnum).optional(),
  websiteType: websiteTypeEnum.nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  mainMessage: z.string().nullable().optional(),
  keyStrengthsNote: z.string().nullable().optional(),
  primaryAction: primaryActionEnum.nullable().optional(),
  contactMethod: z.string().nullable().optional(),
  reservationMethod: z.string().nullable().optional(),
  excludedInformation: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  supplementaryInstructions: z.string().nullable().optional(),
  technology: technologyEnum.nullable().optional(),
  technologyOther: z.string().nullable().optional(),
  deploymentMethod: deploymentMethodEnum.nullable().optional(),
  deploymentMethodOther: z.string().nullable().optional(),
  supportedDevices: z.array(supportedDeviceEnum).optional(),
  seoEnabled: z.boolean().optional(),
  accessibilityEnabled: z.boolean().optional(),
  mapEnabled: z.boolean().optional(),
  snsEnabled: z.boolean().optional(),
  formEnabled: z.boolean().optional(),
  animationEnabled: z.boolean().optional(),
  updateFriendliness: updateFriendlinessEnum.nullable().optional(),
  externalIntegrations: z.string().nullable().optional(),
  deliveryFormat: deliveryFormatEnum.nullable().optional(),
  deliveryFormatOther: z.string().nullable().optional(),
});

const sectionTypeEnum = z.enum([
  "first_view",
  "store_introduction",
  "features",
  "service",
  "menu",
  "pricing",
  "staff_introduction",
  "customer_voices",
  "review_highlights",
  "gallery",
  "faq",
  "store_info",
  "business_hours",
  "access",
  "google_map",
  "reservation",
  "contact",
  "sns_links",
  "recruiting_info",
  "footer",
  "privacy_policy",
  "other",
]);

export const websiteSectionCreateSchema = z.object({
  sectionType: sectionTypeEnum,
  heading: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  imageIds: z.array(z.string()).optional(),
  cta: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
});

export const websiteSectionUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  heading: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  imageIds: z.array(z.string()).optional(),
  cta: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
});

const promptAiToolEnum = z.enum([
  "raddyai",
  "claude_code",
  "cursor",
  "lovable",
  "bolt",
  "replit",
  "chatgpt",
  "gemini",
  "other",
]);

const promptTypeEnum = z.enum([
  "hp_initial_creation",
  "hp_revision",
  "store_info_update",
  "image_replacement",
  "section_add",
  "section_remove",
  "layout_fix",
  "mobile_fix",
  "seo_improvement",
  "deploy",
  "other",
]);

export const generatePromptSchema = z.object({
  aiTool: promptAiToolEnum,
  customAiTool: z.string().trim().max(50).nullable().optional(),
  promptType: promptTypeEnum.optional().default("hp_initial_creation"),
  usePolish: z.boolean().optional().default(false),
});

const MAX_PROMPT_CONTENT_LENGTH = 20000;

export const updatePromptSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  aiTool: promptAiToolEnum.optional(),
  customAiTool: z.string().trim().max(50).nullable().optional(),
  content: z.string().trim().min(1).max(MAX_PROMPT_CONTENT_LENGTH).optional(),
  isUsed: z.boolean().optional(),
  memo: z.string().max(2000).nullable().optional(),
});

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first ? first.message : "入力内容が正しくありません。";
}
