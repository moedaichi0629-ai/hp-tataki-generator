"use client";

import { useState, type FormEvent } from "react";
import common from "@/styles/common.module.css";
import styles from "./search.module.css";
import PlaceResultCard from "./PlaceResultCard";
import type { PlaceSearchResult } from "@/types/store";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; candidates: PlaceSearchResult[] };

export default function MapUrlTab() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setState({ status: "error", message: "GoogleマップのURLを入力してください。" });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/search/resolve-map-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "URLの解決に失敗しました。");
      setState({ status: "done", candidates: data.candidates as PlaceSearchResult[] });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "URLの解決に失敗しました。" });
    }
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
          <ul className={styles.resultList}>
            {state.candidates.map((c) => (
              <PlaceResultCard key={c.placeId} place={c} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
