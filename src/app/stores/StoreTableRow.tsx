"use client";

import { useState } from "react";
import Link from "next/link";
import common from "@/styles/common.module.css";
import StoreStatusSelect from "@/components/StoreStatusSelect";
import OfficialWebsiteStatusSelect from "@/components/OfficialWebsiteStatusSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import DuplicateCandidatesDialog from "@/components/DuplicateCandidatesDialog";
import type { Store, StoreStatus, OfficialWebsiteStatus } from "@/types/store";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP");
}

export default function StoreTableRow({
  store,
  onChanged,
  onDeleted,
}: {
  store: Store;
  onChanged: (updated: Store) => void;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState<Store[]>([]);
  const [error, setError] = useState<string | null>(null);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新に失敗しました。");
      onChanged(data.store as Store);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/stores/${store.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "削除に失敗しました。");
      onDeleted(store.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
      setBusy(false);
    }
  };

  const checkDuplicates = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/stores/${store.id}/duplicates`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "重複候補の取得に失敗しました。");
      setDuplicateCandidates(data.candidates as Store[]);
      setDuplicatesOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重複候補の取得に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <tr>
        <td>
          <Link href={`/stores/${store.id}`} style={{ fontWeight: 600, color: "var(--accent)" }}>
            {store.name}
          </Link>
        </td>
        <td>{store.industry || "-"}</td>
        <td>{store.address || "-"}</td>
        <td>{store.googleRating ?? "-"}</td>
        <td>{store.googleReviewCount ?? "-"}</td>
        <td>
          <OfficialWebsiteStatusSelect
            value={store.officialWebsiteStatus}
            disabled={busy}
            onChange={(value: OfficialWebsiteStatus) => patch({ officialWebsiteStatus: value })}
          />
        </td>
        <td>
          <StoreStatusSelect
            value={store.storeStatus}
            disabled={busy}
            onChange={(value: StoreStatus) => patch({ storeStatus: value })}
          />
        </td>
        <td>
          <label className={common.checkboxField}>
            <input
              type="checkbox"
              checked={store.isSalesTarget}
              disabled={busy}
              onChange={(e) => patch({ isSalesTarget: e.target.checked })}
            />
            営業対象
          </label>
        </td>
        <td>
          <label className={common.checkboxField}>
            <input
              type="checkbox"
              checked={store.salesContacted}
              disabled={busy}
              onChange={(e) => patch({ salesContacted: e.target.checked })}
            />
            営業済み
          </label>
        </td>
        <td>{formatDate(store.createdAt)}</td>
        <td>{formatDate(store.updatedAt)}</td>
        <td>
          <div style={{ display: "flex", gap: 6 }}>
            <Link href={`/stores/${store.id}/edit`} className={common.button}>
              編集
            </Link>
            <button type="button" className={common.button} onClick={checkDuplicates} disabled={busy}>
              重複確認
            </button>
            <button type="button" className={common.buttonDanger} onClick={() => setConfirmOpen(true)} disabled={busy}>
              削除
            </button>
          </div>
          {error && (
            <p className={common.errorText} style={{ fontSize: 12, marginTop: 4 }}>
              {error}
            </p>
          )}
        </td>
      </tr>

      <ConfirmDialog
        open={confirmOpen}
        title="店舗を削除しますか？"
        message={`「${store.name}」を削除します。アップロード済みの画像も含めて削除され、この操作は取り消せません。`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <DuplicateCandidatesDialog
        open={duplicatesOpen}
        candidates={duplicateCandidates}
        onClose={() => setDuplicatesOpen(false)}
      />
    </>
  );
}
