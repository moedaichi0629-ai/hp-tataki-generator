"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import common from "@/styles/common.module.css";
import styles from "./detail.module.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import StoreStatusBadge from "@/components/StoreStatusBadge";
import StoreStatusSelect from "@/components/StoreStatusSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import BasicInfoTab from "./BasicInfoTab";
import ServicesTab from "./ServicesTab";
import ReviewsStrengthsTab from "./ReviewsStrengthsTab";
import ManagementNotesTab from "./ManagementNotesTab";
import ImagesTab from "./images/ImagesTab";
import RequirementsTab from "./requirements/RequirementsTab";
import PromptsTab from "./prompts/PromptsTab";
import type { Store, StoreStatus } from "@/types/store";

type TabKey = "basic" | "services" | "reviews" | "images" | "requirements" | "prompts" | "management";

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "基本情報" },
  { key: "services", label: "サービス・メニュー" },
  { key: "reviews", label: "口コミ・強み" },
  { key: "images", label: "画像管理" },
  { key: "requirements", label: "HP制作条件" },
  { key: "prompts", label: "プロンプト" },
  { key: "management", label: "メモ・管理情報" },
];

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "done" };

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [tab, setTab] = useState<TabKey>("basic");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/stores/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "店舗情報の取得に失敗しました。");
        if (!cancelled) {
          setStore(data.store as Store);
          setLoadState({ status: "done" });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            status: "error",
            message: error instanceof Error ? error.message : "店舗情報の取得に失敗しました。",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const changeStatus = async (status: StoreStatus) => {
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/stores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeStatus: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ステータスの更新に失敗しました。");
      setStore(data.store as Store);
    } catch (error) {
      console.error(error);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    try {
      const res = await fetch(`/api/stores/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました。");
      router.push("/stores");
    } catch (error) {
      console.error(error);
    }
  };

  if (loadState.status === "loading") {
    return <p className={common.loading}>読み込み中...</p>;
  }
  if (loadState.status === "error" || !store) {
    return <p className={common.errorText}>{loadState.status === "error" ? loadState.message : "店舗が見つかりませんでした。"}</p>;
  }

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "ダッシュボード", href: "/" }, { label: "店舗一覧", href: "/stores" }, { label: store.name }]}
      />

      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className={styles.title}>{store.name}</h1>
            <StoreStatusBadge status={store.storeStatus} />
          </div>
          <div className={styles.subMeta}>
            <span>登録日: {new Date(store.createdAt).toLocaleDateString("ja-JP")}</span>
            <span>更新日: {new Date(store.updatedAt).toLocaleDateString("ja-JP")}</span>
            <span>{store.isSalesTarget ? "営業対象" : "対象外"}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <StoreStatusSelect value={store.storeStatus} onChange={changeStatus} disabled={statusSaving} />
          <a href={`/stores/${store.id}/edit`} className={common.buttonPrimary}>
            編集する
          </a>
          <button type="button" className={common.buttonDanger} onClick={() => setDeleteOpen(true)}>
            削除する
          </button>
        </div>
      </div>

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

      {tab === "basic" && <BasicInfoTab store={store} />}
      {tab === "services" && <ServicesTab storeId={store.id} />}
      {tab === "reviews" && <ReviewsStrengthsTab storeId={store.id} />}
      {tab === "images" && <ImagesTab storeId={store.id} />}
      {tab === "requirements" && <RequirementsTab storeId={store.id} />}
      {tab === "prompts" && <PromptsTab storeId={store.id} />}
      {tab === "management" && <ManagementNotesTab store={store} onStoreChanged={setStore} />}

      <ConfirmDialog
        open={deleteOpen}
        title="店舗を削除しますか？"
        message={`「${store.name}」を削除します。アップロード済みの画像も含めて削除され、この操作は取り消せません。`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
