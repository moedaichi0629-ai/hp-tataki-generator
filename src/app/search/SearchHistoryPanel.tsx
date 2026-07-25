"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import type { SearchHistory } from "@/types/store";

const SEARCH_TYPE_LABELS: Record<string, string> = {
  region_industry: "地域×業種検索",
  map_url: "GoogleマップURL登録",
  name_address: "店名・住所検索",
};

export default function SearchHistoryPanel() {
  const [histories, setHistories] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/search-histories");
      const data = await res.json();
      if (res.ok) setHistories(data.histories as SearchHistory[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    load();
  }, []);

  const removeOne = async (id: string) => {
    setHistories((prev) => prev.filter((h) => h.id !== id));
    await fetch(`/api/search-histories/${id}`, { method: "DELETE" });
  };

  const clearAll = async () => {
    setHistories([]);
    await fetch("/api/search-histories", { method: "DELETE" });
  };

  if (loading) return null;
  if (histories.length === 0) return null;

  return (
    <div className={common.card} style={{ marginTop: 24 }}>
      <div className={common.toolbar} style={{ justifyContent: "space-between" }}>
        <h2 className={common.sectionTitle}>最近の検索履歴</h2>
        <button type="button" className={common.button} onClick={clearAll}>
          すべて削除
        </button>
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {histories.map((h) => (
          <li
            key={h.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <span>
              {SEARCH_TYPE_LABELS[h.searchType] ?? h.searchType}
              {h.region || h.industry ? `：${h.region ?? ""} ${h.industry ?? ""}` : ""}（結果 {h.resultCount} 件）
            </span>
            <button type="button" className={common.linkButton} onClick={() => removeOne(h.id)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
