"use client";

import { useState, type FormEvent } from "react";
import common from "@/styles/common.module.css";
import type { StoreImage } from "@/types/image";

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "error"; message: string }
  | { status: "checked"; contentType: string | null };

export default function ExternalUrlSection({
  storeId,
  onImageAdded,
}: {
  storeId: string;
  onImageAdded: (image: StoreImage) => void;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [checkState, setCheckState] = useState<CheckState>({ status: "idle" });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleCheck = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setCheckState({ status: "checking" });
    setRegisterError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/images/check-external-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "画像URLの確認に失敗しました。");
      setCheckState({ status: "checked", contentType: data.contentType ?? null });
    } catch (err) {
      setCheckState({ status: "error", message: err instanceof Error ? err.message : "画像URLの確認に失敗しました。" });
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: "external_url", externalUrl: url, name: name || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "画像情報の登録に失敗しました。");
      onImageAdded(data.image as StoreImage);
      setUrl("");
      setName("");
      setCheckState({ status: "idle" });
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "画像情報の登録に失敗しました。");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className={common.card}>
      <h2 className={common.sectionTitle}>外部画像URL</h2>
      <p className={common.helpText}>
        画像をダウンロードせず、URLを参照情報として保存します。HTTPSのURLのみ登録できます。
      </p>

      <form className={common.formGrid} onSubmit={handleCheck}>
        <label className={common.field}>
          <span>画像URL</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/photo.jpg" />
        </label>
        <label className={common.field}>
          <span>画像名（任意）</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div style={{ alignSelf: "end" }}>
          <button type="submit" className={common.button} disabled={checkState.status === "checking"}>
            {checkState.status === "checking" ? "確認中..." : "確認する"}
          </button>
        </div>
      </form>

      {checkState.status === "error" && <p className={common.errorText}>{checkState.message}</p>}

      {checkState.status === "checked" && (
        <div className={common.card} style={{ background: "var(--surface-muted)" }}>
          <p className={common.successText}>画像として取得できることを確認しました（{checkState.contentType}）。</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name || "プレビュー"} style={{ maxWidth: 240, borderRadius: 8 }} />
          {registerError && <p className={common.errorText}>{registerError}</p>}
          <button type="button" className={common.buttonPrimary} onClick={handleRegister} disabled={registering}>
            {registering ? "登録中..." : "この画像を登録する"}
          </button>
        </div>
      )}
    </div>
  );
}
