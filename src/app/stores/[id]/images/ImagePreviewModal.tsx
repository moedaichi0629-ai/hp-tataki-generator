"use client";

import { useState } from "react";
import common from "@/styles/common.module.css";
import styles from "./images.module.css";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  STORE_IMAGE_CATEGORY_OPTIONS,
  IMAGE_PERMISSION_STATUS_OPTIONS,
  IMAGE_USAGE_TYPE_OPTIONS,
  IMAGE_SOURCE_TYPE_LABELS,
} from "@/lib/imageStatus";
import type { ImagePermissionStatus, ImageUsageType, StoreImage, StoreImageCategory } from "@/types/image";

function resolveThumbSrc(storeId: string, image: StoreImage): string | null {
  if (image.sourceType === "google_maps" && image.googlePhotoResourceName) {
    return `/api/stores/${storeId}/images/google-photo?ref=${encodeURIComponent(image.googlePhotoResourceName)}&maxwidth=1200`;
  }
  if (image.sourceType === "user_upload" && image.storageUrl) return image.storageUrl;
  if (image.sourceType === "external_url" && image.externalUrl) return image.externalUrl;
  return null;
}

function resolveOriginalUrl(image: StoreImage): string | null {
  if (image.sourceType === "google_maps") return image.googleMapsUri;
  if (image.sourceType === "user_upload") return image.storageUrl;
  if (image.sourceType === "external_url") return image.externalUrl;
  if (image.sourceType === "sns_reference") return image.snsPostUrl;
  return null;
}

export default function ImagePreviewModal({
  storeId,
  image,
  onClose,
  onChanged,
  onDeleted,
}: {
  storeId: string;
  image: StoreImage;
  onClose: () => void;
  onChanged: (image: StoreImage) => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName] = useState(image.name ?? "");
  const [imageType, setImageType] = useState<StoreImageCategory>(image.imageType);
  const [isSelected, setIsSelected] = useState(image.isSelected);
  const [usageTypes, setUsageTypes] = useState<ImageUsageType[]>(image.usageTypes);
  const [permissionStatus, setPermissionStatus] = useState<ImagePermissionStatus>(image.permissionStatus);
  const [displayOrder, setDisplayOrder] = useState(image.displayOrder);
  const [memo, setMemo] = useState(image.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleUsageType = (type: ImageUsageType) => {
    setUsageTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, imageType, isSelected, usageTypes, permissionStatus, displayOrder, memo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      onChanged(data.image as StoreImage);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleteOpen(false);
    try {
      const res = await fetch(`/api/stores/${storeId}/images/${image.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました。");
      onDeleted(image.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  };

  const thumbSrc = resolveThumbSrc(storeId, image);
  const originalUrl = resolveOriginalUrl(image);

  return (
    <div className={styles.previewOverlay} role="presentation" onClick={onClose}>
      <div className={styles.previewDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.previewImageWrapper}>
          {thumbSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.previewImage} src={thumbSrc} alt={name || "画像プレビュー"} />
          ) : (
            <p style={{ color: "#fff", padding: 20 }}>プレビューできる画像がありません（SNS投稿メモのみ）</p>
          )}
        </div>

        <div className={styles.previewForm}>
          <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
            <span className={common.helpText}>取得元: {IMAGE_SOURCE_TYPE_LABELS[image.sourceType]}</span>
            <button type="button" className={common.linkButton} onClick={onClose}>
              閉じる
            </button>
          </div>

          {error && <p className={common.errorText}>{error}</p>}

          <label className={common.field}>
            <span>画像名</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className={common.field}>
            <span>画像種別</span>
            <select value={imageType} onChange={(e) => setImageType(e.target.value as StoreImageCategory)}>
              {STORE_IMAGE_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className={common.checkboxField}>
            <input type="checkbox" checked={isSelected} onChange={(e) => setIsSelected(e.target.checked)} />
            使用する
          </label>

          <div className={common.field}>
            <span>使用用途（複数選択可）</span>
            <div className={styles.usageTypeGrid}>
              {IMAGE_USAGE_TYPE_OPTIONS.map((o) => (
                <label key={o.value} className={common.checkboxField}>
                  <input
                    type="checkbox"
                    checked={usageTypes.includes(o.value)}
                    onChange={() => toggleUsageType(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <label className={common.field}>
            <span>利用確認ステータス</span>
            <select
              value={permissionStatus}
              onChange={(e) => setPermissionStatus(e.target.value as ImagePermissionStatus)}
            >
              {IMAGE_PERMISSION_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className={common.field}>
            <span>表示順</span>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </label>

          <label className={common.field}>
            <span>メモ</span>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
          </label>

          <div className={common.toolbar}>
            <button type="button" className={common.buttonPrimary} onClick={save} disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </button>
            {originalUrl && (
              <a href={originalUrl} target="_blank" rel="noopener noreferrer" className={common.button}>
                元URLを開く
              </a>
            )}
            <button type="button" className={common.buttonDanger} onClick={() => setDeleteOpen(true)}>
              削除
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="画像を削除しますか？"
        message={
          image.sourceType === "google_maps"
            ? "この一覧から参照情報を削除します（Googleマップ上の写真自体は削除されません）。"
            : "この画像を削除します。この操作は取り消せません。"
        }
        onConfirm={remove}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
