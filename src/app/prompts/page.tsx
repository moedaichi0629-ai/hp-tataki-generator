"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import common from "@/styles/common.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PROMPT_AI_TOOL_OPTIONS, PROMPT_AI_TOOL_LABELS, PROMPT_TYPE_OPTIONS, PROMPT_TYPE_LABELS } from "@/lib/promptOptions";
import type { GeneratedPrompt } from "@/types/prompt";

interface PromptResult {
  prompt: GeneratedPrompt;
  storeName: string;
  isStale: boolean;
}

interface Filters {
  storeName: string;
  aiTool: string;
  promptType: string;
  isUsed: string;
  freshness: string;
}

const EMPTY_FILTERS: Filters = { storeName: "", aiTool: "", promptType: "", isUsed: "", freshness: "" };

export default function GlobalPromptsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [results, setResults] = useState<PromptResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (applied.storeName) params.set("storeName", applied.storeName);
      if (applied.aiTool) params.set("aiTool", applied.aiTool);
      if (applied.promptType) params.set("promptType", applied.promptType);
      if (applied.isUsed) params.set("isUsed", applied.isUsed);
      if (applied.freshness) params.set("freshness", applied.freshness);

      const res = await fetch(`/api/prompts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "プロンプト履歴の取得に失敗しました。");
      setResults(data.results as PromptResult[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロンプト履歴の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data reload on filter change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "ダッシュボード", href: "/" }, { label: "プロンプト履歴" }]} />
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>プロンプト履歴</h1>
      </div>

      <div className={common.card} style={{ marginBottom: 20 }}>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>店舗名</span>
            <input value={filters.storeName} onChange={(e) => setFilters({ ...filters, storeName: e.target.value })} />
          </label>
          <label className={common.field}>
            <span>AIツール</span>
            <select value={filters.aiTool} onChange={(e) => setFilters({ ...filters, aiTool: e.target.value })}>
              <option value="">すべて</option>
              {PROMPT_AI_TOOL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.field}>
            <span>プロンプト種類</span>
            <select value={filters.promptType} onChange={(e) => setFilters({ ...filters, promptType: e.target.value })}>
              <option value="">すべて</option>
              {PROMPT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.field}>
            <span>使用状況</span>
            <select value={filters.isUsed} onChange={(e) => setFilters({ ...filters, isUsed: e.target.value })}>
              <option value="">すべて</option>
              <option value="true">使用済み</option>
              <option value="false">未使用</option>
            </select>
          </label>
          <label className={common.field}>
            <span>最新情報反映状態</span>
            <select value={filters.freshness} onChange={(e) => setFilters({ ...filters, freshness: e.target.value })}>
              <option value="">すべて</option>
              <option value="fresh">最新</option>
              <option value="stale">古い可能性あり</option>
            </select>
          </label>
        </div>
        <div className={common.toolbar}>
          <button type="button" className={common.buttonPrimary} onClick={() => setApplied(filters)}>
            絞り込む
          </button>
          <button
            type="button"
            className={common.button}
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setApplied(EMPTY_FILTERS);
            }}
          >
            リセット
          </button>
        </div>
      </div>

      {loading && <p className={common.loading}>読み込み中...</p>}
      {error && <p className={common.errorText}>{error}</p>}

      {!loading && !error && results.length === 0 && <p className={common.emptyState}>該当するプロンプトが見つかりませんでした。</p>}

      {!loading && !error && results.length > 0 && (
        <div className={common.tableWrapper}>
          <table className={common.table}>
            <thead>
              <tr>
                <th>タイトル</th>
                <th>店舗名</th>
                <th>種類</th>
                <th>AIツール</th>
                <th>作成日時</th>
                <th>更新日時</th>
                <th>使用済み</th>
                <th>鮮度</th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ prompt, storeName, isStale }) => (
                <tr key={prompt.id}>
                  <td>
                    <Link href={`/stores/${prompt.storeId}/prompts/${prompt.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                      {prompt.title}
                    </Link>
                  </td>
                  <td>{storeName}</td>
                  <td>{PROMPT_TYPE_LABELS[prompt.promptType]}</td>
                  <td>{prompt.aiTool === "other" ? prompt.customAiTool : PROMPT_AI_TOOL_LABELS[prompt.aiTool]}</td>
                  <td>{new Date(prompt.createdAt).toLocaleDateString("ja-JP")}</td>
                  <td>{new Date(prompt.updatedAt).toLocaleDateString("ja-JP")}</td>
                  <td>{prompt.isUsed ? "使用済み" : "未使用"}</td>
                  <td>{isStale ? "古い可能性あり" : "最新"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
