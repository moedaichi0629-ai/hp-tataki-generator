"use client";

import { useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";

const LEGACY_SEARCH_HISTORY_KEY = "hp-tataki:search-history";
const LEGACY_GENERATION_HISTORY_KEY = "hp-tataki:generation-history";

interface EnvStatus {
  googlePlacesConfigured: boolean;
  openaiConfigured: boolean;
  supabaseUrlConfigured: boolean;
  supabaseKeyConfigured: boolean;
  databaseConnected: boolean;
  databaseError: string | null;
}

interface LegacySearchEntry {
  id: string;
  region: string;
  industry: string;
  resultCount: number;
}

interface LegacyGenerationEntry {
  id: string;
  placeId: string;
  shopName: string;
  region?: string;
  industry?: string;
  type: "site" | "pitch";
}

function readLegacyLocalStorage(): { searchHistory: LegacySearchEntry[]; generationHistory: LegacyGenerationEntry[] } {
  if (typeof window === "undefined") return { searchHistory: [], generationHistory: [] };
  try {
    const search = window.localStorage.getItem(LEGACY_SEARCH_HISTORY_KEY);
    const generation = window.localStorage.getItem(LEGACY_GENERATION_HISTORY_KEY);
    return {
      searchHistory: search ? (JSON.parse(search) as LegacySearchEntry[]) : [],
      generationHistory: generation ? (JSON.parse(generation) as LegacyGenerationEntry[]) : [],
    };
  } catch {
    return { searchHistory: [], generationHistory: [] };
  }
}

function StatusRow({ label, ok, okLabel = "設定済み", ngLabel = "未設定" }: { label: string; ok: boolean; okLabel?: string; ngLabel?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
      <span>{label}</span>
      <span style={{ color: ok ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>{ok ? okLabel : ngLabel}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [legacyData] = useState<{ searchHistory: LegacySearchEntry[]; generationHistory: LegacyGenerationEntry[] }>(
    () => readLegacyLocalStorage()
  );
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings/env-status");
      if (res.ok) setEnvStatus(await res.json());
    })();
  }, []);

  const downloadBackup = () => {
    const data = readLegacyLocalStorage();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hp-tataki-legacy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runMigration = async () => {
    if (!legacyData) return;
    setMigrating(true);
    setMigrationError(null);
    setMigrationResult(null);
    try {
      const res = await fetch("/api/migrate/import-legacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(legacyData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "移行に失敗しました。");
      setMigrationResult(
        `検索履歴 ${data.importedSearchHistories} 件、店舗 ${data.importedStores} 件を移行しました。` +
          (data.skippedExistingStores ? `（既存店舗のためスキップ: ${data.skippedExistingStores} 件）` : "") +
          (data.failedStores ? `（取得失敗: ${data.failedStores} 件）` : "") +
          (data.error ? ` ${data.error}` : "")
      );
    } catch (err) {
      setMigrationError(err instanceof Error ? err.message : "移行に失敗しました。");
    } finally {
      setMigrating(false);
    }
  };

  const legacyCount = (legacyData?.searchHistory.length ?? 0) + (legacyData?.generationHistory.length ?? 0);

  return (
    <div>
      <Breadcrumbs items={[{ label: "ダッシュボード", href: "/" }, { label: "設定" }]} />
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>設定</h1>
      </div>

      <div className={common.card} style={{ marginBottom: 20 }}>
        <h2 className={common.sectionTitle}>環境変数の設定状況</h2>
        {envStatus ? (
          <div>
            <StatusRow label="Google Places APIキー" ok={envStatus.googlePlacesConfigured} />
            <StatusRow label="OpenAI APIキー" ok={envStatus.openaiConfigured} />
            <StatusRow label="Supabase Project URL" ok={envStatus.supabaseUrlConfigured} />
            <StatusRow label="Supabase service_role キー" ok={envStatus.supabaseKeyConfigured} />
            <StatusRow label="データベース接続" ok={envStatus.databaseConnected} okLabel="接続OK" ngLabel="未接続" />
            {envStatus.databaseError && <p className={common.errorText}>{envStatus.databaseError}</p>}
          </div>
        ) : (
          <p className={common.loading}>確認中...</p>
        )}
      </div>

      <div className={common.card}>
        <h2 className={common.sectionTitle}>データ移行（旧バージョンからの引き継ぎ）</h2>
        <p className={common.helpText}>
          以前のバージョンでブラウザのlocalStorageに保存されていた検索履歴・生成履歴が見つかった場合、ここからデータベースへ移行できます。
          生成履歴はPlace IDをもとにGoogleマップから最新情報を再取得し、新しい店舗として登録します（既に登録済みのPlace
          IDはスキップされます）。移行前に念のためバックアップのダウンロードをおすすめします。
        </p>

        {legacyCount === 0 ? (
          <p className={common.emptyState}>移行対象の旧データは見つかりませんでした。</p>
        ) : (
          <>
            <p style={{ fontSize: 14 }}>
              検索履歴 {legacyData?.searchHistory.length ?? 0} 件、生成履歴 {legacyData?.generationHistory.length ?? 0} 件が見つかりました。
            </p>
            <div className={common.toolbar}>
              <button type="button" className={common.button} onClick={downloadBackup}>
                バックアップをダウンロード
              </button>
              <button type="button" className={common.buttonPrimary} onClick={runMigration} disabled={migrating}>
                {migrating ? "移行中..." : "データ移行を実行する"}
              </button>
            </div>
          </>
        )}

        {migrationResult && <p className={common.successText}>{migrationResult}</p>}
        {migrationError && <p className={common.errorText}>{migrationError}</p>}
      </div>
    </div>
  );
}
