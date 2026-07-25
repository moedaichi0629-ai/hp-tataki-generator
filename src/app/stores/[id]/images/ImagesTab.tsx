"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import ImageReadinessPanel from "./ImageReadinessPanel";
import GooglePhotosSection from "./GooglePhotosSection";
import UploadSection from "./UploadSection";
import ExternalUrlSection from "./ExternalUrlSection";
import SocialReferencesSection from "./SocialReferencesSection";
import ImageGalleryList from "./ImageGalleryList";
import ImagePreviewModal from "./ImagePreviewModal";
import type { StoreImage } from "@/types/image";

type SubTabKey = "google" | "upload" | "external" | "sns" | "gallery";

const SUB_TABS: { key: SubTabKey; label: string }[] = [
  { key: "google", label: "Googleマップ写真" },
  { key: "upload", label: "アップロード画像" },
  { key: "external", label: "外部画像URL" },
  { key: "sns", label: "SNS投稿メモ" },
  { key: "gallery", label: "使用画像一覧" },
];

export default function ImagesTab({ storeId }: { storeId: string }) {
  const [images, setImages] = useState<StoreImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTabKey>("google");
  const [previewImage, setPreviewImage] = useState<StoreImage | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/images`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "画像一覧の取得に失敗しました。");
      setImages(data.images as StoreImage[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleImageChanged = (updated: StoreImage) => {
    setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setPreviewImage((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  const handleImageAdded = (created: StoreImage) => {
    setImages((prev) => [...prev, created]);
  };

  const handleImageDeleted = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) return <p className={common.loading}>読み込み中...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && <p className={common.errorText}>{error}</p>}

      <ImageReadinessPanel images={images} />

      <div className={common.tabs}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={subTab === t.key ? common.tabActive : common.tab}
            onClick={() => setSubTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "google" && (
        <GooglePhotosSection
          storeId={storeId}
          images={images}
          onImagesReplaced={setImages}
          onImageChanged={handleImageChanged}
          onOpenPreview={setPreviewImage}
        />
      )}
      {subTab === "upload" && <UploadSection storeId={storeId} images={images} onImageAdded={handleImageAdded} />}
      {subTab === "external" && <ExternalUrlSection storeId={storeId} onImageAdded={handleImageAdded} />}
      {subTab === "sns" && <SocialReferencesSection storeId={storeId} />}
      {subTab === "gallery" && (
        <ImageGalleryList storeId={storeId} images={images} onReordered={setImages} onOpenPreview={setPreviewImage} />
      )}

      {previewImage && (
        <ImagePreviewModal
          key={previewImage.id}
          storeId={storeId}
          image={previewImage}
          onClose={() => setPreviewImage(null)}
          onChanged={handleImageChanged}
          onDeleted={handleImageDeleted}
        />
      )}
    </div>
  );
}
