"use client";

import { useMemo, useRef, useState } from "react";
import common from "@/styles/common.module.css";
import styles from "./images.module.css";
import { decodeImageFile } from "@/lib/decodeImageFile";
import { uploadFileToSignedUrl } from "@/lib/uploadToStorage";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/imageValidation";
import type { StoreImage } from "@/types/image";

interface UploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: "pending" | "validating" | "requesting" | "uploading" | "registering" | "done" | "error";
  error: string | null;
}

const ALLOWED_TYPES = new Set<string>(ALLOWED_UPLOAD_MIME_TYPES);
const MAX_SIZE_MB = MAX_UPLOAD_FILE_SIZE_BYTES / 1024 / 1024;

export default function UploadSection({
  storeId,
  images,
  onImageAdded,
}: {
  storeId: string;
  images: StoreImage[];
  onImageAdded: (image: StoreImage) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const existingNames = useMemo(
    () => new Set(images.filter((i) => i.sourceType === "user_upload").map((i) => i.name).filter(Boolean)),
    [images]
  );

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const processFile = async (file: File) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, fileName: file.name, progress: 0, status: "pending", error: null }]);

    if (!ALLOWED_TYPES.has(file.type)) {
      const hint = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif")
        ? "（HEIC/HEIF形式には対応していません。JPEG・PNG・WebPに変換してください）"
        : "";
      updateItem(id, { status: "error", error: `対応していないファイル形式です${hint}` });
      return;
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      updateItem(id, { status: "error", error: `ファイルサイズは${MAX_SIZE_MB}MB以下にしてください。` });
      return;
    }
    if (existingNames.has(file.name)) {
      const proceed = window.confirm(`「${file.name}」と同じ名前の画像が既に登録されています。続行しますか？`);
      if (!proceed) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        return;
      }
    }

    updateItem(id, { status: "validating" });
    let width: number | null = null;
    let height: number | null = null;
    try {
      const decoded = await decodeImageFile(file);
      width = decoded.width;
      height = decoded.height;
    } catch (err) {
      updateItem(id, { status: "error", error: err instanceof Error ? err.message : "画像の検証に失敗しました。" });
      return;
    }

    updateItem(id, { status: "requesting" });
    let uploadUrlData: { path: string; token: string; signedUrl: string };
    try {
      const res = await fetch(`/api/stores/${storeId}/images/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "アップロードURLの発行に失敗しました。");
      uploadUrlData = data;
    } catch (err) {
      updateItem(id, { status: "error", error: err instanceof Error ? err.message : "アップロードURLの発行に失敗しました。" });
      return;
    }

    updateItem(id, { status: "uploading" });
    try {
      await uploadFileToSignedUrl(uploadUrlData.signedUrl, file, (percent) => updateItem(id, { progress: percent }));
    } catch (err) {
      updateItem(id, { status: "error", error: err instanceof Error ? err.message : "アップロードに失敗しました。" });
      return;
    }

    updateItem(id, { status: "registering" });
    try {
      const res = await fetch(`/api/stores/${storeId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "user_upload",
          storagePath: uploadUrlData.path,
          name: file.name,
          width,
          height,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "画像情報の登録に失敗しました。");
      onImageAdded(data.image as StoreImage);
      updateItem(id, { status: "done", progress: 100 });
    } catch (err) {
      updateItem(id, { status: "error", error: err instanceof Error ? err.message : "画像情報の登録に失敗しました。" });
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      processFile(file);
    });
  };

  return (
    <div className={common.card}>
      <h2 className={common.sectionTitle}>アップロード画像</h2>
      <p className={common.helpText}>
        対応形式: JPEG・PNG・WebP（HEICは未対応です）。1ファイルあたり{MAX_SIZE_MB}MB以下。複数ファイルを同時に選択できます。
      </p>

      <div
        className={dragActive ? styles.dropzoneActive : styles.dropzone}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        クリックまたはドラッグ&ドロップでファイルを選択
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 13 }}>{item.fileName}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {item.status === "done"
                    ? "完了"
                    : item.status === "error"
                      ? "エラー"
                      : item.status === "uploading"
                        ? `アップロード中 ${item.progress}%`
                        : item.status === "validating"
                          ? "検証中..."
                          : item.status === "requesting"
                            ? "準備中..."
                            : item.status === "registering"
                              ? "登録中..."
                              : "待機中"}
                </span>
              </div>
              <div className={styles.progressBarOuter}>
                <div
                  className={styles.progressBarInner}
                  style={{ width: `${item.status === "done" ? 100 : item.progress}%` }}
                />
              </div>
              {item.error && <p className={common.errorText}>{item.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
