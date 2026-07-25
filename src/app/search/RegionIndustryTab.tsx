"use client";

import { useState, type FormEvent } from "react";
import common from "@/styles/common.module.css";
import styles from "./search.module.css";
import PlaceResultCard from "./PlaceResultCard";
import type { PlaceSearchResult } from "@/types/store";

const RADIUS_OPTIONS = [
  { label: "指定しない（エリア全体を検索）", value: 0 },
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
  { label: "3km", value: 3000 },
];

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; shops: PlaceSearchResult[] };

export default function RegionIndustryTab() {
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(0);
  const [maxResults, setMaxResults] = useState(20);
  const [minRating, setMinRating] = useState("");
  const [minReviews, setMinReviews] = useState("");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [excludeRegistered, setExcludeRegistered] = useState(false);
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!region && !industry) {
      setState({ status: "error", message: "地域か業種のどちらかを入力してください。" });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          industry,
          radiusMeters,
          maxResults,
          minRating: minRating ? Number(minRating) : undefined,
          minReviews: minReviews ? Number(minReviews) : undefined,
          openNowOnly,
          noWebsiteOnly,
          excludeRegistered,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "検索に失敗しました。");
      setState({ status: "done", shops: data.shops as PlaceSearchResult[] });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "検索に失敗しました。" });
    }
  };

  return (
    <div>
      <form className={common.card} onSubmit={handleSubmit}>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>地域（任意）</span>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="例: 広島県 / 渋谷駅周辺" />
          </label>
          <label className={common.field}>
            <span>業種・キーワード（任意）</span>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="例: 美容室" />
          </label>
          <label className={common.field}>
            <span>検索範囲</span>
            <select value={radiusMeters} onChange={(e) => setRadiusMeters(Number(e.target.value))}>
              {RADIUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.field}>
            <span>取得件数（最大60）</span>
            <input
              type="number"
              min={1}
              max={60}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
            />
          </label>
          <label className={common.field}>
            <span>最低評価</span>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              placeholder="例: 3.5"
            />
          </label>
          <label className={common.field}>
            <span>最低口コミ数</span>
            <input
              type="number"
              min={0}
              value={minReviews}
              onChange={(e) => setMinReviews(e.target.value)}
              placeholder="例: 10"
            />
          </label>
        </div>

        <div className={styles.checkboxRow}>
          <label className={common.checkboxField}>
            <input type="checkbox" checked={openNowOnly} onChange={(e) => setOpenNowOnly(e.target.checked)} />
            営業中のみ
          </label>
          <label className={common.checkboxField}>
            <input type="checkbox" checked={noWebsiteOnly} onChange={(e) => setNoWebsiteOnly(e.target.checked)} />
            公式サイトなし候補のみ
          </label>
          <label className={common.checkboxField}>
            <input
              type="checkbox"
              checked={excludeRegistered}
              onChange={(e) => setExcludeRegistered(e.target.checked)}
            />
            登録済み店舗を除外する
          </label>
        </div>

        <p className={common.helpText}>
          地域・業種は最低どちらか一方の入力が必要です。業種を空欄にすると、その地域の業種を問わずすべての店舗を検索します。
          地域を空欄にすると、その業種を全国から検索します。「渋谷駅周辺」のように駅名や住所を入力し、検索範囲で500m〜3kmを選ぶと、その地点を中心に絞り込んで検索します。
        </p>

        <button type="submit" className={common.buttonPrimary} disabled={state.status === "loading"}>
          {state.status === "loading" ? "検索中..." : "検索する"}
        </button>
      </form>

      {state.status === "error" && (
        <p className={common.errorText} style={{ marginTop: 16 }}>
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <>
          <p style={{ marginTop: 16, fontWeight: 600 }}>{state.shops.length} 件見つかりました。</p>
          <ul className={styles.resultList}>
            {state.shops.map((shop) => (
              <PlaceResultCard key={shop.placeId} place={shop} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
