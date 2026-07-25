import { z } from "zod";
import { IMAGE_USAGE_TYPES } from "@/types/image";
import type { ImageUsageType } from "@/types/image";

export const ALLOWED_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const STORE_IMAGES_BUCKET = "store-images";

const imageTypeEnum = z.enum([
  "main_candidate",
  "exterior",
  "interior",
  "staff",
  "product",
  "service",
  "menu",
  "facility",
  "access",
  "logo",
  "other",
]);

const permissionStatusEnum = z.enum([
  "unconfirmed",
  "sales_proposal_only",
  "store_permitted",
  "store_provided",
  "self_prepared",
  "free_material",
  "ai_generated",
  "public_ready",
  "not_allowed",
]);

const usageTypeEnum = z.enum(IMAGE_USAGE_TYPES as [ImageUsageType, ...ImageUsageType[]]);

export const requestUploadUrlSchema = z.object({
  fileName: z.string().trim().min(1, "ファイル名を指定してください"),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES, {
    message: "対応していないファイル形式です（JPEG・PNG・WebPのみ対応しています）",
  }),
  fileSize: z
    .number()
    .int()
    .min(1, "ファイルが空です")
    .max(MAX_UPLOAD_FILE_SIZE_BYTES, `ファイルサイズは${MAX_UPLOAD_FILE_SIZE_BYTES / 1024 / 1024}MB以下にしてください`),
});

export const finalizeUploadSchema = z.object({
  sourceType: z.literal("user_upload"),
  storagePath: z.string().trim().min(1),
  name: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  fileSize: z.number().int().nullable().optional(),
  mimeType: z.string().nullable().optional(),
});

export const registerExternalUrlSchema = z.object({
  sourceType: z.literal("external_url"),
  externalUrl: z.string().trim().url("URLの形式が正しくありません"),
  name: z.string().nullable().optional(),
});

export const registerSnsImageSchema = z.object({
  sourceType: z.literal("sns_reference"),
  snsPostUrl: z.string().trim().url("URLの形式が正しくありません"),
  name: z.string().nullable().optional(),
});

export const registerStoreImageSchema = z.discriminatedUnion("sourceType", [
  finalizeUploadSchema,
  registerExternalUrlSchema,
  registerSnsImageSchema,
]);

export const updateStoreImageSchema = z.object({
  name: z.string().nullable().optional(),
  imageType: imageTypeEnum.optional(),
  isSelected: z.boolean().optional(),
  usageTypes: z.array(usageTypeEnum).optional(),
  permissionStatus: permissionStatusEnum.optional(),
  displayOrder: z.number().int().optional(),
  memo: z.string().nullable().optional(),
});

export const bulkUpdateStoreImagesSchema = z.object({
  imageIds: z.array(z.string()).min(1, "画像を選択してください"),
  patch: z.object({
    isSelected: z.boolean().optional(),
    permissionStatus: permissionStatusEnum.optional(),
    addUsageType: usageTypeEnum.optional(),
  }),
});

export const checkExternalUrlSchema = z.object({
  url: z.string().trim().url("URLの形式が正しくありません"),
});

export const socialImageReferenceSchema = z.object({
  snsType: z.string().trim().min(1).optional(),
  postUrl: z.string().trim().url("URLの形式が正しくありません").optional(),
  description: z.string().nullable().optional(),
  plannedUse: z.boolean().optional(),
  confirmationStatus: z.string().trim().min(1).optional(),
  memo: z.string().nullable().optional(),
});

export const socialImageReferenceCreateSchema = socialImageReferenceSchema.extend({
  snsType: z.string().trim().min(1, "SNS種別を選択してください"),
  postUrl: z.string().trim().url("URLの形式が正しくありません"),
});

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first ? first.message : "入力内容が正しくありません。";
}
