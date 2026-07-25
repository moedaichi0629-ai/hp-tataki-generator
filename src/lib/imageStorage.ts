import "server-only";
import { STORE_IMAGES_BUCKET } from "@/lib/imageValidation";

const SAFE_FILENAME_REGEX = /[^a-zA-Z0-9._-]/g;

// アップロードファイル名を安全な文字だけに正規化する
export function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim().slice(-120);
  const sanitized = trimmed.replace(SAFE_FILENAME_REGEX, "_");
  return sanitized || "image";
}

export function buildStorageObjectPath(storeId: string, fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  const unique = crypto.randomUUID();
  return `stores/${storeId}/${unique}-${safeName}`;
}

// getPublicUrl()で組み立てた公開URLから、Storage上のオブジェクトパスを逆算する（削除時に使用）
export function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORE_IMAGES_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}
