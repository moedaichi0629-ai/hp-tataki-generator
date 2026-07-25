"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SNS_TYPE_OPTIONS, SOCIAL_REFERENCE_CONFIRMATION_STATUS_OPTIONS } from "@/lib/imageStatus";
import type { SocialImageReference } from "@/types/image";

const EMPTY_FORM = { snsType: "instagram", postUrl: "", description: "", plannedUse: false, memo: "" };

export default function SocialReferencesSection({ storeId }: { storeId: string }) {
  const [references, setReferences] = useState<SocialImageReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<SocialImageReference | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/social-image-references`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "SNS投稿メモの取得に失敗しました。");
      setReferences(data.references as SocialImageReference[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SNS投稿メモの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const submit = async () => {
    if (!form.postUrl.trim()) {
      setError("投稿URLを入力してください。");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/social-image-references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    }
  };

  const updateConfirmation = async (ref: SocialImageReference, confirmationStatus: string) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/social-image-references/${ref.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました。");
      setReferences((prev) => prev.map((r) => (r.id === ref.id ? (data.reference as SocialImageReference) : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/social-image-references/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました。");
      setReferences((prev) => prev.filter((r) => r.id !== target.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  };

  return (
    <div className={common.card}>
      <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
        <h2 className={common.sectionTitle}>SNS投稿メモ</h2>
        <button type="button" className={common.buttonPrimary} onClick={() => setShowForm(true)}>
          投稿メモを追加
        </button>
      </div>
      <p className={common.helpText}>
        Instagram・X・Facebookなどの投稿URLをメモとして保存します。画像の自動取得は行いません。店舗へ画像提供を依頼する際の参考情報として利用してください。
      </p>

      {error && <p className={common.errorText}>{error}</p>}

      {showForm && (
        <div className={common.card} style={{ background: "var(--surface-muted)" }}>
          <div className={common.formGrid}>
            <label className={common.field}>
              <span>SNS種別</span>
              <select value={form.snsType} onChange={(e) => setForm({ ...form, snsType: e.target.value })}>
                {SNS_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={common.field}>
              <span>投稿URL</span>
              <input value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })} />
            </label>
            <label className={common.checkboxField} style={{ alignSelf: "end" }}>
              <input
                type="checkbox"
                checked={form.plannedUse}
                onChange={(e) => setForm({ ...form, plannedUse: e.target.checked })}
              />
              使用予定
            </label>
            <label className={`${common.field} ${common.fieldFullWidth}`}>
              <span>説明</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className={`${common.field} ${common.fieldFullWidth}`}>
              <span>メモ</span>
              <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
            </label>
          </div>
          <div className={common.toolbar}>
            <button type="button" className={common.buttonPrimary} onClick={submit}>
              保存する
            </button>
            <button type="button" className={common.button} onClick={() => setShowForm(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className={common.loading}>読み込み中...</p>
      ) : references.length === 0 ? (
        <p className={common.emptyState}>まだSNS投稿メモがありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {references.map((ref) => (
            <div
              key={ref.id}
              style={{ border: "1px solid var(--border-color)", borderRadius: 10, padding: "12px 14px" }}
            >
              <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
                <a href={ref.postUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>
                  {SNS_TYPE_OPTIONS.find((o) => o.value === ref.snsType)?.label ?? ref.snsType}の投稿を開く
                </a>
                <button type="button" className={common.buttonDanger} onClick={() => setDeleteTarget(ref)}>
                  削除
                </button>
              </div>
              {ref.description && <p style={{ fontSize: 14, marginTop: 6 }}>{ref.description}</p>}
              <div className={common.toolbar} style={{ marginTop: 6 }}>
                <label className={common.checkboxField}>
                  <input type="checkbox" checked={ref.plannedUse} readOnly />
                  使用予定
                </label>
                <select
                  value={ref.confirmationStatus}
                  onChange={(e) => updateConfirmation(ref, e.target.value)}
                >
                  {SOCIAL_REFERENCE_CONFIRMATION_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {ref.memo && <p className={common.helpText}>{ref.memo}</p>}
              <span className={common.helpText}>{new Date(ref.createdAt).toLocaleDateString("ja-JP")}</span>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="SNS投稿メモを削除しますか？"
        message="このメモを削除します。"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
