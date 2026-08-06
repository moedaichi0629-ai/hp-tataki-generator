"use client";

import { useEffect, useState, type FormEvent } from "react";
import common from "@/styles/common.module.css";
import styles from "./search.module.css";
import PlaceResultCard from "./PlaceResultCard";
import { RADIUS_OPTIONS } from "@/lib/searchRadiusOptions";
import { registerPlace } from "@/lib/registerPlace";
import { loadSessionState, saveSessionState } from "@/lib/sessionState";
import type { PlaceSearchResult } from "@/types/store";

const SESSION_KEY = "hp-tataki:search:region_industry";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; shops: PlaceSearchResult[] };

type BulkStatus =
  | { status: "idle" }
  | { status: "running"; done: number; total: number }
  | { status: "done"; created: number; alreadyExists: number; duplicates: number; failed: number };

interface PersistedState {
  region: string;
  industry: string;
  radiusMeters: number;
  maxResults: number;
  minRating: string;
  minReviews: string;
  openNowOnly: boolean;
  noWebsiteOnly: boolean;
  excludeRegistered: boolean;
  searchState: SearchState;
}

export interface RegionIndustryInitial {
  region: string;
  industry: string;
}

export default function RegionIndustryTab({ initial }: { initial?: RegionIndustryInitial }) {
  const [persisted] = useState<PersistedState | null>(() =>
    initial ? null : loadSessionState<PersistedState>(SESSION_KEY)
  );

  const [region, setRegion] = useState(initial?.region ?? persisted?.region ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? persisted?.industry ?? "");
  const [radiusMeters, setRadiusMeters] = useState(persisted?.radiusMeters ?? 0);
  const [maxResults, setMaxResults] = useState(persisted?.maxResults ?? 20);
  const [minRating, setMinRating] = useState(persisted?.minRating ?? "");
  const [minReviews, setMinReviews] = useState(persisted?.minReviews ?? "");
  const [openNowOnly, setOpenNowOnly] = useState(persisted?.openNowOnly ?? false);
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(persisted?.noWebsiteOnly ?? false);
  const [excludeRegistered, setExcludeRegistered] = useState(persisted?.excludeRegistered ?? false);
  const [state, setState] = useState<SearchState>(() => {
    if (initial) return { status: "idle" };
    const restored = persisted?.searchState;
    return restored && restored.status !== "loading" ? restored : { status: "idle" };
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<BulkStatus>({ status: "idle" });

  const runSearch = async (searchRegion: string, searchIndustry: string) => {
    if (!searchRegion && !searchIndustry) {
      setState({ status: "error", message: "地域か業種のどちらかを入力してください。" });
      return;
    }

    setState({ status: "loading" });
    setSelected(new Set());
    setBulkStatus({ status: "idle" });
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: searchRegion,
          industry: searchIndustry,
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(region, industry);
  };

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- re-run a search selected from history on mount
      runSearch(initial.region, initial.industry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveSessionState<PersistedState>(SESSION_KEY, {
      region,
      industry,
      radiusMeters,
      maxResults,
      minRating,
      minReviews,
      openNowOnly,
      noWebsiteOnly,
      excludeRegistered,
      searchState: state,
    });
  }, [region, industry, radiusMeters, maxResults, minRating, minReviews, openNowOnly, noWebsiteOnly, excludeRegistered, state]);

  const markRegistered = (placeId: string) => {
    setState((prev) =>
      prev.status === "done"
        ? { status: "done", shops: prev.shops.map((s) => (s.placeId === placeId ? { ...s, isRegistered: true } : s)) }
        : prev
    );
  };

  const toggleSelected = (placeId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(placeId);
      else next.delete(placeId);
      return next;
    });
  };

  const selectableShops = state.status === "done" ? state.shops.filter((s) => !s.isRegistered) : [];

  const handleBulkRegister = async () => {
    if (state.status !== "done") return;
    const targets = state.shops.filter((s) => selected.has(s.placeId) && !s.isRegistered);
    if (targets.length === 0) return;

    setBulkStatus({ status: "running", done: 0, total: targets.length });
    let created = 0;
    let alreadyExists = 0;
    let duplicates = 0;
    let failed = 0;

    for (const place of targets) {
      const result = await registerPlace(place, {
        registrationRegion: region || null,
        registrationSearchRadiusMeters: radiusMeters || null,
      });
      if (result.status === "created") {
        created += 1;
        markRegistered(place.placeId);
      } else if (result.status === "exists") {
        alreadyExists += 1;
        markRegistered(place.placeId);
      } else if (result.status === "duplicates") {
        duplicates += 1;
      } else {
        failed += 1;
      }
      setBulkStatus((prev) => (prev.status === "running" ? { status: "running", done: prev.done + 1, total: prev.total } : prev));
    }

    setSelected(new Set());
    setBulkStatus({ status: "done", created, alreadyExists, duplicates, failed });
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
          同じ条件で検索すると同じ店舗が返ります。他の店舗も見たい場合は取得件数を増やす（20件を超えると追加取得のため数秒長くかかります）か、地域・業種・検索範囲を変えてください。
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

          {state.shops.length > 0 && (
            <div className={common.toolbar} style={{ marginTop: 12 }}>
              <button
                type="button"
                className={common.button}
                onClick={() => setSelected(new Set(selectableShops.map((s) => s.placeId)))}
                disabled={selectableShops.length === 0 || bulkStatus.status === "running"}
              >
                すべて選択（未登録{selectableShops.length}件）
              </button>
              <button
                type="button"
                className={common.button}
                onClick={() => setSelected(new Set())}
                disabled={selected.size === 0 || bulkStatus.status === "running"}
              >
                選択解除
              </button>
              <span style={{ fontSize: 13 }}>{selected.size}件選択中</span>
              <button
                type="button"
                className={common.buttonPrimary}
                onClick={handleBulkRegister}
                disabled={selected.size === 0 || bulkStatus.status === "running"}
                style={{ marginLeft: "auto" }}
              >
                {bulkStatus.status === "running"
                  ? `登録中... (${bulkStatus.done}/${bulkStatus.total})`
                  : `選択した${selected.size}件をまとめて登録する`}
              </button>
            </div>
          )}

          {bulkStatus.status === "done" && (
            <p className={common.helpText} style={{ marginTop: 8 }}>
              {bulkStatus.created}件登録しました。
              {bulkStatus.alreadyExists > 0 ? `${bulkStatus.alreadyExists}件は既に登録済みでした。` : ""}
              {bulkStatus.duplicates > 0 ? `${bulkStatus.duplicates}件は重複の可能性があるため個別にご確認ください。` : ""}
              {bulkStatus.failed > 0 ? `${bulkStatus.failed}件は登録に失敗しました。` : ""}
            </p>
          )}

          <ul className={styles.resultList}>
            {state.shops.map((shop) => (
              <PlaceResultCard
                key={shop.placeId}
                place={shop}
                registrationOptions={{ registrationRegion: region || null, registrationSearchRadiusMeters: radiusMeters || null }}
                selected={selected.has(shop.placeId)}
                onToggleSelected={(checked) => toggleSelected(shop.placeId, checked)}
                onRegistered={(result) => {
                  if (result.status === "created" || result.status === "exists") {
                    markRegistered(shop.placeId);
                  }
                }}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
