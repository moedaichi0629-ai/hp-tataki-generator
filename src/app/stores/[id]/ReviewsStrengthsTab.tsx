"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import styles from "./detail.module.css";
import type { StoreReview, StoreStrengths } from "@/types/store";

const STRENGTH_FIELDS: { key: keyof StoreStrengths; label: string }[] = [
  { key: "goodPoints", label: "よく評価されている点" },
  { key: "atmosphere", label: "店舗の雰囲気" },
  { key: "serviceQuality", label: "接客面の特徴" },
  { key: "differentiators", label: "商品・サービスの特徴、他店との差別化ポイント" },
  { key: "accessNotes", label: "アクセス面の特徴" },
  { key: "targetCustomer", label: "想定ターゲット" },
  { key: "potentialConcerns", label: "利用者が感じそうな不安" },
  { key: "hpKeyMessages", label: "HPで伝えるべき内容" },
  { key: "recommendedCta", label: "おすすめの予約・問い合わせ導線" },
  { key: "cautions", label: "注意点" },
  { key: "improvementCandidates", label: "改善候補" },
];

type StrengthsFormState = Record<string, string>;

function toFormState(s: StoreStrengths): StrengthsFormState {
  const state: StrengthsFormState = {};
  for (const f of STRENGTH_FIELDS) {
    state[f.key] = (s[f.key] as string | null) ?? "";
  }
  return state;
}

export default function ReviewsStrengthsTab({ storeId }: { storeId: string }) {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [form, setForm] = useState<StrengthsFormState>({});
  const [aiGenerated, setAiGenerated] = useState(false);
  const [strengthsLoading, setStrengthsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [strengthsError, setStrengthsError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadReviews = async () => {
    setReviewsLoading(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/reviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "口コミの取得に失敗しました。");
      setReviews(data.reviews as StoreReview[]);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "口コミの取得に失敗しました。");
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadStrengths = async () => {
    setStrengthsLoading(true);
    setStrengthsError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/strengths`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "強み情報の取得に失敗しました。");
      setForm(toFormState(data.strengths as StoreStrengths));
      setAiGenerated(Boolean((data.strengths as StoreStrengths).aiGenerated));
    } catch (err) {
      setStrengthsError(err instanceof Error ? err.message : "強み情報の取得に失敗しました。");
    } finally {
      setStrengthsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    loadReviews();
     
    loadStrengths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const syncReviews = async () => {
    setSyncing(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/reviews/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "口コミの取得に失敗しました。");
      setReviews(data.reviews as StoreReview[]);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "口コミの取得に失敗しました。");
    } finally {
      setSyncing(false);
    }
  };

  const saveStrengths = async () => {
    setSaving(true);
    setStrengthsError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/stores/${storeId}/strengths`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, aiGenerated, aiDisclaimerShown: aiGenerated || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました。");
      setForm(toFormState(data.strengths as StoreStrengths));
      setSaved(true);
    } catch (err) {
      setStrengthsError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const generateAiDraft = async () => {
    if (
      Object.values(form).some((v) => v.trim()) &&
      !window.confirm("既に入力されている内容があります。AI下書きで上書きしますか？")
    ) {
      return;
    }
    setAiLoading(true);
    setStrengthsError(null);
    try {
      const res = await fetch(`/api/stores/${storeId}/strengths/ai-draft`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI下書きの生成に失敗しました。");
      setForm((prev) => ({ ...prev, ...data.draft }));
      setAiGenerated(true);
    } catch (err) {
      setStrengthsError(err instanceof Error ? err.message : "AI下書きの生成に失敗しました。");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className={common.card}>
        <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
          <h2 className={common.sectionTitle}>口コミ</h2>
          <button type="button" className={common.button} onClick={syncReviews} disabled={syncing}>
            {syncing ? "取得中..." : "Googleから最新の口コミを取得"}
          </button>
        </div>
        <p className={common.helpText}>
          この口コミはGoogleマップから取得しています。(Data Source: Google Maps Platform)
        </p>

        {reviewError && <p className={common.errorText}>{reviewError}</p>}
        {reviewsLoading ? (
          <p className={common.loading}>読み込み中...</p>
        ) : reviews.length === 0 ? (
          <p className={common.emptyState}>まだ口コミを取得していません。</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((review) => (
              <div key={review.id} className={styles.reviewItem}>
                <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
                  <strong>{review.authorName ?? "匿名"}</strong>
                  <span>{review.rating != null ? `評価: ${review.rating}` : ""}</span>
                </div>
                {review.reviewText && <p style={{ fontSize: 14 }}>{review.reviewText}</p>}
                <span className={common.helpText}>
                  {review.postedAt ? new Date(review.postedAt).toLocaleDateString("ja-JP") : ""}（Googleマップより取得
                  {review.fetchedAt ? `: ${new Date(review.fetchedAt).toLocaleDateString("ja-JP")}` : ""}）
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={common.card}>
        <h2 className={common.sectionTitle}>店舗の強み整理</h2>
        <div className={common.toolbar}>
          <button type="button" className={common.button} onClick={generateAiDraft} disabled={aiLoading}>
            {aiLoading ? "生成中..." : "AIで下書きを作成"}
          </button>
        </div>

        {aiGenerated && (
          <p className={common.disclaimer}>
            AIによる分析結果です。事実と異なる可能性があるため、内容を確認してから使用してください。
          </p>
        )}

        {strengthsError && <p className={common.errorText}>{strengthsError}</p>}
        {strengthsLoading ? (
          <p className={common.loading}>読み込み中...</p>
        ) : (
          <>
            <div className={common.formGrid}>
              {STRENGTH_FIELDS.map((f) => (
                <label key={f.key} className={`${common.field} ${common.fieldFullWidth}`}>
                  <span>{f.label}</span>
                  <textarea
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <div className={common.toolbar}>
              <button type="button" className={common.buttonPrimary} onClick={saveStrengths} disabled={saving}>
                {saving ? "保存中..." : "保存する"}
              </button>
              {saved && <span className={common.successText}>保存しました</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
