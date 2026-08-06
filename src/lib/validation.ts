import { z } from "zod";

// 日本の電話番号（ハイフンあり/なし、市外局番括弧なし）を緩めに許容
const PHONE_REGEX = /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/;

export const phoneNumberSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || PHONE_REGEX.test(v), "電話番号の形式が正しくありません（例: 03-1234-5678）")
  .nullable()
  .optional();

export const urlSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "URLの形式が正しくありません（http(s)://から始まる必要があります）")
  .nullable()
  .optional();

export const latSchema = z.number().min(-90).max(90).nullable().optional();
export const lngSchema = z.number().min(-180).max(180).nullable().optional();
export const ratingSchema = z.number().min(0).max(5).nullable().optional();
export const reviewCountSchema = z.number().int().min(0).nullable().optional();

const officialWebsiteStatusEnum = z.enum([
  "unconfirmed",
  "none",
  "exists",
  "booking_site_only",
  "sns_only",
  "needs_check",
]);

const storeStatusEnum = z.enum([
  "candidate",
  "info_checking",
  "requirements_input",
  "prompt_not_created",
  "prompt_created",
  "hp_in_progress",
  "sample_done",
  "sales_planned",
  "sales_done",
  "replied",
  "negotiating",
  "closed_won",
  "skipped",
  "not_target",
]);

const fieldVerificationStatusEnum = z.enum(["unconfirmed", "confirmed", "needs_fix", "do_not_publish"]);

const noteTypeEnum = z.enum(["research", "hp_production", "sales", "check_item", "other"]);

export const storeUpdateSchema = z.object({
  name: z.string().trim().min(1, "店舗名は必須です").optional(),
  industry: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  lat: latSchema,
  lng: lngSchema,
  phoneNumber: phoneNumberSchema,
  businessHours: z.array(z.string()).nullable().optional(),
  closedDays: z.string().nullable().optional(),
  priceRange: z.string().nullable().optional(),
  nearestStation: z.string().nullable().optional(),
  parkingInfo: z.string().nullable().optional(),
  paymentMethods: z.array(z.string()).nullable().optional(),
  accessibilityInfo: z.string().nullable().optional(),
  googleMapsUrl: urlSchema,
  officialWebsiteUrl: urlSchema,
  bookingSiteUrl: urlSchema,
  instagramUrl: urlSchema,
  xUrl: urlSchema,
  facebookUrl: urlSchema,
  otherSnsUrls: z.array(z.string()).nullable().optional(),
  googleRating: ratingSchema,
  googleReviewCount: reviewCountSchema,
  googleCategories: z.array(z.string()).nullable().optional(),
  storeStatus: storeStatusEnum.optional(),
  isSalesTarget: z.boolean().optional(),
  officialWebsiteStatus: officialWebsiteStatusEnum.optional(),
  infoVerificationStatus: fieldVerificationStatusEnum.optional(),
  memo: z.string().nullable().optional(),
  verificationState: z.record(z.string(), fieldVerificationStatusEnum).optional(),
  createdHpUrl: urlSchema,
  salesContacted: z.boolean().optional(),
  registrationRegion: z.string().nullable().optional(),
  registrationSearchRadiusMeters: z.number().int().min(0).nullable().optional(),
});

export const storeCreateSchema = storeUpdateSchema.extend({
  name: z.string().trim().min(1, "店舗名は必須です"),
  placeId: z.string().nullable().optional(),
});

export const storeServiceSchema = z.object({
  name: z.string().trim().min(1, "サービス名は必須です").optional(),
  description: z.string().nullable().optional(),
  price: z.string().nullable().optional(),
  priceNote: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  verificationStatus: fieldVerificationStatusEnum.optional(),
  remarks: z.string().nullable().optional(),
});

export const storeServiceCreateSchema = storeServiceSchema.extend({
  name: z.string().trim().min(1, "サービス名は必須です"),
});

export const storeStrengthsSchema = z.object({
  goodPoints: z.string().nullable().optional(),
  atmosphere: z.string().nullable().optional(),
  serviceQuality: z.string().nullable().optional(),
  accessNotes: z.string().nullable().optional(),
  targetCustomer: z.string().nullable().optional(),
  differentiators: z.string().nullable().optional(),
  potentialConcerns: z.string().nullable().optional(),
  hpKeyMessages: z.string().nullable().optional(),
  recommendedCta: z.string().nullable().optional(),
  cautions: z.string().nullable().optional(),
  improvementCandidates: z.string().nullable().optional(),
  aiGenerated: z.boolean().optional(),
  aiDisclaimerShown: z.boolean().optional(),
});

export const storeNoteSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().trim().min(1, "本文は必須です").optional(),
  noteType: noteTypeEnum.optional(),
});

export const storeNoteCreateSchema = storeNoteSchema.extend({
  body: z.string().trim().min(1, "本文は必須です"),
});

export const searchByRegionIndustrySchema = z.object({
  region: z.string().trim().optional().default(""),
  industry: z.string().trim().optional().default(""),
  radiusMeters: z.number().min(0).max(50000).optional().default(0),
  maxResults: z.number().int().min(1).max(60).optional().default(20),
  minRating: z.number().min(0).max(5).optional(),
  minReviews: z.number().int().min(0).optional(),
  openNowOnly: z.boolean().optional().default(false),
  noWebsiteOnly: z.boolean().optional().default(false),
  excludeRegistered: z.boolean().optional().default(false),
});

export const searchByNameAddressSchema = z.object({
  name: z.string().trim().min(1, "店名を入力してください"),
  address: z.string().trim().optional().default(""),
});

export const searchByMapUrlSchema = z.object({
  url: z.string().trim().min(1, "GoogleマップのURLを入力してください"),
});

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first ? first.message : "入力内容が正しくありません。";
}
