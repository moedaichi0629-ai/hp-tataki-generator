"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import styles from "./detail.module.css";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FIELD_VERIFICATION_STATUS_OPTIONS } from "@/lib/storeStatus";
import type { StoreService, FieldVerificationStatus } from "@/types/store";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  priceNote: "",
  duration: "",
  targetAudience: "",
  features: "",
  remarks: "",
};

type FormState = typeof EMPTY_FORM;

export default function ServicesTab({ storeId }: { storeId: string }) {
  const [services, setServices] = useState<StoreService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreService | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/services`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "サービスの取得に失敗しました。");
      setServices(data.services as StoreService[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "サービスの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (service: StoreService) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: service.price ?? "",
      priceNote: service.priceNote ?? "",
      duration: service.duration ?? "",
      targetAudience: service.targetAudience ?? "",
      features: service.features ?? "",
      remarks: service.remarks ?? "",
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      setError("サービス名を入力してください。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/stores/${storeId}/services/${editingId}` : `/api/stores/${storeId}/services`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (service: StoreService) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !service.isPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました。");
      setServices((prev) => prev.map((s) => (s.id === service.id ? (data.service as StoreService) : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    }
  };

  const changeVerification = async (service: StoreService, status: FieldVerificationStatus) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました。");
      setServices((prev) => prev.map((s) => (s.id === service.id ? (data.service as StoreService) : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    }
  };

  const duplicate = async (service: StoreService) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/services/${service.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "複製に失敗しました。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "複製に失敗しました。");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/services/${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました。");
      setServices((prev) => prev.filter((s) => s.id !== target.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= services.length) return;
    const reordered = [...services];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setServices(reordered);
    try {
      await fetch(`/api/stores/${storeId}/services/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((s) => s.id) }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className={common.loading}>読み込み中...</p>;

  return (
    <div className={common.card}>
      <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
        <h2 className={common.sectionTitle}>サービス・メニュー</h2>
        <button type="button" className={common.buttonPrimary} onClick={startCreate}>
          サービスを追加
        </button>
      </div>

      {error && <p className={common.errorText}>{error}</p>}

      {showForm && (
        <div className={common.card} style={{ background: "var(--surface-muted)" }}>
          <div className={common.formGrid}>
            <label className={common.field}>
              <span>サービス名</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className={common.field}>
              <span>料金</span>
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="不明な場合は空欄のままにしてください" />
            </label>
            <label className={common.field}>
              <span>料金補足</span>
              <input value={form.priceNote} onChange={(e) => setForm({ ...form, priceNote: e.target.value })} />
            </label>
            <label className={common.field}>
              <span>所要時間</span>
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </label>
            <label className={common.field}>
              <span>おすすめ対象</span>
              <input value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
            </label>
            <label className={`${common.field} ${common.fieldFullWidth}`}>
              <span>説明</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className={`${common.field} ${common.fieldFullWidth}`}>
              <span>特徴</span>
              <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
            </label>
            <label className={`${common.field} ${common.fieldFullWidth}`}>
              <span>備考</span>
              <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </label>
          </div>
          <div className={common.toolbar}>
            <button type="button" className={common.buttonPrimary} onClick={submitForm} disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </button>
            <button type="button" className={common.button} onClick={() => setShowForm(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <p className={common.emptyState}>まだサービス・メニューが登録されていません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map((service, index) => (
            <div key={service.id} className={styles.serviceItem}>
              <div className={styles.serviceHeaderRow}>
                <strong>{service.name}</strong>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" className={common.button} onClick={() => move(index, -1)} disabled={index === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className={common.button}
                    onClick={() => move(index, 1)}
                    disabled={index === services.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>

              {service.description && <p style={{ fontSize: 14, whiteSpace: "pre-line" }}>{service.description}</p>}

              <dl className={styles.infoGrid}>
                <dt>料金</dt>
                <dd>{service.price || "不明"}{service.priceNote ? `（${service.priceNote}）` : ""}</dd>
                <dt>所要時間</dt>
                <dd>{service.duration || "不明"}</dd>
                <dt>おすすめ対象</dt>
                <dd>{service.targetAudience || "不明"}</dd>
                <dt>特徴</dt>
                <dd>{service.features || "不明"}</dd>
                <dt>備考</dt>
                <dd>{service.remarks || "なし"}</dd>
              </dl>

              <div className={common.toolbar}>
                <label className={common.checkboxField}>
                  <input type="checkbox" checked={service.isPublished} onChange={() => togglePublish(service)} />
                  HPに掲載する
                </label>
                <select
                  value={service.verificationStatus}
                  onChange={(e) => changeVerification(service, e.target.value as FieldVerificationStatus)}
                >
                  {FIELD_VERIFICATION_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button type="button" className={common.button} onClick={() => startEdit(service)}>
                  編集
                </button>
                <button type="button" className={common.button} onClick={() => duplicate(service)}>
                  複製
                </button>
                <button type="button" className={common.buttonDanger} onClick={() => setDeleteTarget(service)}>
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="サービスを削除しますか？"
        message={deleteTarget ? `「${deleteTarget.name}」を削除します。` : ""}
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
