"use client";

import { useMemo, useState } from "react";
import common from "@/styles/common.module.css";
import styles from "./images.module.css";
import {
  IMAGE_SOURCE_TYPE_LABELS,
  IMAGE_SOURCE_TYPE_OPTIONS,
  STORE_IMAGE_CATEGORY_LABELS,
  STORE_IMAGE_CATEGORY_OPTIONS,
  IMAGE_USAGE_TYPE_OPTIONS,
  IMAGE_PERMISSION_STATUS_LABELS,
} from "@/lib/imageStatus";
import type { StoreImage } from "@/types/image";

type UseFilter = "all" | "selected" | "unselected";
type PermissionFilter = "all" | "confirmed" | "unconfirmed";
type SortKey = "display_order" | "created_desc" | "name" | "size_desc" | "source";

function resolveThumbSrc(storeId: string, image: StoreImage): string | null {
  if (image.sourceType === "google_maps" && image.googlePhotoResourceName) {
    return `/api/stores/${storeId}/images/google-photo?ref=${encodeURIComponent(image.googlePhotoResourceName)}&maxwidth=200`;
  }
  if (image.sourceType === "user_upload" && image.storageUrl) return image.storageUrl;
  if (image.sourceType === "external_url" && image.externalUrl) return image.externalUrl;
  return null;
}

export default function ImageGalleryList({
  storeId,
  images,
  onReordered,
  onOpenPreview,
}: {
  storeId: string;
  images: StoreImage[];
  onReordered: (images: StoreImage[]) => void;
  onOpenPreview: (image: StoreImage) => void;
}) {
  const [useFilter, setUseFilter] = useState<UseFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [permissionFilter, setPermissionFilter] = useState<PermissionFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("display_order");

  const filtered = useMemo(() => {
    let list = [...images];
    if (useFilter === "selected") list = list.filter((i) => i.isSelected);
    if (useFilter === "unselected") list = list.filter((i) => !i.isSelected);
    if (sourceFilter !== "all") list = list.filter((i) => i.sourceType === sourceFilter);
    if (permissionFilter === "confirmed") list = list.filter((i) => i.permissionStatus !== "unconfirmed");
    if (permissionFilter === "unconfirmed") list = list.filter((i) => i.permissionStatus === "unconfirmed");
    if (typeFilter !== "all") list = list.filter((i) => i.imageType === typeFilter);
    if (usageFilter !== "all") list = list.filter((i) => i.usageTypes.includes(usageFilter as never));

    switch (sort) {
      case "created_desc":
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "name":
        list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        break;
      case "size_desc":
        list.sort((a, b) => (b.fileSize ?? 0) - (a.fileSize ?? 0));
        break;
      case "source":
        list.sort((a, b) => a.sourceType.localeCompare(b.sourceType));
        break;
      default:
        list.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return list;
  }, [images, useFilter, sourceFilter, permissionFilter, typeFilter, usageFilter, sort]);

  const move = async (index: number, direction: -1 | 1) => {
    if (sort !== "display_order") return; // 表示順以外でソート中は並び替え不可
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;
    const reordered = [...filtered];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const otherIds = new Set(reordered.map((i) => i.id));
    const untouched = images.filter((i) => !otherIds.has(i.id));
    const merged = [...reordered, ...untouched];
    onReordered(merged);

    try {
      await fetch(`/api/stores/${storeId}/images/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: merged.map((i) => i.id) }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={common.card}>
      <h2 className={common.sectionTitle}>使用画像一覧（{filtered.length}件 / 全{images.length}件）</h2>

      <div className={common.formGrid}>
        <label className={common.field}>
          <span>使用状況</span>
          <select value={useFilter} onChange={(e) => setUseFilter(e.target.value as UseFilter)}>
            <option value="all">すべて</option>
            <option value="selected">使用する</option>
            <option value="unselected">使用しない</option>
          </select>
        </label>
        <label className={common.field}>
          <span>取得元</span>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">すべて</option>
            {IMAGE_SOURCE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={common.field}>
          <span>利用確認</span>
          <select value={permissionFilter} onChange={(e) => setPermissionFilter(e.target.value as PermissionFilter)}>
            <option value="all">すべて</option>
            <option value="confirmed">利用許可あり</option>
            <option value="unconfirmed">利用未確認</option>
          </select>
        </label>
        <label className={common.field}>
          <span>画像種別</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">すべて</option>
            {STORE_IMAGE_CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={common.field}>
          <span>使用用途</span>
          <select value={usageFilter} onChange={(e) => setUsageFilter(e.target.value)}>
            <option value="all">すべて</option>
            {IMAGE_USAGE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={common.field}>
          <span>並び替え</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="display_order">表示順</option>
            <option value="created_desc">登録日</option>
            <option value="name">画像名</option>
            <option value="size_desc">画像サイズ</option>
            <option value="source">取得元</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className={common.emptyState}>条件に合う画像がありません。</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((image, index) => {
            const thumbSrc = resolveThumbSrc(storeId, image);
            return (
              <div key={image.id} className={styles.card}>
                <div className={styles.thumbWrapper} onClick={() => onOpenPreview(image)}>
                  {thumbSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.thumb} src={thumbSrc} alt={image.name ?? ""} loading="lazy" />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      プレビューなし
                    </div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {image.name || "（無題）"}
                  </span>
                  <span className={styles.cardMeta}>
                    {IMAGE_SOURCE_TYPE_LABELS[image.sourceType]} / {STORE_IMAGE_CATEGORY_LABELS[image.imageType]}
                  </span>
                  <span className={styles.cardMeta}>{IMAGE_PERMISSION_STATUS_LABELS[image.permissionStatus]}</span>
                  <span className={styles.cardMeta}>{image.isSelected ? "使用する" : "使用しない"}</span>
                  {sort === "display_order" && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        className={common.button}
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={common.button}
                        onClick={() => move(index, 1)}
                        disabled={index === filtered.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
