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

export default function NameAddressTab() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setState({ status: "error", message: "店名を入力してください。" });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/search/by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "検索に失敗しました。");
      setState({ status: "done", candidates: data.candidates as PlaceSearchResult[] });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "検索に失敗しました。" });
    }
  };

  return (
    <div>
      <form className={common.card} onSubmit={handleSubmit}>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>店名</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: ○○美容室" />
          </label>
          <label className={common.field}>
            <span>住所（任意）</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="住所が分かる場合は入力してください" />
          </label>
        </div>
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
          <p style={{ marginTop: 16, fontWeight: 600 }}>{state.candidates.length} 件の候補が見つかりました。</p>
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
