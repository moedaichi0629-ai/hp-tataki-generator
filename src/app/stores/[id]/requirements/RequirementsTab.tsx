"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import SectionsManager from "./SectionsManager";
import {
  WEBSITE_PURPOSE_OPTIONS,
  WEBSITE_TYPE_OPTIONS,
  PRIMARY_ACTION_OPTIONS,
  TECHNOLOGY_OPTIONS,
  DEPLOYMENT_METHOD_OPTIONS,
  SUPPORTED_DEVICE_OPTIONS,
  DELIVERY_FORMAT_OPTIONS,
  UPDATE_FRIENDLINESS_OPTIONS,
} from "@/lib/promptOptions";
import type {
  DeliveryFormat,
  DeploymentMethod,
  PrimaryAction,
  SupportedDevice,
  TechnologyChoice,
  UpdateFriendliness,
  WebsitePurpose,
  WebsiteRequirements,
  WebsiteType,
} from "@/types/prompt";

type FormState = Omit<WebsiteRequirements, "id" | "storeId" | "createdAt" | "updatedAt">;

function toFormState(r: WebsiteRequirements): FormState {
  const { id, storeId, createdAt, updatedAt, ...rest } = r;
  void id;
  void storeId;
  void createdAt;
  void updatedAt;
  return rest;
}

export default function RequirementsTab({ storeId }: { storeId: string }) {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/website-requirements`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "HP制作条件の取得に失敗しました。");
      setForm(toFormState(data.requirements as WebsiteRequirements));
    } catch (err) {
      setError(err instanceof Error ? err.message : "HP制作条件の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const togglePurpose = (value: WebsitePurpose) => {
    setForm((prev) =>
      prev
        ? { ...prev, purposes: prev.purposes.includes(value) ? prev.purposes.filter((p) => p !== value) : [...prev.purposes, value] }
        : prev
    );
  };

  const toggleDevice = (value: SupportedDevice) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            supportedDevices: prev.supportedDevices.includes(value)
              ? prev.supportedDevices.filter((d) => d !== value)
              : [...prev.supportedDevices, value],
          }
        : prev
    );
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/stores/${storeId}/website-requirements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      setForm(toFormState(data.requirements as WebsiteRequirements));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <p className={common.loading}>読み込み中...</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className={common.card}>
        <h2 className={common.sectionTitle}>基本設定</h2>

        <div className={common.field}>
          <span>HPの目的（複数選択可）</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
            {WEBSITE_PURPOSE_OPTIONS.map((o) => (
              <label key={o.value} className={common.checkboxField}>
                <input type="checkbox" checked={form.purposes.includes(o.value)} onChange={() => togglePurpose(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        <div className={common.formGrid}>
          <label className={common.field}>
            <span>制作タイプ</span>
            <select
              value={form.websiteType ?? ""}
              onChange={(e) => setForm({ ...form, websiteType: (e.target.value || null) as WebsiteType | null })}
            >
              <option value="">未選択</option>
              {WEBSITE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.field}>
            <span>ユーザーに取ってほしい行動</span>
            <select
              value={form.primaryAction ?? ""}
              onChange={(e) => setForm({ ...form, primaryAction: (e.target.value || null) as PrimaryAction | null })}
            >
              <option value="">未選択</option>
              {PRIMARY_ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.field}>
            <span>問い合わせ方法</span>
            <input value={form.contactMethod ?? ""} onChange={(e) => setForm({ ...form, contactMethod: e.target.value || null })} />
          </label>
          <label className={common.field}>
            <span>予約方法</span>
            <input
              value={form.reservationMethod ?? ""}
              onChange={(e) => setForm({ ...form, reservationMethod: e.target.value || null })}
            />
          </label>
        </div>

        <label className={common.field}>
          <span>想定ターゲット</span>
          <textarea value={form.targetAudience ?? ""} onChange={(e) => setForm({ ...form, targetAudience: e.target.value || null })} />
        </label>
        <label className={common.field}>
          <span>最も伝えたい内容</span>
          <textarea value={form.mainMessage ?? ""} onChange={(e) => setForm({ ...form, mainMessage: e.target.value || null })} />
        </label>
        <label className={common.field}>
          <span>店舗の強み（補足メモ。詳細は「口コミ・強み」タブで整理できます）</span>
          <textarea
            value={form.keyStrengthsNote ?? ""}
            onChange={(e) => setForm({ ...form, keyStrengthsNote: e.target.value || null })}
          />
        </label>
        <label className={common.field}>
          <span>掲載しない情報</span>
          <textarea
            value={form.excludedInformation ?? ""}
            onChange={(e) => setForm({ ...form, excludedInformation: e.target.value || null })}
          />
        </label>
        <label className={common.field}>
          <span>注意事項</span>
          <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} />
        </label>
        <label className={common.field}>
          <span>自由入力の補足指示</span>
          <textarea
            value={form.supplementaryInstructions ?? ""}
            onChange={(e) => setForm({ ...form, supplementaryInstructions: e.target.value || null })}
          />
        </label>
      </div>

      <div className={common.card}>
        <h2 className={common.sectionTitle}>技術・公開条件</h2>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>使用技術</span>
            <select
              value={form.technology ?? ""}
              onChange={(e) => setForm({ ...form, technology: (e.target.value || null) as TechnologyChoice | null })}
            >
              <option value="">未選択</option>
              {TECHNOLOGY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {form.technology === "other" && (
            <label className={common.field}>
              <span>使用技術（その他・自由入力）</span>
              <input value={form.technologyOther ?? ""} onChange={(e) => setForm({ ...form, technologyOther: e.target.value || null })} />
            </label>
          )}
          <label className={common.field}>
            <span>公開方法</span>
            <select
              value={form.deploymentMethod ?? ""}
              onChange={(e) => setForm({ ...form, deploymentMethod: (e.target.value || null) as DeploymentMethod | null })}
            >
              <option value="">未選択</option>
              {DEPLOYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {form.deploymentMethod === "other" && (
            <label className={common.field}>
              <span>公開方法（その他・自由入力）</span>
              <input
                value={form.deploymentMethodOther ?? ""}
                onChange={(e) => setForm({ ...form, deploymentMethodOther: e.target.value || null })}
              />
            </label>
          )}
          <label className={common.field}>
            <span>納品形式</span>
            <select
              value={form.deliveryFormat ?? ""}
              onChange={(e) => setForm({ ...form, deliveryFormat: (e.target.value || null) as DeliveryFormat | null })}
            >
              <option value="">未選択</option>
              {DELIVERY_FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {form.deliveryFormat === "other" && (
            <label className={common.field}>
              <span>納品形式（その他・自由入力）</span>
              <input
                value={form.deliveryFormatOther ?? ""}
                onChange={(e) => setForm({ ...form, deliveryFormatOther: e.target.value || null })}
              />
            </label>
          )}
          <label className={common.field}>
            <span>更新しやすさの希望</span>
            <select
              value={form.updateFriendliness ?? ""}
              onChange={(e) => setForm({ ...form, updateFriendliness: (e.target.value || null) as UpdateFriendliness | null })}
            >
              <option value="">未選択</option>
              {UPDATE_FRIENDLINESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={common.field}>
          <span>対応端末（複数選択可）</span>
          <div className={common.toolbar}>
            {SUPPORTED_DEVICE_OPTIONS.map((o) => (
              <label key={o.value} className={common.checkboxField}>
                <input type="checkbox" checked={form.supportedDevices.includes(o.value)} onChange={() => toggleDevice(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        <div className={common.toolbar}>
          <label className={common.checkboxField}>
            <input type="checkbox" checked={form.seoEnabled} onChange={(e) => setForm({ ...form, seoEnabled: e.target.checked })} />
            SEO対応
          </label>
          <label className={common.checkboxField}>
            <input
              type="checkbox"
              checked={form.accessibilityEnabled}
              onChange={(e) => setForm({ ...form, accessibilityEnabled: e.target.checked })}
            />
            アクセシビリティ対応
          </label>
          <label className={common.checkboxField}>
            <input type="checkbox" checked={form.mapEnabled} onChange={(e) => setForm({ ...form, mapEnabled: e.target.checked })} />
            Googleマップ埋め込み
          </label>
          <label className={common.checkboxField}>
            <input type="checkbox" checked={form.snsEnabled} onChange={(e) => setForm({ ...form, snsEnabled: e.target.checked })} />
            SNSリンク
          </label>
          <label className={common.checkboxField}>
            <input type="checkbox" checked={form.formEnabled} onChange={(e) => setForm({ ...form, formEnabled: e.target.checked })} />
            フォーム
          </label>
          <label className={common.checkboxField}>
            <input
              type="checkbox"
              checked={form.animationEnabled}
              onChange={(e) => setForm({ ...form, animationEnabled: e.target.checked })}
            />
            アニメーション
          </label>
        </div>

        <label className={common.field}>
          <span>外部サービス連携（自由記述）</span>
          <input
            value={form.externalIntegrations ?? ""}
            onChange={(e) => setForm({ ...form, externalIntegrations: e.target.value || null })}
          />
        </label>

        {error && <p className={common.errorText}>{error}</p>}
        <div className={common.toolbar}>
          <button type="button" className={common.buttonPrimary} onClick={save} disabled={saving}>
            {saving ? "保存中..." : "保存する"}
          </button>
          {saved && <span className={common.successText}>保存しました</span>}
        </div>
      </div>

      <SectionsManager storeId={storeId} />
    </div>
  );
}
