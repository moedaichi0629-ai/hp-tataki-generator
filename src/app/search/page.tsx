"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import common from "@/styles/common.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import RegionIndustryTab from "./RegionIndustryTab";
import MapUrlTab from "./MapUrlTab";
import NameAddressTab from "./NameAddressTab";
import SearchHistoryPanel from "./SearchHistoryPanel";

type TabKey = "region_industry" | "map_url" | "name_address";

const TABS: { key: TabKey; label: string }[] = [
  { key: "region_industry", label: "① 地域×業種で一括検索" },
  { key: "map_url", label: "② GoogleマップURLから登録" },
  { key: "name_address", label: "③ 店名・住所から個別検索" },
];

function SearchPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey | null) ?? "region_industry";
  const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === initialTab) ? initialTab : "region_industry");

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

      {tab === "region_industry" && <RegionIndustryTab />}
      {tab === "map_url" && <MapUrlTab />}
      {tab === "name_address" && <NameAddressTab />}

      <SearchHistoryPanel />
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
