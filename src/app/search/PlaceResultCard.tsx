"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import common from "@/styles/common.module.css";
import styles from "./search.module.css";
import { isOfficialWebsite } from "@/lib/officialWebsite";
import { registerPlace, type RegisterPlaceOptions, type RegisterPlaceResult } from "@/lib/registerPlace";
import type { PlaceSearchResult, Store } from "@/types/store";

type RegisterState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "exists"; store: Store }
  | { status: "duplicates"; candidates: Store[] };

export default function PlaceResultCard({
  place,
  registrationOptions,
  selected,
  onToggleSelected,
  onRegistered,
}: {
  place: PlaceSearchResult;
  registrationOptions?: RegisterPlaceOptions;
  selected?: boolean;
  onToggleSelected?: (checked: boolean) => void;
  onRegistered?: (result: RegisterPlaceResult) => void;
}) {
  const router = useRouter();
  const [state, setState] = useState<RegisterState>({ status: "idle" });

  const register = async (force: boolean) => {
    setState({ status: "loading" });
    const result = await registerPlace(place, { ...registrationOptions, force });
    onRegistered?.(result);

    if (result.status === "created") {
      router.push(`/stores/${result.store.id}`);
      return;
    }
    if (result.status === "exists") {
      setState({ status: "exists", store: result.existingStore });
      return;
    }
    if (result.status === "duplicates") {
      setState({ status: "duplicates", candidates: result.candidates });
      return;
    }
    setState({ status: "error", message: result.message });
  };

  return (
    <li className={styles.resultCard}>
      {onToggleSelected && (
        <label className={common.checkboxField}>
          <input
            type="checkbox"
            checked={Boolean(selected)}
            disabled={Boolean(place.isRegistered)}
            onChange={(e) => onToggleSelected(e.target.checked)}
          />
          選択する
        </label>
      )}
      <h3>{place.name}</h3>
      <dl className={styles.resultMeta}>
        <dt>住所</dt>
        <dd>{place.address || "不明"}</dd>
        <dt>電話番号</dt>
        <dd>{place.phoneNumber ?? "不明"}</dd>
        <dt>評価</dt>
        <dd>
          {place.rating ?? "不明"}
          {place.reviewCount != null ? `（${place.reviewCount}件）` : ""}
        </dd>
        <dt>Googleマップ</dt>
        <dd>
          {place.mapUrl ? (
            <a href={place.mapUrl} target="_blank" rel="noopener noreferrer">
              地図で見る
            </a>
          ) : (
            "不明"
          )}
        </dd>
        {place.website && (
          <>
            <dt>{isOfficialWebsite(place.website) ? "公式サイト" : "参考リンク（公式サイトではありません）"}</dt>
            <dd style={{ wordBreak: "break-all" }}>
              {place.website}
              {!isOfficialWebsite(place.website) && (
                <span className={common.helpText} style={{ display: "block" }}>
                  ※SNSや予約サイト等のリンクです。「公式サイトなし候補のみ」の絞り込みでは対象に含まれます。
                </span>
              )}
            </dd>
          </>
        )}
      </dl>

      {place.isRegistered && <p className={styles.registeredNote}>登録済みの店舗です</p>}

      {state.status === "idle" && (
        <button type="button" className={common.buttonPrimary} onClick={() => register(false)}>
          この店舗を登録する
        </button>
      )}

      {state.status === "loading" && (
        <button type="button" className={common.buttonPrimary} disabled>
          登録中...
        </button>
      )}

      {state.status === "error" && (
        <>
          <p className={common.errorText}>{state.message}</p>
          <button type="button" className={common.button} onClick={() => register(false)}>
            再試行する
          </button>
        </>
      )}

      {state.status === "exists" && (
        <p className={common.helpText}>
          同じPlace IDの店舗が既に登録されています。
          <a href={`/stores/${state.store.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
            登録済みの店舗を見る
          </a>
        </p>
      )}

      {state.status === "duplicates" && (
        <div className={common.card} style={{ background: "var(--surface-muted)" }}>
          <p className={common.helpText}>類似する店舗が既に登録されている可能性があります。</p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {state.candidates.map((c) => (
              <li key={c.id}>
                <a href={`/stores/${c.id}`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {c.name}（{c.address || "住所不明"}）を確認する
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className={common.button} onClick={() => register(true)}>
            重複を無視して新規登録する
          </button>
        </div>
      )}
    </li>
  );
}
