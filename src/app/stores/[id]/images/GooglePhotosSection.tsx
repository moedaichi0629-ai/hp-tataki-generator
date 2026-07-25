"use client";

import { useMemo, useState } from "react";
import common from "@/styles/common.module.css";
import styles from "./images.module.css";
import { IMAGE_PERMISSION_STATUS_OPTIONS } from "@/lib/imageStatus";
import type { ImagePermissionStatus, StoreImage } from "@/types/image";

function googlePhotoThumbUrl(storeId: string, resourceName: string): string {
  return `/api/stores/${storeId}/images/google-photo?ref=${encodeURIComponent(resourceName)}&maxwidth=400`;
}

export default function GooglePhotosSection({
  storeId,
  images,
  onImagesReplaced,
  onImageChanged,
  onOpenPreview,
}: {
  storeId: string;
  images: StoreImage[];
  onImagesReplaced: (images: StoreImage[]) => void;
  onImageChanged: (image: StoreImage) => void;
  onOpenPreview: (image: StoreImage) => void;
}) {
  const googleImages = useMemo(() => images.filter((i) => i.sourceType === "google_maps"), [images]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkPermission, setBulkPermission] = useState<ImagePermissionStatus>("unconfirmed");

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(googleImages.map((i) => i.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const fetchGooglePhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/images/google-photos/fetch`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Googleマップ写真の取得に失敗しました。");
      if (data.images) onImagesReplaced(data.images as StoreImage[]);
      else if (data.error) setError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Googleマップ写真の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const applyBulk = async (patch: Record<string, unknown>) => {
    if (selectedIds.size === 0) {
      setError("写真を選択してください。");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/images/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: Array.from(selectedIds), patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "一括更新に失敗しました。");
      onImagesReplaced(data.images as StoreImage[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "一括更新に失敗しました。");
    }
  };

  const toggleUse = async (image: StoreImage) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSelected: !image.isSelected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました。");
      onImageChanged(data.image as StoreImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    }
  };

  return (
    <div className={common.card}>
      <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
        <h2 className={common.sectionTitle}>Googleマップ写真</h2>
        <button type="button" className={common.buttonPrimary} onClick={fetchGooglePhotos} disabled={loading}>
          {loading ? "取得中..." : googleImages.length > 0 ? "写真情報を再取得" : "写真情報を取得"}
        </button>
      </div>

      <p className={common.helpText}>
        Googleマップに掲載されている店舗写真の参照情報を取得します（最大10枚）。画像の実体はこのシステムには保存されず、表示のたびにGoogleから取得します。取得元:
        <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">
          {" "}
          Google マップ
        </a>
        （Powered by Google）
      </p>

      {error && <p className={common.errorText}>{error}</p>}

      {googleImages.length > 0 && (
        <div className={common.toolbar}>
          <button type="button" className={common.button} onClick={selectAll}>
            全選択
          </button>
          <button type="button" className={common.button} onClick={clearSelection}>
            全選択解除
          </button>
          <button type="button" className={common.button} onClick={() => applyBulk({ isSelected: true })}>
            使用するに変更
          </button>
          <button type="button" className={common.button} onClick={() => applyBulk({ isSelected: false })}>
            使用しないに変更
          </button>
          <button type="button" className={common.button} onClick={() => applyBulk({ addUsageType: "gallery" })}>
            ギャラリー用に設定
          </button>
          <select value={bulkPermission} onChange={(e) => setBulkPermission(e.target.value as ImagePermissionStatus)}>
            {IMAGE_PERMISSION_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="button" className={common.button} onClick={() => applyBulk({ permissionStatus: bulkPermission })}>
            利用状態を一括変更
          </button>
        </div>
      )}

      {googleImages.length === 0 ? (
        <p className={common.emptyState}>
          まだGoogleマップ写真を取得していません。「写真情報を取得」を押してください。Place
          IDが未登録の店舗、またはGoogleマップ上に写真がない店舗ではエラーになる場合があります。
        </p>
      ) : (
        <div className={styles.grid}>
          {googleImages.map((image) => (
            <div key={image.id} className={styles.card}>
              <div className={styles.thumbWrapper}>
                <input
                  type="checkbox"
                  className={styles.selectCheckbox}
                  checked={selectedIds.has(image.id)}
                  onChange={() => toggleSelect(image.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                {image.googlePhotoResourceName && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.thumb}
                    src={googlePhotoThumbUrl(storeId, image.googlePhotoResourceName)}
                    alt={image.name ?? "Googleマップ写真"}
                    loading="lazy"
                    onClick={() => onOpenPreview(image)}
                  />
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardMeta}>
                  {image.width && image.height ? `${image.width}×${image.height}` : "サイズ不明"}
                </span>
                <span className={styles.attribution}>
                  {image.authorName ?? "投稿者不明"}（Googleマップより）
                  {image.googleMapsUri && (
                    <>
                      {" "}
                      <a href={image.googleMapsUri} target="_blank" rel="noopener noreferrer">
                        プロフィール
                      </a>
                    </>
                  )}
                </span>
                <label className={common.checkboxField}>
                  <input type="checkbox" checked={image.isSelected} onChange={() => toggleUse(image)} />
                  使用する
                </label>
                <button type="button" className={common.linkButton} onClick={() => onOpenPreview(image)}>
                  詳細を編集
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
