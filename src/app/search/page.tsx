"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import common from "@/styles/common.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import RegionIndustryTab from "./RegionIndustryTab";
import MapUrlTab from "./MapUrlTab";
import NameAddressTab from "./NameAddressTab";
import SearchHistoryPanel from "./SearchHistoryPanel";
import { loadSessionState, saveSessionState } from "@/lib/sessionState";
import type { SearchHistory } from "@/types/store";

type TabKey = "region_industry" | "map_url" | "name_address";

const TABS: { key: TabKey; label: string }[] = [
  { key: "region_industry", label: "① 地域×業種で一括検索" },
  { key: "map_url", label: "② GoogleマップURLから登録" },
  { key: "name_address", label: "③ 店名・住所から個別検索" },
];

const ACTIVE_TAB_KEY = "hp-tataki:search:active-tab";

type Selection =
  | { tab: "region_industry"; key: string; region: string; industry: string }
  | { tab: "map_url"; key: string; url: string }
  | { tab: "name_address"; key: string; name: string; address: string };

function SearchPageInner() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabKey | null;
  const initialTab =
    tabFromUrl ?? loadSessionState<TabKey>(ACTIVE_TAB_KEY) ?? "region_industry";
  const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === initialTab) ? initialTab : "region_industry");
  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    saveSessionState(ACTIVE_TAB_KEY, tab);
  }, [tab]);

  const handleHistorySelect = (history: SearchHistory) => {
    const key = `${history.id}-${Date.now()}`;
    if (history.searchType === "region_industry") {
      setSelection({ tab: "region_industry", key, region: history.region ?? "", industry: history.industry ?? "" });
    } else if (history.searchType === "map_url") {
      setSelection({ tab: "map_url", key, url: String(history.params.url ?? "") });
    } else {
      setSelection({
        tab: "name_address",
        key,
        name: String(history.params.name ?? ""),
        address: String(history.params.address ?? ""),
      });
    }
    setTab(history.searchType);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "ダッシュボード", href: "/" }, { label: "店舗検索" }]} />
      <div className={common.pageHeader}>
        <h1 className={common.pageTitle}>店舗検索</h1>
      </div>
      <p className={common.pageLead}>
        3つの方法で店舗を検索し、登録できます。登録前にPlace
        ID・店名・住所・電話番号・緯度経度をもとに重複チェックを行います。
      </p>

      <div className={common.tabs} style={{ marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? common.tabActive : common.tab}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "region_industry" && (
        <RegionIndustryTab
          key={selection?.tab === "region_industry" ? selection.key : "static-region_industry"}
          initial={selection?.tab === "region_industry" ? { region: selection.region, industry: selection.industry } : undefined}
        />
      )}
      {tab === "map_url" && (
        <MapUrlTab
          key={selection?.tab === "map_url" ? selection.key : "static-map_url"}
          initialUrl={selection?.tab === "map_url" ? selection.url : undefined}
        />
      )}
      {tab === "name_address" && (
        <NameAddressTab
          key={selection?.tab === "name_address" ? selection.key : "static-name_address"}
          initial={selection?.tab === "name_address" ? { name: selection.name, address: selection.address } : undefined}
        />
      )}

      <SearchHistoryPanel onSelect={handleHistorySelect} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className={common.loading}>読み込み中...</p>}>
      <SearchPageInner />
    </Suspense>
  );
}
