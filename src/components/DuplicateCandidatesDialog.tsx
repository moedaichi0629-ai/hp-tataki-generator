"use client";

import Link from "next/link";
import styles from "./ConfirmDialog.module.css";
import type { Store } from "@/types/store";

export default function DuplicateCandidatesDialog({
  open,
  candidates,
  onClose,
}: {
  open: boolean;
  candidates: Store[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>重複候補</h2>
        {candidates.length === 0 ? (
          <p className={styles.message}>重複の可能性がある店舗は見つかりませんでした。</p>
        ) : (
          <>
            <p className={styles.message}>
              店名・住所・電話番号・緯度経度から、以下の店舗が重複している可能性があります。
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {candidates.map((c) => (
                <li key={c.id}>
                  <Link href={`/stores/${c.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                    {c.name}（{c.address || "住所不明"}）
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.confirmButton} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
