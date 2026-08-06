"use client";

import { useEffect, useState, type FormEvent } from "react";
import common from "@/styles/common.module.css";
import styles from "./search.module.css";
import PlaceResultCard from "./PlaceResultCard";
import { registerPlace } from "@/lib/registerPlace";
import { loadSessionState, saveSessionState } from "@/lib/sessionState";
import type { PlaceSearchResult } from "@/types/store";

const SESSION_KEY = "hp-tataki:search:map_url";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; candidates: PlaceSearchResult[] };

type BulkStatus =
  | { status: "idle" }
  | { status: "running"; done: number; total: number }
  | { status: "done"; created: number; alreadyExists: number; duplicates: number; failed: number };

interface PersistedState {
  url: string;
  searchState: SearchState;
}

export default function MapUrlTab({ initialUrl }: { initialUrl?: string }) {
  const [persisted] = useState<PersistedState | null>(() =>
    initialUrl ? null : loadSessionState<PersistedState>(SESSION_KEY)
  );

  const [url, setUrl] = useState(initialUrl ?? persisted?.url ?? "");
  const [state, setState] = useState<SearchState>(() => {
    if (initialUrl) return { status: "idle" };
    const restored = persisted?.searchState;
    return restored && restored.status !== "loading" ? restored : { status: "idle" };
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<BulkStatus>({ status: "idle" });

  const runSearch = async (searchUrl: string) => {
    if (!searchUrl.trim()) {
      setState({ status: "error", message: "GoogleマップのURLを入力してください。" });
      return;
    }

    setState({ status: "loading" });
    setSelected(new Set());
    setBulkStatus({ status: "idle" });
    try {
      const res = await fetch("/api/search/resolve-map-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: searchUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "URLの解決に失敗しました。");
      setState({ status: "done", candidates: data.candidates as PlaceSearchResult[] });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "URLの解決に失敗しました。" });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(url);
  };

  useEffect(() => {
    if (initialUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- re-run a search selected from history on mount
      runSearch(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveSessionState<PersistedState>(SESSION_KEY, { url, searchState: state });
  }, [url, state]);

  const markRegistered = (placeId: string) => {
    setState((prev) =>
      prev.status === "done"
        ? { status: "done", candidates: prev.candidates.map((c) => (c.placeId === placeId ? { ...c, isRegistered: true } : c)) }
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

  const selectableCandidates = state.status === "done" ? state.candidates.filter((c) => !c.isRegistered) : [];

  const handleBulkRegister = async () => {
    if (state.status !== "done") return;
    const targets = state.candidates.filter((c) => selected.has(c.placeId) && !c.isRegistered);
    if (targets.length === 0) return;

    setBulkStatus({ status: "running", done: 0, total: targets.length });
    let created = 0;
    let alreadyExists = 0;
    let duplicates = 0;
    let failed = 0;

    for (const place of targets) {
      const result = await registerPlace(place);
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
        <label className={common.field}>
          <span>GoogleマップURL</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/xxxxx または https://www.google.com/maps/place/..."
          />
        </label>
        <p className={common.helpText}>
          通常のGoogleマップURLと短縮URL（maps.app.goo.gl）に対応しています。Place
          IDを直接特定できない場合は、店名・住所・座標から候補を検索し、複数候補があれば選択できます。
        </p>
        <button type="submit" className={common.buttonPrimary} disabled={state.status === "loading"}>
          {state.status === "loading" ? "検索中..." : "URLから店舗を探す"}
        </button>
      </form>

      {state.status === "error" && (
        <p className={common.errorText} style={{ marginTop: 16 }}>
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <>
          <p style={{ marginTop: 16, fontWeight: 600 }}>
            {state.candidates.length > 1
              ? `${state.candidates.length} 件の候補が見つかりました。登録する店舗を選んでください。`
              : "店舗が見つかりました。"}
          </p>

          {state.candidates.length > 1 && (
            <div className={common.toolbar} style={{ marginTop: 12 }}>
              <button
                type="button"
                className={common.button}
                onClick={() => setSelected(new Set(selectableCandidates.map((c) => c.placeId)))}
                disabled={selectableCandidates.length === 0 || bulkStatus.status === "running"}
              >
                すべて選択（未登録{selectableCandidates.length}件）
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
            {state.candidates.map((c) => (
              <PlaceResultCard
                key={c.placeId}
                place={c}
                selected={selected.has(c.placeId)}
                onToggleSelected={state.candidates.length > 1 ? (checked) => toggleSelected(c.placeId, checked) : undefined}
                onRegistered={(result) => {
                  if (result.status === "created" || result.status === "exists") {
                    markRegistered(c.placeId);
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
