"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import common from "@/styles/common.module.css";
import StoreStatusBadge from "@/components/StoreStatusBadge";
import { OFFICIAL_WEBSITE_STATUS_LABELS } from "@/lib/storeStatus";
import type { Store } from "@/types/store";

interface DashboardData {
  totalStores: number;
  newStoresThisMonth: number;
  noWebsiteCount: number;
  unconfirmedWebsiteCount: number;
  infoCheckingCount: number;
  salesTargetCount: number;
  notTargetCount: number;
  requirementsMissingCount: number;
  imagesInsufficientCount: number;
  recentCreatedStores: Store[];
  recentUpdatedStores: Store[];
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "done"; data: DashboardData };

function StoreMiniList({ stores, emptyLabel }: { stores: Store[]; emptyLabel: string }) {
  if (stores.length === 0) {
    return <p className={common.emptyState}>{emptyLabel}</p>;
  }
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
      {stores.map((store) => (
        <li key={store.id}>
          <Link
            href={`/stores/${store.id}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {OFFICIAL_WEBSITE_STATUS_LABELS[store.officialWebsiteStatus]}
              </span>
            </span>
            <StoreStatusBadge status={store.storeStatus} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "ダッシュボード情報の取得に失敗しました。");
        if (!cancelled) setState({ status: "done", data });
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "ダッシュボード情報の取得に失敗しました。",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>ダッシュボード</h1>
      </div>

      <div className={common.toolbar} style={{ marginBottom: 24 }}>
        <Link href="/search" className={common.buttonPrimary}>
          店舗を検索する
        </Link>
        <Link href="/search?tab=map_url" className={common.button}>
          GoogleマップURLから登録する
        </Link>
        <Link href="/stores" className={common.button}>
          店舗一覧を見る
        </Link>
        <Link href="/stores" className={common.button}>
          HP制作条件を入力する
        </Link>
      </div>

      {state.status === "loading" && <p className={common.loading}>読み込み中...</p>}
      {state.status === "error" && <p className={common.errorText}>{state.message}</p>}

      {state.status === "done" && (
        <>
          <div className={common.statGrid}>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.totalStores}</span>
              <span className={common.statLabel}>登録店舗数</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.newStoresThisMonth}</span>
              <span className={common.statLabel}>今月の新規登録</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.noWebsiteCount}</span>
              <span className={common.statLabel}>公式サイトなし候補数</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.unconfirmedWebsiteCount}</span>
              <span className={common.statLabel}>公式サイト未確認数</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.infoCheckingCount}</span>
              <span className={common.statLabel}>情報確認中の店舗数</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.salesTargetCount}</span>
              <span className={common.statLabel}>営業対象店舗数</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.notTargetCount}</span>
              <span className={common.statLabel}>対象外店舗数</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.requirementsMissingCount}</span>
              <span className={common.statLabel}>HP制作条件未入力数</span>
            </div>
            <div className={common.statCard}>
              <span className={common.statValue}>{state.data.imagesInsufficientCount}</span>
              <span className={common.statLabel}>画像準備不足店舗数</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div className={common.card}>
              <h2 className={common.sectionTitle}>最近登録した店舗</h2>
              <StoreMiniList stores={state.data.recentCreatedStores} emptyLabel="まだ店舗が登録されていません。" />
            </div>
            <div className={common.card}>
              <h2 className={common.sectionTitle}>最近更新した店舗</h2>
              <StoreMiniList stores={state.data.recentUpdatedStores} emptyLabel="まだ更新履歴がありません。" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
