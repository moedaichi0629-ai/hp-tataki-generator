"use client";

import { useCallback, useEffect, useState } from "react";
import common from "@/styles/common.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import StoreTableRow from "./StoreTableRow";
import { STORE_STATUS_OPTIONS, OFFICIAL_WEBSITE_STATUS_OPTIONS } from "@/lib/storeStatus";
import type { Store } from "@/types/store";

const SORT_OPTIONS = [
  { value: "created_desc", label: "登録日の新しい順" },
  { value: "created_asc", label: "登録日の古い順" },
  { value: "rating_desc", label: "評価が高い順" },
  { value: "reviews_desc", label: "口コミ数が多い順" },
  { value: "name_asc", label: "店舗名順" },
  { value: "updated_desc", label: "更新日の新しい順" },
];

const PAGE_SIZE = 20;

interface Filters {
  name: string;
  region: string;
  industry: string;
  storeStatus: string;
  officialWebsiteStatus: string;
  isSalesTarget: string;
  minRating: string;
  minReviews: string;
}

const EMPTY_FILTERS: Filters = {
  name: "",
  region: "",
  industry: "",
  storeStatus: "",
  officialWebsiteStatus: "",
  isSalesTarget: "",
  minRating: "",
  minReviews: "",
};

export default function StoresPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState("created_desc");
  const [page, setPage] = useState(1);
  const [stores, setStores] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.name) params.set("name", appliedFilters.name);
      if (appliedFilters.region) params.set("region", appliedFilters.region);
      if (appliedFilters.industry) params.set("industry", appliedFilters.industry);
      if (appliedFilters.storeStatus) params.set("storeStatus", appliedFilters.storeStatus);
      if (appliedFilters.officialWebsiteStatus) params.set("officialWebsiteStatus", appliedFilters.officialWebsiteStatus);
      if (appliedFilters.isSalesTarget) params.set("isSalesTarget", appliedFilters.isSalesTarget);
      if (appliedFilters.minRating) params.set("minRating", appliedFilters.minRating);
      if (appliedFilters.minReviews) params.set("minReviews", appliedFilters.minReviews);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/stores?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "店舗一覧の取得に失敗しました。");
      setStores(data.stores as Store[]);
      setTotal(data.total as number);
    } catch (err) {
      setError(err instanceof Error ? err.message : "店舗一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, sort, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data reload on filter/sort/page change
    load();
  }, [load]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <Breadcrumbs items={[{ label: "ダッシュボード", href: "/" }, { label: "店舗一覧" }]} />
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>店舗一覧（{total}件）</h1>
      </div>

      <div className={common.card} style={{ marginBottom: 20 }}>
        <div className={common.formGrid}>
          <label className={common.field}>
            <span>店舗名</span>
            <input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
          </label>
          <label className={common.field}>
            <span>地域（住所に含まれる語）</span>
            <input value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
          </label>
          <label className={common.field}>
            <span>業種</span>
            <input value={filters.industry} onChange={(e) => setFilters({ ...filters, industry: e.target.value })} />
          </label>
          <label className={common.field}>
            <span>店舗ステータス</span>
            <select
              value={filters.storeStatus}
              onChange={(e) => setFilters({ ...filters, storeStatus: e.target.value })}
            >
              <option value="">すべて</option>
              {STORE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.field}>
            <span>公式サイト確認状態</span>
            <select
              value={filters.officialWebsiteStatus}
              onChange={(e) => setFilters({ ...filters, officialWebsiteStatus: e.target.value })}
            >
              <option value="">すべて</option>
              {OFFICIAL_WEBSITE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={common.field}>
            <span>営業対象</span>
            <select
              value={filters.isSalesTarget}
              onChange={(e) => setFilters({ ...filters, isSalesTarget: e.target.value })}
            >
              <option value="">すべて</option>
              <option value="true">営業対象のみ</option>
              <option value="false">対象外のみ</option>
            </select>
          </label>
          <label className={common.field}>
            <span>最低評価</span>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
            />
          </label>
          <label className={common.field}>
            <span>最低口コミ数</span>
            <input
              type="number"
              min={0}
              value={filters.minReviews}
              onChange={(e) => setFilters({ ...filters, minReviews: e.target.value })}
            />
          </label>
        </div>
        <div className={common.toolbar}>
          <button type="button" className={common.buttonPrimary} onClick={applyFilters}>
            絞り込む
          </button>
          <button type="button" className={common.button} onClick={resetFilters}>
            リセット
          </button>
          <label className={common.field} style={{ marginLeft: "auto" }}>
            <span>並び替え</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && <p className={common.loading}>読み込み中...</p>}
      {error && <p className={common.errorText}>{error}</p>}

      {!loading && !error && stores.length === 0 && (
        <p className={common.emptyState}>該当する店舗が見つかりませんでした。</p>
      )}

      {!loading && !error && stores.length > 0 && (
        <>
          <div className={common.tableWrapper}>
            <table className={common.table}>
              <thead>
                <tr>
                  <th>店舗名</th>
                  <th>業種</th>
                  <th>住所</th>
                  <th>評価</th>
                  <th>口コミ数</th>
                  <th>公式サイト確認状態</th>
                  <th>店舗ステータス</th>
                  <th>営業対象</th>
                  <th>登録日</th>
                  <th>更新日</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <StoreTableRow
                    key={store.id}
                    store={store}
                    onChanged={(updated) =>
                      setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
                    }
                    onDeleted={(id) => {
                      setStores((prev) => prev.filter((s) => s.id !== id));
                      setTotal((t) => Math.max(0, t - 1));
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className={common.toolbar} style={{ marginTop: 16, justifyContent: "center" }}>
            <button type="button" className={common.button} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              前へ
            </button>
            <span style={{ fontSize: 13 }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className={common.button}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              次へ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
